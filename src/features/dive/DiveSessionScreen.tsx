import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/shared/components/AppText";
import { LiIcon } from "@/shared/components/LiIcon";
import { diveService } from "@/api/services/dive.service";
import { useDiveSessionStore } from "@/store/diveSessionStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get("window");
const LANE_HEIGHT = SCREEN_H * 0.5;
const DIVER_SIZE = 32;
const TAPE_STEPS = 5;
const BUTTON_SIZE = 120;

const SURFACE_COLOR = "#0d2d3a";
const ABYSS_COLOR = "#030a10";

type SessionState = "idle" | "holding" | "surfacing" | "done";
type SessionOutcome = "completed" | "interrupted";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatTime(s: number) {
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
function formatDepth(d: number) {
  return `${Math.round(d)} m`;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function DiveSessionScreen() {
  const { t } = useTranslation("tabs");
  const queryClient = useQueryClient();
  const addDiveRun = useDiveSessionStore((s) => s.addRun);

  const params = useLocalSearchParams<{
    id: string;
    slug: string;
    title: string;
    maxDepthMeters: string;
    targetHoldSeconds: string;
  }>();

  const templateId = params.id ?? "";
  const templateSlug = params.slug ?? "";
  const title = params.title ?? "Dive";
  const maxDepthMeters = Number(params.maxDepthMeters ?? 30);
  const targetHoldSeconds = Number(params.targetHoldSeconds ?? 120);

  // ── Session state ──────────────────────────────────────────────────────────

  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [sessionOutcome, setSessionOutcome] = useState<SessionOutcome | null>(
    null,
  );
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [saving, setSaving] = useState(false);

  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalHoldRef = useRef(0);
  const maxReachedRef = useRef(0);
  const reachedMaxDepthRef = useRef(false);

  // ── Animated values ────────────────────────────────────────────────────────

  const depthProgress = useSharedValue(0);

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      depthProgress.value,
      [0, 1],
      [SURFACE_COLOR, ABYSS_COLOR],
    ),
  }));

  const diverStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: depthProgress.value * (LANE_HEIGHT - DIVER_SIZE) },
    ],
  }));

  // Poll SharedValue → React state for depth readout + max-depth detection.
  useEffect(() => {
    if (sessionState === "idle" || sessionState === "done") {
      setCurrentDepth(0);
      return;
    }
    const iv = setInterval(() => {
      const approx = Math.round(depthProgress.value * maxDepthMeters);
      setCurrentDepth(approx);
      setMaxReached((prev) => {
        const next = Math.max(prev, approx);
        maxReachedRef.current = next;
        return next;
      });
      if (depthProgress.value >= 0.98) {
        reachedMaxDepthRef.current = true;
      }
    }, 100);
    return () => clearInterval(iv);
  }, [sessionState, maxDepthMeters, depthProgress]);

  // ── Hold timer ─────────────────────────────────────────────────────────────

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

  // ── Descent / ascent ───────────────────────────────────────────────────────

  function startDescent() {
    const remaining = 1 - depthProgress.value;
    const duration = remaining * targetHoldSeconds * 1000;
    depthProgress.value = withTiming(1, { duration, easing: Easing.linear });
  }

  function startAscent() {
    const duration = depthProgress.value * targetHoldSeconds * 1000 * 0.67;
    depthProgress.value = withTiming(0, {
      duration: Math.max(duration, 500),
      easing: Easing.linear,
    });
  }

  // ── Press controls ─────────────────────────────────────────────────────────

  function handlePressIn() {
    if (sessionState === "done") return;
    cancelAnimation(depthProgress);
    setSessionState("holding");
    startHoldTimer();
    startDescent();
  }

  function handlePressOut() {
    if (sessionState === "done") return;
    cancelAnimation(depthProgress);
    stopHoldTimer();
    setSessionState("surfacing");
    startAscent();
  }

  // Return to idle when ascent reaches surface
  useEffect(() => {
    if (sessionState !== "surfacing") return;
    const iv = setInterval(() => {
      if (depthProgress.value <= 0.01) setSessionState("idle");
    }, 200);
    return () => clearInterval(iv);
  }, [sessionState, depthProgress]);

  // ── Finish dive ────────────────────────────────────────────────────────────

  const finishDive = useCallback(async () => {
    stopHoldTimer();
    cancelAnimation(depthProgress);

    const trueCompleted = reachedMaxDepthRef.current;
    const finalHold = totalHoldRef.current;
    const finalMaxDepth = maxReachedRef.current;

    setSessionOutcome(trueCompleted ? "completed" : "interrupted");
    setSessionState("done");
    setSaving(true);

    // Write to local store immediately so Results tab shows it right away
    addDiveRun({
      id: `dive-local-${Date.now()}`,
      templateId,
      templateSlug,
      templateTitle: title,
      completedAt: new Date().toISOString(),
      holdSeconds: finalHold,
      maxDepthReached: finalMaxDepth,
      completed: trueCompleted,
    });

    try {
      await diveService.saveRun({
        templateId,
        holdSeconds: finalHold,
        completed: trueCompleted,
      });
      queryClient.invalidateQueries({ queryKey: ["results"] });
    } catch {
      // Non-fatal — guest users hit 401
    } finally {
      setSaving(false);
    }
  }, [templateId, title, depthProgress, queryClient, addDiveRun]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopHoldTimer();
      cancelAnimation(depthProgress);
    };
  }, [depthProgress]);

  // ── Depth tape ─────────────────────────────────────────────────────────────

  const tapeMarkers: number[] = [];
  for (let m = 0; m <= maxDepthMeters; m += TAPE_STEPS) tapeMarkers.push(m);
  if (tapeMarkers[tapeMarkers.length - 1] !== maxDepthMeters)
    tapeMarkers.push(maxDepthMeters);

  // ── Derived booleans ───────────────────────────────────────────────────────

  const isDone = sessionState === "done";
  const isHolding = sessionState === "holding";
  const isSurfacing = sessionState === "surfacing";
  const isIdle = sessionState === "idle";
  const isCompleted = isDone && sessionOutcome === "completed";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Animated.View style={[{ flex: 1 }, bgStyle]}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          {(isIdle || isDone) && (
            <Pressable
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="active:opacity-60"
              style={{ marginRight: 12 }}
            >
              <LiIcon
                name="arrow-left"
                size={22}
                color="rgba(255,255,255,0.7)"
              />
            </Pressable>
          )}
          <AppText
            weight="semibold"
            style={{ flex: 1, color: "rgba(255,255,255,0.85)" }}
            numberOfLines={1}
          >
            {title}
          </AppText>
          <View style={{ alignItems: "flex-end" }}>
            <AppText
              variant="caption"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {t("dive_session_hold_time")}
            </AppText>
            <AppText weight="bold" style={{ color: "#fff", fontSize: 18 }}>
              {formatTime(holdSeconds)}
            </AppText>
          </View>
        </View>

        {/* ── DONE STATE ── */}
        {isDone ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 28,
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 28,
                backgroundColor: isCompleted
                  ? "rgba(59,191,173,0.18)"
                  : "rgba(212,145,90,0.15)",
                borderWidth: 1,
                borderColor: isCompleted
                  ? "rgba(59,191,173,0.35)"
                  : "rgba(212,145,90,0.3)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <LiIcon
                name={isCompleted ? "check-circle-1" : "water-drop-1"}
                size={44}
                color={isCompleted ? "#3BBFAD" : "#D4915A"}
              />
            </View>

            {/* Title */}
            <AppText
              weight="bold"
              style={{
                color: "#fff",
                fontSize: 20,
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              {isCompleted ? t("dive_session_done") : t("dive_session_ended")}
            </AppText>

            {/* Subtitle */}
            <AppText
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              {isCompleted
                ? t("dive_session_done_sub")
                : t("dive_session_ended_sub")}
            </AppText>

            {/* Stats card */}
            <View
              style={{
                width: "100%",
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: 20,
                paddingVertical: 16,
                paddingHorizontal: 24,
                flexDirection: "row",
                justifyContent: "space-around",
                marginBottom: 32,
              }}
            >
              <View style={{ alignItems: "center", gap: 6 }}>
                <LiIcon
                  name="water-drop-1"
                  size={18}
                  color={isCompleted ? "#3BBFAD" : "#D4915A"}
                />
                <AppText weight="bold" style={{ color: "#fff", fontSize: 20 }}>
                  {maxReached}m
                </AppText>
                <AppText
                  style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}
                >
                  {t("dive_session_max_depth")}
                </AppText>
              </View>

              <View
                style={{
                  width: 1,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  marginVertical: 4,
                }}
              />

              <View style={{ alignItems: "center", gap: 6 }}>
                <LiIcon
                  name="stopwatch"
                  size={18}
                  color="rgba(255,255,255,0.6)"
                />
                <AppText weight="bold" style={{ color: "#fff", fontSize: 20 }}>
                  {formatTime(holdSeconds)}
                </AppText>
                <AppText
                  style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}
                >
                  {t("dive_session_total_hold")}
                </AppText>
              </View>
            </View>

            {/* CTA */}
            {saving ? (
              <AppText
                style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}
              >
                {t("dive_session_saving")}
              </AppText>
            ) : (
              <Pressable
                onPress={() => router.back()}
                className="active:opacity-80"
                style={{
                  width: "100%",
                  backgroundColor: isCompleted
                    ? "#3BBFAD"
                    : "rgba(255,255,255,0.12)",
                  borderRadius: 18,
                  paddingVertical: 17,
                  alignItems: "center",
                  borderWidth: isCompleted ? 0 : 1,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <AppText weight="bold" style={{ color: "#fff", fontSize: 16 }}>
                  {t("done", { ns: "common" })}
                </AppText>
              </Pressable>
            )}
          </View>
        ) : (
          // ── ACTIVE DIVE STATE ────────────────────────────────────────────
          <>
            {/* Current depth display */}
            <View
              style={{ alignItems: "center", paddingTop: 4, paddingBottom: 4 }}
            >
              <AppText
                weight="bold"
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 44,
                  lineHeight: 50,
                }}
              >
                {formatDepth(currentDepth)}
              </AppText>
              <AppText
                style={{
                  color: "rgba(255,255,255,0.38)",
                  fontSize: 12,
                  marginTop: 0,
                }}
              >
                {isHolding
                  ? t("dive_session_descending")
                  : isSurfacing
                    ? t("dive_session_surfacing")
                    : t("dive_session_ready")}
              </AppText>
            </View>

            {/* Depth tape + diver lane */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                paddingHorizontal: 20,
                paddingTop: 4,
              }}
            >
              {/* Left: depth tape */}
              <View
                style={{
                  width: 52,
                  height: LANE_HEIGHT,
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  paddingRight: 10,
                }}
              >
                {tapeMarkers.map((m) => (
                  <View
                    key={m}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 1,
                        backgroundColor: "rgba(255,255,255,0.2)",
                      }}
                    />
                    <AppText
                      style={{
                        color: "rgba(255,255,255,0.35)",
                        fontSize: 10,
                      }}
                    >
                      {m}m
                    </AppText>
                  </View>
                ))}
              </View>

              {/* Centre: lane + diver */}
              <View style={{ flex: 1, position: "relative" }}>
                {/* Rail */}
                <View
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    width: 2,
                    height: LANE_HEIGHT,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    marginLeft: -1,
                    borderRadius: 1,
                  }}
                />
                {/* Target marker at max depth */}
                <View
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: LANE_HEIGHT - 2,
                    width: 24,
                    height: 2,
                    marginLeft: -12,
                    backgroundColor: "rgba(59,191,173,0.5)",
                    borderRadius: 1,
                  }}
                />
                {/* Animated diver */}
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      width: DIVER_SIZE,
                      height: DIVER_SIZE,
                      marginLeft: -(DIVER_SIZE / 2),
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    diverStyle,
                  ]}
                >
                  <View
                    style={{
                      position: "absolute",
                      width: DIVER_SIZE + 20,
                      height: DIVER_SIZE + 20,
                      borderRadius: (DIVER_SIZE + 20) / 2,
                      backgroundColor: isHolding
                        ? "rgba(59,191,173,0.2)"
                        : "rgba(255,255,255,0.06)",
                    }}
                  />
                  <LiIcon
                    name="water-drop-1"
                    size={DIVER_SIZE}
                    color={isHolding ? "#3BBFAD" : "rgba(255,255,255,0.7)"}
                  />
                </Animated.View>
              </View>

              {/* Right spacer */}
              <View style={{ width: 52 }} />
            </View>

            {/* Controls */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 16,
                paddingTop: 8,
                alignItems: "center",
                gap: 14,
              }}
            >
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{
                  width: BUTTON_SIZE,
                  height: BUTTON_SIZE,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  borderRadius: 100,
                  borderWidth: 1,
                  borderColor: isHolding
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(255,255,255,0.22)",
                }}
              >
                <LiIcon
                  name={isSurfacing ? "water-drop-1" : "water-drop-1"}
                  size={28}
                  color={isHolding ? "#3BBFAD" : "rgba(255,255,255,0.55)"}
                />
                <AppText
                  weight="semibold"
                  style={{
                    color: isHolding ? "#3BBFAD" : "rgba(255,255,255,0.55)",
                    fontSize: 11,
                    letterSpacing: 0.2,
                    textAlign: "center",
                    paddingHorizontal: 8,
                  }}
                >
                  {isHolding
                    ? t("dive_session_release")
                    : isSurfacing
                      ? t("dive_session_surfacing")
                      : t("dive_session_hold")}
                </AppText>
              </Pressable>

              {/* Secondary finish button */}
              <Pressable
                onPress={finishDive}
                className="active:opacity-70"
                style={{
                  alignSelf: "stretch",
                  paddingVertical: 13,
                  borderRadius: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <AppText
                  style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}
                >
                  {t("dive_session_finish")}
                </AppText>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
