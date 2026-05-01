import React, { memo } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/shared/components/AppText";
import { LiIcon } from "@/shared/components/LiIcon";

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatTime(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

interface DiveTopBarProps {
  title: string;
  holdSeconds: number;
  showBack: boolean;
  holdTimeLabel: string;
  onBack: () => void;
}

export const DiveTopBar = memo(function DiveTopBar({
  title,
  holdSeconds,
  showBack,
  holdTimeLabel,
  onBack,
}: DiveTopBarProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
      }}
    >
      {showBack && (
        <Pressable
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="active:opacity-60"
          style={{ marginRight: 12 }}
        >
          <LiIcon name="arrow-left" size={22} color="rgba(255,255,255,0.7)" />
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
        <AppText variant="caption" style={{ color: "rgba(255,255,255,0.45)" }}>
          {holdTimeLabel}
        </AppText>
        <AppText weight="bold" style={{ color: "#fff", fontSize: 18 }}>
          {formatTime(holdSeconds)}
        </AppText>
      </View>
    </View>
  );
});
