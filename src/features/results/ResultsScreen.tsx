import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";

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
import { useTrainingSessionStore } from "@/store/trainingSessionStore";
import { useDiveSessionStore } from "@/store/diveSessionStore";
import { resultsService } from "@/api/services/results.service";
import { useResultsSummary, useRecentRuns } from "./hooks/useResultsQueries";
import { StatCard } from "./components/StatCard";
import { RecentRunRow } from "./components/RecentRunRow";
import { EmptyResultsState } from "./components/EmptyResultsState";
import { ACHIEVEMENT_LABELS, ACHIEVEMENT_ICONS } from "./constants";
import { formatSeconds } from "@/utils/format";
import { useLang } from "@/hooks/useLang";
import type { ResultsSummary, RecentRunItem } from "@/api/types";
import { colors } from "@/theme";

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

export function ResultsScreen() {
  const { t } = useTranslation("tabs");
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const lang = useLang();
  const { runs: localRuns, removeRun: removeLocalRun } =
    useTrainingSessionStore();
  const { runs: localDiveRuns, removeRun: removeLocalDiveRun } =
    useDiveSessionStore();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const summaryQuery = useResultsSummary();
  const recentQuery = useRecentRuns();

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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const summary: ResultsSummary | undefined = summaryQuery.data as
    | ResultsSummary
    | undefined;
  const backendRuns: RecentRunItem[] = recentQuery.data ?? [];

  // Merge local session runs with backend runs
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

  // After updateRunId(), local runs carry their real backend UUID as id.
  // Deduplicate by run id: any backend item whose id is already in the local
  // store is a duplicate — remove it. This is robust regardless of whether
  // the backend returns templateId or not.
  const localRunIds = new Set([
    ...localRuns.map((r) => r.id),
    ...localDiveRuns.map((r) => r.id),
  ]);
  const filteredBackend = backendRuns.filter((br) => !localRunIds.has(br.id));

  const allLocalItems = [...localTrainingItems, ...localDiveItems].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  // Defensive uniqueness guard: drop any item whose id has already appeared.
  // Prevents React duplicate-key errors from any upstream race condition.
  const seenIds = new Set<string>();
  const recentRuns = [...allLocalItems, ...filteredBackend].filter((item) => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  const removeFromCache = useCallback(
    (id: string) => {
      queryClient.setQueryData<RecentRunItem[]>(
        ["results", "recent", lang],
        (old) => old?.filter((r) => r.id !== id) ?? [],
      );
    },
    [queryClient, lang],
  );

  const deleteItem = useCallback(
    async (item: RecentRunItem) => {
      // Optimistic removal from local store and cache
      if (item.type === "training") removeLocalRun?.(item.id);
      if (item.type === "dive") removeLocalDiveRun?.(item.id);
      removeFromCache(item.id);

      if (!item.id.startsWith("local-") && !item.id.startsWith("dive-local-")) {
        try {
          console.log("[deleteItem] calling DELETE type=%s id=%s", item.type, item.id);
          await resultsService.deleteRun(item.type as "training" | "dive", item.id);
        } catch (err: any) {
          console.error("[deleteItem] failed status=%s data=%o", err?.response?.status, err?.response?.data);
          Alert.alert("Delete failed", "Could not delete this item. Please try again.");
        }
      }
      queryClient.invalidateQueries({ queryKey: ["results"] });
    },
    [removeLocalRun, removeLocalDiveRun, removeFromCache, queryClient],
  );

  const deleteSelected = useCallback(async () => {
    const ids = [...selectedIds];
    exitSelectionMode();
    for (const id of ids) {
      const item = recentRuns.find((r) => r.id === id);
      if (item) await deleteItem(item);
    }
  }, [selectedIds, exitSelectionMode, deleteItem, recentRuns]);

  const confirmDeleteSelected = useCallback(() => {
    Alert.alert(
      `Delete ${selectedIds.size} item${selectedIds.size > 1 ? "s" : ""}?`,
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteSelected },
      ],
    );
  }, [selectedIds.size, deleteSelected]);

  const deleteAll = useCallback(async () => {
    useTrainingSessionStore.setState({ runs: [] });
    useDiveSessionStore.setState({ runs: [] });
    queryClient.setQueryData<RecentRunItem[]>(["results", "recent", lang], []);
    try {
      await resultsService.deleteAllRuns();
    } catch {
      /* non-fatal */
    }
    queryClient.invalidateQueries({ queryKey: ["results"] });
  }, [queryClient, lang]);

  const confirmDeleteAll = useCallback(() => {
    Alert.alert(
      "Delete all activity?",
      "This will permanently remove all your training and dive runs.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete All", style: "destructive", onPress: deleteAll },
      ],
    );
  }, [deleteAll]);

  const isLoading = isAuthenticated && summaryQuery.isLoading;
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
          {/* Stats */}
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

          {/* Recent activity */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                marginTop: 4,
              }}
            >
              <AppText variant="heading" weight="semibold">
                {t("results_recent")}
              </AppText>
              {recentRuns.length > 0 &&
                (selectionMode ? (
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {selectedIds.size > 0 && (
                      <Pressable
                        onPress={confirmDeleteSelected}
                        className="active:opacity-70"
                      >
                        <AppText variant="caption" style={{ color: "#D45A5A" }}>
                          Delete ({selectedIds.size})
                        </AppText>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={exitSelectionMode}
                      className="active:opacity-70"
                    >
                      <AppText variant="caption" muted>
                        Cancel
                      </AppText>
                    </Pressable>
                  </View>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    <Pressable
                      onPress={confirmDeleteAll}
                      className="active:opacity-70"
                    >
                      <LiIcon name="trash" size={16} color={colors.inkMuted} />
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectionMode(true)}
                      className="active:opacity-70"
                    >
                      <LiIcon
                        name="pen-to-square"
                        size={16}
                        color={colors.inkMuted}
                      />
                    </Pressable>
                  </View>
                ))}
            </View>
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
                  <RecentRunRow
                    key={item.id}
                    item={item}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(item.id)}
                    onToggleSelect={toggleSelect}
                    onDelete={!selectionMode ? deleteItem : undefined}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Program progress */}
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

          {/* Achievements */}
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
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </AppText>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Private trainings */}
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
