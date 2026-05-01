import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { BG_COLOR } from "./diveSession.constants";
import { useDiveSession } from "./hooks/useDiveSession";
import { DiveTopBar } from "./components/DiveTopBar";
import { DiveLane } from "./components/DiveLane";
import { DiveControls } from "./components/DiveControls";
import { DiveResult } from "./components/DiveResult";

export function DiveSessionScreen() {
  const { t } = useTranslation("tabs");

  const params = useLocalSearchParams<{
    id: string;
    slug: string;
    title: string;
    maxDepthMeters: string;
    targetHoldSeconds: string;
  }>();

  const templateId        = params.id ?? "";
  const templateSlug      = params.slug ?? "";
  const title             = params.title ?? "Dive";
  const maxDepthMeters    = Math.max(Number(params.maxDepthMeters    || "30"),  1);
  // Use || instead of ?? so "0" falls back to 120
  const targetHoldSeconds = Math.max(Number(params.targetHoldSeconds || "120"), 10);

  const {
    sessionState,
    sessionOutcome,
    holdSeconds,
    currentDepth,
    meterProgress,
    maxReached,
    saving,
    handlePressIn,
    handlePressOut,
    finishDive,
  } = useDiveSession({ templateId, templateSlug, title, maxDepthMeters, targetHoldSeconds });

  const isDone      = sessionState === "done";
  const isHolding   = sessionState === "holding";
  const isSurfacing = sessionState === "surfacing";
  const isIdle      = sessionState === "idle";
  const isCompleted = isDone && sessionOutcome === "completed";

  const statusLabel = isHolding
    ? t("dive_session_descending")
    : isSurfacing
      ? t("dive_session_surfacing")
      : t("dive_session_ready");

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLOR }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <DiveTopBar
          title={title}
          holdSeconds={holdSeconds}
          showBack={isIdle || isDone}
          holdTimeLabel={t("dive_session_hold_time")}
          onBack={() => router.back()}
        />

        {isDone ? (
          <DiveResult
            isCompleted={isCompleted}
            maxReached={maxReached}
            holdSeconds={holdSeconds}
            saving={saving}
            onDone={() => router.back()}
            doneLabel={t("dive_session_done")}
            endedLabel={t("dive_session_ended")}
            doneSubLabel={t("dive_session_done_sub")}
            endedSubLabel={t("dive_session_ended_sub")}
            maxDepthLabel={t("dive_session_max_depth")}
            totalHoldLabel={t("dive_session_total_hold")}
            savingLabel={t("dive_session_saving")}
            doneButtonLabel={t("done", { ns: "common" })}
          />
        ) : (
          <>
            <DiveLane
              maxDepthMeters={maxDepthMeters}
              currentDepth={currentDepth}
              isHolding={isHolding}
              statusLabel={statusLabel}
            />
            <DiveControls
              isHolding={isHolding}
              isSurfacing={isSurfacing}
              meterProgress={meterProgress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onFinish={finishDive}
              holdLabel={t("dive_session_hold")}
              releaseLabel={t("dive_session_release")}
              surfacingLabel={t("dive_session_surfacing")}
              keepHoldingLabel={t("dive_session_keep_holding", { defaultValue: "keep holding" })}
              finishLabel={t("dive_session_finish")}
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}
