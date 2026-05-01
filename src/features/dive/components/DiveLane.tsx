import React, { memo, useMemo } from "react";
import { View } from "react-native";
import { AppText } from "@/shared/components/AppText";
import { LiIcon } from "@/shared/components/LiIcon";
import { LANE_HEIGHT, DIVER_SIZE, ACCENT_COLOR } from "../diveSession.constants";

interface DiveLaneProps {
  maxDepthMeters: number;
  currentDepth: number;
  isHolding: boolean;
  statusLabel: string;
}

export const DiveLane = memo(function DiveLane({
  maxDepthMeters,
  currentDepth,
  isHolding,
  statusLabel,
}: DiveLaneProps) {
  // Every integer meter gets a tick mark; labels shown on multiples of 5 and
  // the max depth so the scale stays readable without clutter.
  const tapeMarkers = useMemo(() => {
    const markers: number[] = [];
    for (let m = 0; m <= maxDepthMeters; m++) markers.push(m);
    return markers;
  }, [maxDepthMeters]);

  // Diver top offset — recalculated only when currentDepth changes (integer meter jump)
  const diverTop = (currentDepth / maxDepthMeters) * (LANE_HEIGHT - DIVER_SIZE);

  return (
    <>
      {/* Current depth display */}
      <View style={{ alignItems: "center", paddingTop: 4, paddingBottom: 4 }}>
        <AppText
          weight="bold"
          style={{ color: "rgba(255,255,255,0.9)", fontSize: 44, lineHeight: 50 }}
        >
          {currentDepth} m
        </AppText>
        <AppText style={{ color: "rgba(255,255,255,0.38)", fontSize: 12 }}>
          {statusLabel}
        </AppText>
      </View>

      {/* Depth tape + diver lane */}
      <View
        style={{ flex: 1, flexDirection: "row", paddingHorizontal: 20, paddingTop: 4 }}
      >
        {/* Left: every-meter depth tape */}
        <View
          style={{
            width: 52,
            height: LANE_HEIGHT,
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingRight: 10,
          }}
        >
          {tapeMarkers.map((m) => {
            const isMajor = m % 5 === 0 || m === maxDepthMeters;
            return (
              <View
                key={m}
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <View
                  style={{
                    width: isMajor ? 8 : 4,
                    height: 1,
                    backgroundColor: isMajor
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.1)",
                  }}
                />
                <AppText
                  style={{
                    color: isMajor
                      ? "rgba(255,255,255,0.38)"
                      : "rgba(255,255,255,0.16)",
                    fontSize: isMajor ? 10 : 8,
                    lineHeight: 10,
                  }}
                >
                  {isMajor ? `${m}m` : `${m}`}
                </AppText>
              </View>
            );
          })}
        </View>

        {/* Centre: rail + target marker + diver */}
        <View style={{ flex: 1, position: "relative" }}>
          {/* Vertical rail */}
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
          {/* Diver — snaps to integer-meter position, no animation */}
          <View
            style={{
              position: "absolute",
              left: "50%",
              top: diverTop,
              width: DIVER_SIZE,
              height: DIVER_SIZE,
              marginLeft: -(DIVER_SIZE / 2),
              alignItems: "center",
              justifyContent: "center",
            }}
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
              color={isHolding ? ACCENT_COLOR : "rgba(255,255,255,0.7)"}
            />
          </View>
        </View>

        {/* Right spacer mirrors left tape width */}
        <View style={{ width: 52 }} />
      </View>
    </>
  );
});
