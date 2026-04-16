import React from "react";
import { View } from "react-native";
import { AppText } from "./AppText";
import { ProfileButton } from "./ProfileButton";

interface PageTopBarProps {
  title: string;
  /** Render the profile avatar button on the right. Default true. */
  showProfile?: boolean;
  /** Extra right-side content (replaces the profile button slot if provided). */
  rightSlot?: React.ReactNode;
}

/**
 * Inline page header that replaces the native navigation header for tab screens.
 *
 * Usage: render as the first child of a SafeAreaView (after the safe-area inset
 * is already applied), before the ScrollView or content container.
 *
 *   <SafeAreaView edges={['top']}>
 *     <PageTopBar title="Training Programs" />
 *     <ScrollView>…</ScrollView>
 *   </SafeAreaView>
 */
export function PageTopBar({
  title,
  showProfile = true,
  rightSlot,
}: PageTopBarProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
      }}
    >
      <AppText
        variant="heading"
        weight="bold"
        style={{ flex: 1, marginRight: 8 }}
      >
        {title}
      </AppText>

      {rightSlot ?? (showProfile ? <ProfileButton /> : null)}
    </View>
  );
}
