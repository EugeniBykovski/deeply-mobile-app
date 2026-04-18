import React, { useCallback, useState } from "react";
import { ScrollView, View, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { i18n } from "@/i18n";

import { ErrorView } from "@/shared/components/ErrorView";
import {
  Skeleton,
  SkeletonRow,
  SkeletonStatRow,
} from "@/shared/components/Skeleton";
import { AppText } from "@/shared/components/AppText";
import { LiIcon } from "@/shared/components/LiIcon";
import { PageTopBar } from "@/shared/components/PageTopBar";

import { useAuthStore } from "@/store/authStore";
import { resultsService } from "@/api/services/results.service";
import type { ResultsSummary, RecentRunItem } from "@/api/types";
import { colors } from "@/theme";
import { useTrainingSessionStore } from "@/store/trainingSessionStore";
import { useDiveSessionStore } from "@/store/diveSessionStore";

// ─── Achievement labels ───────────────────────────────────────────────────────

const ACHIEVEMENT_LABELS: Record<string, string> = {
  FIRST_TRAINING: "First Session",
  FIRST_PRIVATE: "First Custom Training",
  STREAK_3: "3-Day Streak",
  STREAK_7: "7-Day Streak",
  STREAK_30: "30-Day Streak",
  TOTAL_RUNS_25: "25 Sessions Completed",
  TOTAL_RUNS_50: "50 Sessions Completed",
  TOTAL_RUNS_100: "100 Sessions Completed",
  COMPLETE_MAIN_12: "Completed 12-Session Path",
};

const ACHIEVEMENT_ICONS: Record<string, string> = {
  FIRST_TRAINING: "checkmark-circle-fill",
  FIRST_PRIVATE: "bolt",
  STREAK_3: "flame",
  STREAK_7: "flame",
  STREAK_30: "flame",
  TOTAL_RUNS_25: "trend-up-1",
  TOTAL_RUNS_50: "trend-up-1",
  TOTAL_RUNS_100: "trend-up-1",
  COMPLETE_MAIN_12: "checkmark",
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useResultsSummary() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["results", "summary"],
    queryFn: () => resultsService.getSummary(),
    enabled: isAuthenticated,
    staleTime: 0,
    retry: 1,
  });
}

function useRecentRuns() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lang = i18n.language.startsWith("ru") ? "ru" : "en";
  return useQuery({
    queryKey: ["results", "recent", lang],
    queryFn: () => resultsService.getRecentRuns({ lang }),
    enabled: isAuthenticated,
    staleTime: 0,
    retry: 1,
  });
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        gap: 4,
      }}
    >
      <AppText variant="title" weight="bold" accent>
        {value}
      </AppText>
      <AppText variant="caption" secondary style={{ textAlign: "center" }}>
        {label}
      </AppText>
    </View>
  );
}

// ─── Recent run row ───────────────────────────────────────────────────────────

function formatSeconds(s: number | null): string {
  if (!s || s <= 0) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0 && sec > 0) return `${m}m ${sec}s`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

function continueItem(item: RecentRunItem) {
  if (item.type === "dive" && item.templateSlug) {
    router.push({
      pathname: "/dive/[slug]",
      params: { slug: item.templateSlug },
    } as any);
  } else if (
    item.type === "training" &&
    item.templateSlug &&
    item.programSlug
  ) {
    router.push({
      pathname: "/train/[slug]/[trainingSlug]",
      params: { slug: item.programSlug, trainingSlug: item.templateSlug },
    } as any);
  }
}

function canContinue(item: RecentRunItem): boolean {
  if (item.completed) return false;
  if (item.type === "dive") return !!item.templateSlug;
  if (item.type === "training") return !!(item.templateSlug && item.programSlug);
  return false;
}

