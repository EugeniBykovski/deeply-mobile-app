import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { diveService } from "@/api/services/dive.service";
import { useDiveSessionStore } from "@/store/diveSessionStore";
import { TICK_MS } from "../diveSession.constants";
import type { SessionState, SessionOutcome } from "../diveSession.constants";

interface UseDiveSessionOptions {
  templateId: string;
  templateSlug: string;
  title: string;
  maxDepthMeters: number;
  targetHoldSeconds: number;
}

export interface DiveSessionReturn {
  sessionState: SessionState;
  sessionOutcome: SessionOutcome | null;
  holdSeconds: number;
  depthMeters: number; // single float source-of-truth (0..maxDepthMeters)
  maxReached: number;
  saving: boolean;
  handlePressIn: () => void;
  handlePressOut: () => void;
  finishDive: () => Promise<void>;
}

export function useDiveSession({
  templateId,
  templateSlug,
  title,
  maxDepthMeters,
  targetHoldSeconds,
}: UseDiveSessionOptions): DiveSessionReturn {
  const queryClient       = useQueryClient();
  const addDiveRun        = useDiveSessionStore((s) => s.addRun);
  const updateDiveRunId   = useDiveSessionStore((s) => s.updateRunId);
  const setDiveInProgress = useDiveSessionStore((s) => s.setDiveInProgress);

  // Meters gained per TICK_MS tick while descending
  const descentPerTick = (maxDepthMeters / targetHoldSeconds) * (TICK_MS / 1000);
  // Ascent is faster — mirrors the original 0.67 duration ratio
  const ascentPerTick  = descentPerTick / 0.67;

  const [sessionState,   setSessionState]   = useState<SessionState>("idle");
  const [sessionOutcome, setSessionOutcome] = useState<SessionOutcome | null>(null);
  const [holdSeconds,    setHoldSeconds]    = useState(0);
  const [depthMeters,    setDepthMeters]    = useState(0);
  const [maxReached,     setMaxReached]     = useState(0);
  const [saving,         setSaving]         = useState(false);

  const holdIntervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const depthIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const depthAccumRef      = useRef(0); // fractional meters accumulated
  const totalHoldRef       = useRef(0);
  const maxReachedRef      = useRef(0);
  const reachedMaxDepthRef = useRef(false);

  // ── Hold timer ──────────────────────────────────────────────────────────────

  function startHoldTimer() {
    if (holdIntervalRef.current) return;
    holdIntervalRef.current = setInterval(() => {
      totalHoldRef.current += 1;
      setHoldSeconds(totalHoldRef.current);
    }, 1000);
  }

  function stopHoldTimer() {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }

  // ── Depth progression (meter-by-meter) ─────────────────────────────────────

  function stopDepthInterval() {
    if (depthIntervalRef.current) {
      clearInterval(depthIntervalRef.current);
      depthIntervalRef.current = null;
    }
  }

  // Each tick advances depthAccumRef by descentPerTick. We expose a single
  // depthMeters float so the display layer can derive m/cm with a single rounding
  // operation instead of two separate integer+fraction state values.
  function startDescent() {
    stopDepthInterval();
    depthIntervalRef.current = setInterval(() => {
      depthAccumRef.current = Math.min(
        depthAccumRef.current + descentPerTick,
        maxDepthMeters,
      );
      setDepthMeters(depthAccumRef.current);

      const floored = Math.floor(depthAccumRef.current);
      setMaxReached((prev) => {
        const next = Math.max(prev, floored);
        maxReachedRef.current = next;
        return next;
      });

      if (depthAccumRef.current >= maxDepthMeters) {
        reachedMaxDepthRef.current = true;
        stopDepthInterval();
      }
    }, TICK_MS);
  }

  function startAscent() {
    stopDepthInterval();
    depthIntervalRef.current = setInterval(() => {
      depthAccumRef.current = Math.max(depthAccumRef.current - ascentPerTick, 0);
      setDepthMeters(depthAccumRef.current);
      if (depthAccumRef.current <= 0) {
        depthAccumRef.current = 0;
        stopDepthInterval();
        setSessionState("idle");
      }
    }, TICK_MS);
  }

  useEffect(() => {
    if (sessionState === "idle" || sessionState === "done") {
      setDepthMeters(0);
    }
  }, [sessionState]);

  // ── Controls ────────────────────────────────────────────────────────────────

  function handlePressIn() {
    if (sessionState === "done") return;
    setSessionState("holding");
    setDiveInProgress(templateId);
    startHoldTimer();
    startDescent();
  }

  function handlePressOut() {
    if (sessionState === "done") return;
    stopHoldTimer();
    setSessionState("surfacing");
    startAscent();
  }

  // ── Finish dive ─────────────────────────────────────────────────────────────

  const finishDive = useCallback(async () => {
    stopHoldTimer();
    if (depthIntervalRef.current) {
      clearInterval(depthIntervalRef.current);
      depthIntervalRef.current = null;
    }

    const trueCompleted = reachedMaxDepthRef.current;
    const finalHold     = totalHoldRef.current;
    const finalMaxDepth = maxReachedRef.current;

    setSessionOutcome(trueCompleted ? "completed" : "interrupted");
    setSessionState("done");
    setSaving(true);

    const localId = `dive-local-${Date.now()}`;

    addDiveRun({
      id: localId,
      templateId,
      templateSlug,
      templateTitle: title,
      completedAt: new Date().toISOString(),
      holdSeconds: finalHold,
      maxDepthReached: finalMaxDepth,
      completed: trueCompleted,
    });

    try {
      const saved = await diveService.saveRun({
        templateId,
        holdSeconds: finalHold,
        completed: trueCompleted,
      });
      updateDiveRunId(localId, saved.id);
      queryClient.invalidateQueries({ queryKey: ["results"] });
    } catch {
      // Non-fatal — guest users hit 401
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, templateSlug, title, queryClient, addDiveRun, updateDiveRunId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current)  clearInterval(holdIntervalRef.current);
      if (depthIntervalRef.current) clearInterval(depthIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sessionState,
    sessionOutcome,
    holdSeconds,
    depthMeters,
    maxReached,
    saving,
    handlePressIn,
    handlePressOut,
    finishDive,
  };
}
