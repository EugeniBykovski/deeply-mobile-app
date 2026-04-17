import React from "react";
import { View, Platform } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LiIcon } from "@/shared/components/LiIcon";
import { colors } from "@/theme";

// ─── Tab icon — icon + accent dot, no text labels ─────────────────────────────
//
// Labels were removed because they wrapped/clipped on narrow screens and in
// Russian locale (8–12 char tab names). Screen content owns its own title via
// PageTopBar; the icons are self-evident. VoiceOver uses tabBarAccessibilityLabel.

function TabIcon({ liIcon, focused }: { liIcon: string; focused: boolean }) {
  const tintColor = focused ? colors.accent : colors.inkMuted;
  return (
    <View style={{ alignItems: "center", gap: 5, paddingTop: 8 }}>
      <LiIcon name={liIcon} size={24} color={tintColor} />
      <View
        style={{
          width: focused ? 4 : 0,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.accent,
        }}
      />
    </View>
  );
}

// ─── Tab layout ──────────────────────────────────────────────────────────────

export default function AppTabLayout() {
  const { t } = useTranslation("tabs");
  const insets = useSafeAreaInsets();

  const tabBarContentHeight = 60;
  const tabBarHeight =
    tabBarContentHeight + (Platform.OS === "ios" ? insets.bottom : 0);

  return (
    <Tabs
      screenOptions={{
        // Each screen renders its own header via PageTopBar — no native bar needed.
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 4,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarItemStyle: { paddingTop: 0, paddingBottom: 0 },
      }}
    >
      <Tabs.Screen
        name="train/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon liIcon="surfboard-2" focused={focused} />
          ),
          tabBarAccessibilityLabel: t("train"),
        }}
      />
      <Tabs.Screen
        name="dive/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon liIcon="stopwatch" focused={focused} />
          ),
          tabBarAccessibilityLabel: t("dive"),
        }}
      />
      <Tabs.Screen
        name="results/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon liIcon="trend-up-1" focused={focused} />
          ),
          tabBarAccessibilityLabel: t("results"),
        }}
      />
      <Tabs.Screen
        name="culture/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon liIcon="books-2" focused={focused} />
          ),
          tabBarAccessibilityLabel: t("culture"),
        }}
      />
    </Tabs>
  );
}
