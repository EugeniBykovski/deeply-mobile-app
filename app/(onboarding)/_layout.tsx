import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="level" />
      <Stack.Screen name="safety" />
      <Stack.Screen name="trial" />
      <Stack.Screen name="auth" />
    </Stack>
  );
}
