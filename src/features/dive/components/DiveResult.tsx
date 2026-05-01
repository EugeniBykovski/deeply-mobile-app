import React, { memo } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/shared/components/AppText";
import { LiIcon } from "@/shared/components/LiIcon";

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatTime(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

interface DiveResultProps {
  isCompleted: boolean;
  maxReached: number;
  holdSeconds: number;
  saving: boolean;
  onDone: () => void;
  doneLabel: string;
  endedLabel: string;
  doneSubLabel: string;
  endedSubLabel: string;
  maxDepthLabel: string;
  totalHoldLabel: string;
  savingLabel: string;
  doneButtonLabel: string;
}

export const DiveResult = memo(function DiveResult({
  isCompleted,
  maxReached,
  holdSeconds,
  saving,
  onDone,
  doneLabel,
  endedLabel,
  doneSubLabel,
  endedSubLabel,
  maxDepthLabel,
  totalHoldLabel,
  savingLabel,
  doneButtonLabel,
}: DiveResultProps) {
  const accentColor = isCompleted ? "#3BBFAD" : "#D4915A";

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
      }}
    >
      {/* Result icon */}
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
          color={accentColor}
        />
      </View>

      <AppText
        weight="bold"
        style={{ color: "#fff", fontSize: 20, textAlign: "center", marginBottom: 6 }}
      >
        {isCompleted ? doneLabel : endedLabel}
      </AppText>

      <AppText
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 13,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        {isCompleted ? doneSubLabel : endedSubLabel}
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
          <LiIcon name="water-drop-1" size={18} color={accentColor} />
          <AppText weight="bold" style={{ color: "#fff", fontSize: 20 }}>
            {maxReached}m
          </AppText>
          <AppText style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
            {maxDepthLabel}
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
          <LiIcon name="stopwatch" size={18} color="rgba(255,255,255,0.6)" />
          <AppText weight="bold" style={{ color: "#fff", fontSize: 20 }}>
            {formatTime(holdSeconds)}
          </AppText>
          <AppText style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
            {totalHoldLabel}
          </AppText>
        </View>
      </View>

      {saving ? (
        <AppText style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
          {savingLabel}
        </AppText>
      ) : (
        <Pressable
          onPress={onDone}
          className="active:opacity-80"
          style={{
            width: "100%",
            backgroundColor: isCompleted ? "#3BBFAD" : "rgba(255,255,255,0.12)",
            borderRadius: 18,
            paddingVertical: 17,
            alignItems: "center",
            borderWidth: isCompleted ? 0 : 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <AppText weight="bold" style={{ color: "#fff", fontSize: 16 }}>
            {doneButtonLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
});