function RecentRunRow({ item }: { item: RecentRunItem }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = item.completed ? "#3BBFAD" : "#D4915A";
  const iconName = item.completed ? "checkmark-circle-fill" : "clock-fill";
  const typeIcon = item.type === "dive" ? "water-drop-1" : "stopwatch";
  const duration = formatSeconds(item.totalSeconds);
  const resumable = canContinue(item);

  const date = new Date(item.startedAt);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      className="active:opacity-85"
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: item.completed ? `${statusColor}30` : colors.border,
          borderRadius: 14,
          padding: 14,
        }}
      >
        {/* Main row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Type badge */}
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: `${statusColor}15`,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LiIcon name={typeIcon} size={17} color={statusColor} />
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <AppText weight="medium" numberOfLines={1}>
              {item.title}
            </AppText>
            <AppText variant="caption" muted style={{ marginTop: 2 }}>
              {formattedDate} · {formattedTime}
              {duration ? ` · ${duration}` : ""}
            </AppText>
          </View>

          {/* Chevron + status */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <LiIcon name={iconName} size={18} color={statusColor} />
            <LiIcon
              name={expanded ? "chevron-up" : "chevron-down"}
              size={12}
              color={colors.inkMuted}
            />
          </View>
        </View>

        {/* Expanded detail */}
        {expanded && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              gap: 8,
            }}
          >
            {/* Date/time full */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <AppText variant="caption" muted>
                Date
              </AppText>
              <AppText variant="caption">
                {date.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </AppText>
            </View>

            {/* Duration / hold */}
            {item.totalSeconds != null && item.totalSeconds > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <AppText variant="caption" muted>
                  {item.type === "dive" ? "Hold time" : "Duration"}
                </AppText>
                <AppText variant="caption">
                  {formatSeconds(item.totalSeconds)}
                </AppText>
              </View>
            )}

            {/* Max depth (dive only) */}
            {item.type === "dive" && item.maxDepthMeters != null && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <AppText variant="caption" muted>
                  Max depth
                </AppText>
                <AppText variant="caption">{item.maxDepthMeters} m</AppText>
              </View>
            )}

            {/* Type */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <AppText variant="caption" muted>
                Type
              </AppText>
              <AppText
                variant="caption"
                style={{ textTransform: "capitalize" }}
              >
                {item.type}
              </AppText>
            </View>

            {/* Status */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <AppText variant="caption" muted>
                Status
              </AppText>
              <AppText variant="caption" style={{ color: statusColor }}>
                {item.completed ? "Completed" : "Incomplete"}
              </AppText>
            </View>

            {/* Continue button — only for resumable incomplete items */}
            {resumable && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  continueItem(item);
                }}
                className="active:opacity-75"
                style={{
                  marginTop: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: `${colors.accent}18`,
                  borderWidth: 1,
                  borderColor: `${colors.accent}40`,
                  borderRadius: 10,
                  paddingVertical: 10,
                }}
              >
                <LiIcon name="play" size={13} color={colors.accent} />
                <AppText
                  variant="caption"
                  weight="semibold"
                  style={{ color: colors.accent }}
                >
                  Continue
                </AppText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <AppText
      variant="heading"
      weight="semibold"
      style={{ marginBottom: 12, marginTop: 4 }}
    >
      {title}
    </AppText>
  );
}

// ─── Empty / unauthenticated state ────────────────────────────────────────────

