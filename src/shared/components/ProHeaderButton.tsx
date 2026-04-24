import React from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { usePurchaseStore } from "@/store/purchaseStore";
import { AppText } from "./AppText";
import { colors } from "@/theme";

// Fixed width of the "Get Pro" pill (paddingHorizontal:20×2 + ~22px text).
// Both states and the loading placeholder render inside this wrapper so the
// right slot of PageTopBar never changes width — no title shift on tab switch.
const SLOT_WIDTH = 62;

/**
 * Crown pill shown in every tab's PageTopBar between the title and profile icon.
 *
 * - Not pro → teal "Get Pro" pill → navigates to /paywall (same as Settings row)
 * - Pro → amber crown badge (static, no tap action needed)
 *
 * Fixed dimensions prevent layout shift when isPro flips after a purchase.
 */
export const ProHeaderButton = React.memo(function ProHeaderButton() {
  const isPro = usePurchaseStore((s) => s.isPro);
  const isLoading = usePurchaseStore((s) => s.isLoading);

  // Empty fixed-width placeholder while SDK hasn't resolved yet.
  if (isLoading) {
    return <View style={{ width: SLOT_WIDTH }} />;
  }

  if (isPro) {
    return (
      <View style={{ width: SLOT_WIDTH, alignItems: "center" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(212,145,90,0.12)",
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: "rgba(212,145,90,0.22)",
          }}
        >
          <AppText
            style={{
              fontSize: 11,
              color: colors.warning,
              fontWeight: "600",
              letterSpacing: 0.2,
            }}
          >
            Pro
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={{ width: SLOT_WIDTH }}>
      <Pressable
        onPress={() => router.push("/paywall" as any)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="active:opacity-65"
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.accent,
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 6,
          }}
        >
          <AppText
            style={{
              fontSize: 11,
              color: colors.inkInverse,
              fontWeight: "700",
              letterSpacing: 0.2,
            }}
          >
            Pro
          </AppText>
        </View>
      </Pressable>
    </View>
  );
});
