import { Stack } from "expo-router";

export default function TimelineLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="detalhes" />
    </Stack>
  );
}
