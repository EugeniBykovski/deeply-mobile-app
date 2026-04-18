import React, { useEffect, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { ErrorView } from "@/shared/components/ErrorView";
import { Skeleton } from "@/shared/components/Skeleton";
import { AppText } from "@/shared/components/AppText";
import { LiIcon } from "@/shared/components/LiIcon";

import { diveService } from "@/api/services/dive.service";
import type { DiveTemplate } from "@/api/types";
import { i18n } from "@/i18n";
import { colors } from "@/theme";

// ─── Query ────────────────────────────────────────────────────────────────────

function useDiveTemplate(slug: string) {
  const lang = i18n.language.startsWith("ru") ? "ru" : "en";
  return useQuery({
    queryKey: ["dive", "template", slug, lang],
    queryFn: () => diveService.getTemplate(slug, { lang }),
    enabled: !!slug,
  });
}

// ─── Difficulty helpers ───────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: "#3BBFAD",
  MEDIUM: "#D4B95A",
  HARD: "#D4915A",
};

function formatHold(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0 && sec > 0) return `${m}m ${sec}s`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

// ─── Depth profile mini-chart ─────────────────────────────────────────────────

function DepthProfile({ template }: { template: DiveTemplate }) {
  const points = template.profilePoints;
  if (!points.length) return null;

  const maxTime = points[points.length - 1].timeSeconds;
  const maxDepth = template.maxDepthMeters;
  const W = 280;
  const H = 80;

  const diffColor = DIFFICULTY_COLOR[template.difficulty] ?? colors.accent;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 16,
        marginTop: 16,
      }}
    >
      <AppText variant="caption" secondary style={{ marginBottom: 12 }}>
        Depth profile
      </AppText>

      {/* Simple line chart using absolute-positioned views */}
      <View style={{ width: W, height: H, position: "relative" }}>
        {/* Horizontal grid line at max depth */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: colors.border,
          }}
        />

        {/* Segments */}
        {points.slice(0, -1).map((pt, i) => {
          const next = points[i + 1]!;
          const x1 = (pt.timeSeconds / maxTime) * W;
          const y1 = (pt.depthMeters / maxDepth) * H;
          const x2 = (next.timeSeconds / maxTime) * W;
          const y2 = (next.depthMeters / maxDepth) * H;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len < 1) return null;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={i}
              style={{
                position: "absolute",
                left: (x1 + x2) / 2 - len / 2,
                top: (y1 + y2) / 2 - 1.5,
                width: len,
                height: 3,
                borderRadius: 2,
                backgroundColor: diffColor,
                opacity: 0.8,
                transform: [{ rotate: `${angle}deg` }],
              }}
            />
          );
        })}

        {/* Dots */}
        {points.map((pt, i) => {
          const x = (pt.timeSeconds / maxTime) * W;
          const y = (pt.depthMeters / maxDepth) * H;
          return (
            <View
              key={i}
              style={{
                position: "absolute",
                left: x - 3,
                top: y - 3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: diffColor,
              }}
            />
          );
        })}
      </View>

      {/* Axis labels */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 6,
        }}
      >
        <AppText variant="label" muted>
          0s
        </AppText>
        <AppText variant="label" muted>
          {maxTime}s
        </AppText>
      </View>
      <View style={{ position: "absolute", right: 16, top: 16 + 4 }}>
        <AppText variant="label" muted>
          {maxDepth}m
        </AppText>
      </View>
    </View>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        gap: 6,
      }}
    >
      <LiIcon name={icon} size={18} color={color} />
      <AppText weight="bold" style={{ color, fontSize: 18 }}>
        {value}
      </AppText>
      <AppText variant="caption" secondary style={{ textAlign: "center" }}>
        {label}
      </AppText>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function DiveDetailScreen() {
  const { t } = useTranslation("tabs");
  const { slug, autoStart } = useLocalSearchParams<{ slug: string; autoStart?: string }>();

  const query = useDiveTemplate(slug ?? "");
  const template = query.data as DiveTemplate | undefined;
  const didAutoStart = useRef(false);

  const diffColor = template
    ? (DIFFICULTY_COLOR[template.difficulty] ?? colors.accent)
    : colors.accent;

  function handleStartSession() {
    if (!template) return;
    router.push({
      pathname: "/dive/session",
      params: {
        id: template.id,
        slug: template.slug ?? "",
        title: template.title,
        maxDepthMeters: String(template.maxDepthMeters),
        targetHoldSeconds: String(template.targetHoldSeconds ?? 120),
        profilePoints: JSON.stringify(template.profilePoints),
      },
    } as any);
  }

  useEffect(() => {
    if (autoStart === "1" && template && !didAutoStart.current) {
      didAutoStart.current = true;
      handleStartSession();
    }
  }, [template, autoStart]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom"]}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="active:opacity-60"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <LiIcon name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        {template && (
          <AppText
            variant="heading"
            weight="bold"
            style={{ flex: 1 }}
            numberOfLines={1}
          >
            {template.title}
          </AppText>
        )}
      </View>

      {query.isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="40%" />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Skeleton height={90} style={{ flex: 1 }} />
            <Skeleton height={90} style={{ flex: 1 }} />
            <Skeleton height={90} style={{ flex: 1 }} />
          </View>
          <Skeleton height={120} />
          <Skeleton height={80} />
        </View>
      ) : query.isError || !template ? (
        <ErrorView
          fullScreen
          message={t("error_connection", { ns: "common" })}
          onRetry={() => query.refetch()}
        />
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          >
            {/* Subtitle / discipline */}
            {template.subtitle && (
              <AppText secondary style={{ marginBottom: 16 }}>
                {template.subtitle}
              </AppText>
            )}

            {/* Stats row */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
              <StatPill
                icon="water-drop-1"
                label={t("dive_depth")}
                value={`${template.maxDepthMeters}m`}
                color={diffColor}
              />
              {template.targetHoldSeconds != null && (
                <StatPill
                  icon="stopwatch"
                  label={t("dive_target_hold")}
                  value={formatHold(template.targetHoldSeconds)}
                  color={colors.accent}
                />
              )}
              <StatPill
                icon="bolt"
                label={t("dive_difficulty")}
                value={
                  template.difficulty.charAt(0) +
                  template.difficulty.slice(1).toLowerCase()
                }
                color={diffColor}
              />
            </View>

            {/* Depth profile chart */}
            <DepthProfile template={template} />

            {/* Description */}
            {template.description && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  padding: 16,
                  marginTop: 16,
                }}
              >
                <AppText
                  variant="caption"
                  secondary
                  style={{ marginBottom: 8 }}
                >
                  {t("dive_detail_about")}
                </AppText>
                <AppText style={{ lineHeight: 22 }}>
                  {template.description}
                </AppText>
              </View>
            )}
          </ScrollView>

          {/* Start CTA */}
          <View
            style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}
          >
            <Pressable
              onPress={handleStartSession}
              className="active:opacity-80"
              style={{
                backgroundColor: diffColor,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <LiIcon name="water-drop-1" size={20} color="#fff" />
              <AppText weight="bold" style={{ color: "#fff", fontSize: 16 }}>
                {t("dive_start_session")}
              </AppText>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
