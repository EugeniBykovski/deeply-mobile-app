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
 * Fixed height of 74px keeps tab switching smooth — no layout recalculation
 * as screens transition in/out. The explicit height prevents the profile
 * button or title font from ever causing a layout shift.
 *
 * Usage:
 *   <SafeAreaView edges={['top']}>
 *     <PageTopBar title="Training Programs" />
 *     <ScrollView>…</ScrollView>
 *   </SafeAreaView>
 */
export const PageTopBar = React.memo(function PageTopBar({
  title,
  showProfile = true,
  rightSlot,
}: PageTopBarProps) {
  return (
    <View
      style={{
        height: 74,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
      }}
    >
      <AppText
        variant="heading"
        weight="bold"
        style={{ flex: 1, marginRight: 8 }}
        numberOfLines={1}
      >
        {title}
      </AppText>

      {rightSlot ?? (showProfile ? <ProfileButton /> : null)}
    </View>
  );
});
