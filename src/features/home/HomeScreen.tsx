import React, { useCallback } from "react";
import { ScrollView, View, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { LoadingView } from "@/shared/components/LoadingView";
import { ErrorView } from "@/shared/components/ErrorView";
import { EmptyView } from "@/shared/components/EmptyView";

import { HomeHeader } from "./components/HomeHeader";
import { TrainBlockCard } from "./components/TrainBlockCard";
import { DivePreviewCard } from "./components/DivePreviewCard";
import { SectionHeader } from "./components/SectionHeader";

import { useTrainBlocks, useDiveTemplates } from "./hooks/useHomeData";
import type { TrainBlock, DiveTemplateItem } from "@/api/types";

export function HomeScreen() {
  const trainQuery = useTrainBlocks();
  const diveQuery = useDiveTemplates();

  const isLoading = trainQuery.isLoading && diveQuery.isLoading;
  const isError = trainQuery.isError && diveQuery.isError;

  const handleRefresh = useCallback(() => {
    trainQuery.refetch();
    diveQuery.refetch();
  }, [trainQuery, diveQuery]);

  const isRefreshing =
    (trainQuery.isFetching || diveQuery.isFetching) && !isLoading;

  // ─── Full-screen loading ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bg">
        <StatusBar style="light" />
        <LoadingView fullScreen message="Loading your training..." />
      </SafeAreaView>
    );
  }

  // ─── Full-screen error (only if BOTH queries fail) ───────────────────────
  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bg">
        <StatusBar style="light" />
        <ErrorView
          fullScreen
          message="Could not reach the Deeply server. Check your connection."
          onRetry={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  const trainBlocks = trainQuery.data ?? [];
  const diveItems = diveQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3BBFAD"
            colors={["#3BBFAD"]}
          />
        }
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <HomeHeader />

        {/* ── Training Programs ─────────────────────────────────────────── */}
        <View className="mb-8">
          <SectionHeader title="Train" />

          {trainQuery.isError ? (
            <ErrorView
              message="Could not load training programs."
              onRetry={() => trainQuery.refetch()}
            />
          ) : trainBlocks.length === 0 ? (
            <EmptyView message="No programs available yet." />
          ) : (
            <FlatList
              data={trainBlocks}
              keyExtractor={(item: TrainBlock) => item.key}
              renderItem={({ item }) => <TrainBlockCard block={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              snapToInterval={212}
              decelerationRate="fast"
            />
          )}
        </View>

        {/* ── Dive Templates ────────────────────────────────────────────── */}
        <View className="mb-8">
          <SectionHeader title="Dive" />

          {diveQuery.isError ? (
            <ErrorView
              message="Could not load dive templates."
              onRetry={() => diveQuery.refetch()}
            />
          ) : diveItems.length === 0 ? (
            <EmptyView message="No dive templates available yet." />
          ) : (
            <FlatList
              data={diveItems}
              keyExtractor={(item: DiveTemplateItem) => item.id}
              renderItem={({ item }) => <DivePreviewCard item={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              snapToInterval={172}
              decelerationRate="fast"
            />
          )}
        </View>

        {/* Bottom padding for tab bar / gesture area */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
