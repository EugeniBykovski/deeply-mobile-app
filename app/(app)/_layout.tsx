import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SymbolView } from 'expo-symbols';
import { AppText } from '@/shared/components/AppText';
import { colors } from '@/theme';

// ─── Tab icons ────────────────────────────────────────────────────────────────

function TabIcon({
  symbol,
  label,
  focused,
}: {
  symbol: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 2,
      }}
    >
      <SymbolView
        name={symbol as any}
        size={20}
        tintColor={focused ? colors.accent : colors.inkMuted}
        resizeMode="scaleAspectFit"
      />
      <AppText
        variant="label"
        style={{
          fontSize: 12,
          color: focused ? colors.accent : colors.inkMuted,
          fontWeight: focused ? '600' : '400',
        }}
      >
        {label}
      </AppText>
    </View>
  );
}

// ─── Profile button (top-right header) ───────────────────────────────────────

function ProfileButton() {
  return (
    <Pressable
      onPress={() => {}}
      className="mr-4 active:opacity-60"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SymbolView
          name="person.circle"
          size={20}
          tintColor={colors.inkMuted}
          resizeMode="scaleAspectFit"
        />
      </View>
    </Pressable>
  );
}

// ─── Tab layout ──────────────────────────────────────────────────────────────

export default function AppTabLayout() {
  const { t } = useTranslation('tabs');
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.bg,
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTitleStyle: {
          color: colors.ink,
          fontSize: 17,
          fontWeight: '600',
        },
        headerTintColor: colors.ink,
        headerRight: () => <ProfileButton />,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 52 + (Platform.OS === 'ios' ? insets.bottom : 0),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 6,
          paddingTop: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkMuted,
      }}
    >
      <Tabs.Screen
        name="train/index"
        options={{
          title: t('train_title'),
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="wind" label={t('train')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dive/index"
        options={{
          title: t('dive_title'),
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="figure.pool.swim" label={t('dive')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="results/index"
        options={{
          title: t('results_title'),
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="chart.line.uptrend.xyaxis" label={t('results')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="culture/index"
        options={{
          title: t('culture_title'),
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="book.pages" label={t('culture')} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
