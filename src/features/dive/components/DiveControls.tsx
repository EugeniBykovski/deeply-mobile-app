import React, { memo } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/shared/components/AppText";
import { LiIcon } from "@/shared/components/LiIcon";
import { BUTTON_SIZE, ACCENT_COLOR } from "../diveSession.constants";

interface DiveControlsProps {
  isHolding: boolean;
  isSurfacing: boolean;
  meterProgress: number; // 0..1 — fills the progress bar toward the next meter
  onPressIn: () => void;
  onPressOut: () => void;
  onFinish: () => void;
  holdLabel: string;
  releaseLabel: string;
  surfacingLabel: string;
  keepHoldingLabel: string;
  finishLabel: string;
}

export const DiveControls = memo(function DiveControls({
  isHolding,
  isSurfacing,
  meterProgress,
  onPressIn,
  onPressOut,
  onFinish,
  holdLabel,
  releaseLabel,
  surfacingLabel,
  keepHoldingLabel,
  finishLabel,
}: DiveControlsProps) {
  const buttonLabel = isHolding ? releaseLabel : isSurfacing ? surfacingLabel : holdLabel;
  const activeColor = isHolding ? ACCENT_COLOR : "rgba(255,255,255,0.55)";

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 8,
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* Main hold button */}
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          borderRadius: 100,
          borderWidth: 1,
          borderColor: isHolding
            ? "rgba(59,191,173,0.4)"
            : "rgba(255,255,255,0.22)",
        }}
      >
        <LiIcon name="water-drop-1" size={28} color={activeColor} />
        <AppText
          weight="semibold"
          style={{
            color: activeColor,
            fontSize: 11,
            letterSpacing: 0.2,
            textAlign: "center",
            paddingHorizontal: 8,
          }}
        >
          {buttonLabel}
        </AppText>
      </Pressable>

      {/* Meter progress feedback — always rendered to prevent layout shift;
          opacity-hidden when not actively holding so the button area stays stable */}
      <View
        style={{
          width: BUTTON_SIZE,
          alignItems: "center",
          gap: 5,
          opacity: isHolding ? 1 : 0,
        }}
      >
        {/* Progress bar: fills from 0→100% as depth approaches the next meter */}
        <View
          style={{
            width: BUTTON_SIZE,
            height: 3,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${meterProgress * 100}%`,
              height: "100%",
              backgroundColor: ACCENT_COLOR,
              borderRadius: 2,
            }}
          />
        </View>
        <AppText
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 10,
            letterSpacing: 0.3,
          }}
        >
          {keepHoldingLabel}
        </AppText>
      </View>

      {/* Secondary finish button */}
      <Pressable
        onPress={onFinish}
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
        <AppText style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          {finishLabel}
        </AppText>
      </Pressable>
    </View>
  );
});
