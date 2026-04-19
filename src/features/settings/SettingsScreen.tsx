import React, { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { i18n } from "@/i18n";
import { AppText } from "@/shared/components/AppText";
import { LiIcon } from "@/shared/components/LiIcon";
import { useAuthStore } from "@/store/authStore";
import { usePurchaseStore } from "@/store/purchaseStore";
import { authService } from "@/api/services/auth.service";
import { colors } from "@/theme";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <AppText variant="label" muted className="px-5 mb-2">
        {title}
      </AppText>
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        {children}
      </View>
      {description ? (
        <AppText variant="caption" muted className="px-5 mt-2 leading-relaxed">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface RowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  loading?: boolean;
  showChevron?: boolean;
  last?: boolean;
}

function Row({
  icon,
  label,
  value,
  onPress,
  destructive = false,
  loading = false,
  showChevron = true,
  last = false,
}: RowProps) {
  const iconColor = destructive ? colors.error : colors.accent;
  const textColor = destructive ? colors.error : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="active:opacity-70"
    >
      <View
        className="flex-row items-center gap-4 px-5 py-4"
        style={
          !last
            ? { borderBottomWidth: 1, borderBottomColor: colors.border }
            : undefined
        }
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: destructive
              ? "rgba(224,87,87,0.12)"
              : "rgba(59,191,173,0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LiIcon name={icon} size={16} color={iconColor} />
        </View>
        <AppText weight="medium" style={{ color: textColor, flex: 1 }}>
          {label}
        </AppText>
        {loading ? (
          <ActivityIndicator size="small" color={colors.inkMuted} />
        ) : value ? (
          <AppText secondary>{value}</AppText>
        ) : null}
        {showChevron && !loading && !destructive && (
          <LiIcon name="chevron-right" size={14} color={colors.inkMuted} />
        )}
      </View>
    </Pressable>
  );
}

// ─── Language section ─────────────────────────────────────────────────────────

function LanguageSection() {
  const { t } = useTranslation("common");
  const currentLang = i18n.language.startsWith("ru") ? "ru" : "en";

  const setLang = useCallback(async (lang: "en" | "ru") => {
    await i18n.changeLanguage(lang);
  }, []);

  return (
    <Section title={t("language")}>
      <Pressable onPress={() => setLang("en")} className="active:opacity-70">
        <View
          className="flex-row items-center gap-4 px-5 py-4"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "rgba(59,191,173,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LiIcon name="globe" size={16} color={colors.accent} />
          </View>
          <AppText weight="medium" className="flex-1">
            {t("english")}
          </AppText>
          {currentLang === "en" && (
            <LiIcon name="checkmark" size={16} color={colors.accent} />
          )}
        </View>
      </Pressable>
      <Pressable onPress={() => setLang("ru")} className="active:opacity-70">
        <View className="flex-row items-center gap-4 px-5 py-4">
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "rgba(59,191,173,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LiIcon name="globe" size={16} color={colors.accent} />
          </View>
          <AppText weight="medium" className="flex-1">
            {t("russian")}
          </AppText>
          {currentLang === "ru" && (
            <LiIcon name="checkmark" size={16} color={colors.accent} />
          )}
        </View>
      </Pressable>
    </Section>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { t } = useTranslation("common");
  const { clearAuth, isAuthenticated } = useAuthStore();
  const isPro = usePurchaseStore((s) => s.isPro);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = useCallback(async () => {
    await clearAuth();
    router.replace("/signin" as any);
  }, [clearAuth]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(t("delete_account"), t("delete_account_confirm_message"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete_account_confirm_button"),
        style: "destructive",
        onPress: async () => {
          setIsDeletingAccount(true);
          try {
            await authService.deleteAccount();
            await clearAuth();
            router.replace("/signin" as any);
          } catch {
            Alert.alert(t("error_generic"), t("error_connection"));
          } finally {
            setIsDeletingAccount(false);
          }
        },
      },
    ]);
  }, [t, clearAuth]);

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* Header row */}
      <View
        className="flex-row items-center px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="active:opacity-60 mr-3"
        >
          <LiIcon name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="heading" weight="semibold">
          {t("settings")}
        </AppText>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="h-6" />

        {/* 1 ── Deeply Pro ─────────────────────────────────────────────── */}
        <Section title="Deeply Pro">
          {isPro ? (
            <Row
              icon="crown"
              label={t("manage_subscription")}
              onPress={() => router.push("/customer-center" as any)}
              last
            />
          ) : (
            <Row
              icon="newapi"
              label={t("upgrade_to_pro")}
              onPress={() => router.push("/paywall" as any)}
              last
            />
          )}
        </Section>

        {/* 2 ── Language ────────────────────────────────────────────────── */}
        <LanguageSection />

        {/* 2 ── Account (sign-out) ─────────────────────────────────────── */}
        {isAuthenticated && (
          <Section title={t("profile")}>
            <Row
              icon="logout"
              label={t("logout")}
              onPress={handleLogout}
              showChevron={false}
              destructive
              last
            />
          </Section>
        )}

        {/* 3 ── Delete Account ──────────────────────────────────────────── */}
        <Section
          title={t("delete_account")}
          description={t("delete_account_section_hint")}
        >
          <Row
            icon="trash"
            label={t("delete_account")}
            onPress={handleDeleteAccount}
            loading={isDeletingAccount}
            showChevron={false}
            destructive
            last
          />
        </Section>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
