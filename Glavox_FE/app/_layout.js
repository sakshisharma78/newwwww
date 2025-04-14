import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login_page" />
      <Stack.Screen name="signup_page" />
      <Stack.Screen name="home_screen" />
      <Stack.Screen name="profile_screen" />
      <Stack.Screen name="edit_profile" />
      <Stack.Screen name="Ai_page" />
      <Stack.Screen name="ForgotPasswordPage" />
    </Stack>
  );
}