function EmptyResultsState() {
  const { t } = useTranslation("tabs");
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: 80,
        gap: 16,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: `${colors.accent}12`,
          borderWidth: 1,
          borderColor: `${colors.accent}30`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LiIcon name="trend-up-1" size={30} color={colors.accent} />
      </View>
      <AppText secondary style={{ textAlign: "center", lineHeight: 22 }}>
        {t("results_empty_hint")}
      </AppText>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ResultsScreen() {
  const { t } = useTranslation("tabs");
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { runs: localRuns } = useTrainingSessionStore();
  const { runs: localDiveRuns } = useDiveSessionStore();

  const summaryQuery = useResultsSummary();
  const recentQuery = useRecentRuns();

  // Refresh when the tab gains focus (e.g. after completing a training).
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      queryClient.invalidateQueries({ queryKey: ["results"] });
    }, [isAuthenticated, queryClient]),
  );

  const handleRefresh = useCallback(() => {
    summaryQuery.refetch();
    recentQuery.refetch();
  }, [summaryQuery, recentQuery]);

  const summary = summaryQuery.data as ResultsSummary | undefined;
  // Recent query failure is non-fatal — show whatever we have.
  const backendRuns: RecentRunItem[] = recentQuery.data ?? [];

  // Merge local session runs with backend runs, deduplicating by trainingId+date proximity.
  // Local runs appear first and are shown even when not authenticated.
  const localTrainingItems: RecentRunItem[] = localRuns.map((r) => ({
    id: r.id,
    type: "training" as const,
    startedAt: r.completedAt,
    completed: r.completed,
    title: r.trainingName,
    totalSeconds: r.totalSeconds > 0 ? r.totalSeconds : null,
    templateSlug: r.trainingSlug ?? null,
    programSlug: r.programSlug ?? null,
  }));

  const localDiveItems: RecentRunItem[] = localDiveRuns.map((r) => ({
    id: r.id,
    type: "dive" as const,
    startedAt: r.completedAt,
    completed: r.completed,
    title: r.templateTitle,
    totalSeconds: r.holdSeconds > 0 ? r.holdSeconds : null,
    maxDepthMeters: r.maxDepthReached > 0 ? r.maxDepthReached : null,
    templateSlug: r.templateSlug ?? null,
    programSlug: null,
  }));

  // Filter out backend runs that match a local run (same title within 5 min)
  const localTrainingIds = new Set(localRuns.map((r) => r.trainingId));
  const localDiveTemplateIds = new Set(localDiveRuns.map((r) => r.templateId));
  const filteredBackend = backendRuns.filter((br) => {
    if (br.type === "training") {
      if (!localTrainingIds.size) return true;
      const matchingLocal = localRuns.find(
        (lr) =>
          lr.trainingId === br.id ||
          (br.title === lr.trainingName &&
            Math.abs(
              new Date(br.startedAt).getTime() -
                new Date(lr.completedAt).getTime(),
            ) <
              5 * 60 * 1000),
      );
      return !matchingLocal;
    }
    if (br.type === "dive") {
      if (!localDiveTemplateIds.size) return true;
      const matchingLocal = localDiveRuns.find(
        (lr) =>
          lr.templateId === br.id ||
          (br.title === lr.templateTitle &&
            Math.abs(
              new Date(br.startedAt).getTime() -
                new Date(lr.completedAt).getTime(),
            ) <
              5 * 60 * 1000),
      );
      return !matchingLocal;
    }
    return true;
  });

  const allLocalItems = [...localTrainingItems, ...localDiveItems].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
  const recentRuns = [...allLocalItems, ...filteredBackend];

  const isLoading = isAuthenticated && summaryQuery.isLoading;
  // Only show a hard error if the primary summary query fails.
  const isError = isAuthenticated && summaryQuery.isError;
  const isFetching =
    (summaryQuery.isFetching || recentQuery.isFetching) && !isLoading;

  const hasAnyData = !!summary || recentRuns.length > 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <StatusBar style="light" />

      <PageTopBar title={t("results_title")} />

      {isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 16, paddingTop: 4 }}>
          <SkeletonStatRow />
          <Skeleton width="40%" height={18} />
          <View style={{ gap: 10 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonRow key={i} badge />
            ))}
          </View>
          <Skeleton width="40%" height={18} />
          <View style={{ gap: 10 }}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} height={64} />
            ))}
          </View>
        </View>
      ) : isError ? (
        <ErrorView
          fullScreen
          message={t("error_connection", { ns: "common" })}
          onRetry={handleRefresh}
        />
      ) : !hasAnyData ? (
        <EmptyResultsState />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          {/* ── Overall stats ── */}
          {summary && (
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                paddingHorizontal: 20,
                paddingTop: 8,
                marginBottom: 24,
              }}
            >
              <StatCard
                value={summary.overall.totalRuns}
                label={t("results_total_runs")}
              />
              <StatCard
                value={summary.overall.currentStreakDays}
                label={t("results_streak")}
              />
            </View>
          )}

          {/* ── Recent activity ── */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <SectionHeader title={t("results_recent")} />
            {recentRuns.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <AppText secondary style={{ textAlign: "center" }}>
                  {t("results_no_recent")}
                </AppText>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {recentRuns.map((item) => (
                  <RecentRunRow key={item.id} item={item} />
                ))}
              </View>
            )}
          </View>

          {/* ── Program progress ── */}
          {summary && summary.programs.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <SectionHeader title={t("results_programs")} />
              <View style={{ gap: 8 }}>
                {summary.programs.map((prog) => {
                  const pct =
                    prog.mainTotal > 0
                      ? Math.round((prog.completedMain / prog.mainTotal) * 100)
                      : 0;
                  return (
                    <View
                      key={prog.key}
                      style={{
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 14,
                        padding: 16,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 10,
                        }}
                      >
                        <AppText weight="medium" style={{ flex: 1 }}>
                          {prog.title}
                        </AppText>
                        <AppText
                          variant="caption"
                          accent
                          style={{ marginLeft: 8 }}
                        >
                          {pct}%
                        </AppText>
                      </View>
                      <View
                        style={{
                          height: 5,
                          backgroundColor: colors.border,
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            backgroundColor:
                              pct === 100 ? "#3BBFAD" : colors.accent,
                            borderRadius: 3,
                          }}
                        />
                      </View>
                      <AppText variant="caption" muted style={{ marginTop: 8 }}>
                        {prog.completedMain} / {prog.mainTotal}{" "}
                        {t("results_sessions")}
                        {prog.completedTotal > prog.completedMain
                          ? `  ·  ${prog.completedTotal} ${t("results_total_done")}`
                          : ""}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Achievements ── */}
          {summary && (
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <SectionHeader title={t("results_achievements")} />
              {summary.achievements.length === 0 ? (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    padding: 20,
                    alignItems: "center",
                  }}
                >
                  <AppText secondary style={{ textAlign: "center" }}>
                    {t("results_no_achievements")}
                  </AppText>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {summary.achievements.map((a, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: `${colors.accent}25`,
                        borderRadius: 14,
                        padding: 14,
                      }}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 11,
                          backgroundColor: `${colors.accent}18`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <LiIcon
                          name={ACHIEVEMENT_ICONS[a.type] ?? "checkmark"}
                          size={18}
                          color={colors.accent}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText weight="medium">
                          {ACHIEVEMENT_LABELS[a.type] ??
                            a.type.replace(/_/g, " ")}
                        </AppText>
                        <AppText
                          variant="caption"
                          muted
                          style={{ marginTop: 2 }}
                        >
                          {new Date(a.unlockedAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </AppText>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── My custom trainings ── */}
          {summary && summary.privateTrainings.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <SectionHeader title={t("results_private")} />
              <View style={{ gap: 8 }}>
                {summary.privateTrainings.map((pt) => (
                  <View
                    key={pt.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        backgroundColor: `${colors.accent}15`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LiIcon name="bolt" size={17} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText weight="medium">{pt.name}</AppText>
                      <AppText variant="caption" muted style={{ marginTop: 2 }}>
                        {pt.runsCount} {t("results_runs")}
                        {pt.bestTotalSeconds != null
                          ? `  ·  ${t("results_best")}: ${formatSeconds(pt.bestTotalSeconds)}`
                          : ""}
                      </AppText>
                    </View>
                    {pt.runsCount > 0 && (
                      <LiIcon
                        name="checkmark-circle-fill"
                        size={18}
                        color="#3BBFAD"
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
