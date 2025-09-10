import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Home" }} />
        <Stack.Screen name="Login" options={{ title: "Login" }} />
        <Stack.Screen name="Register" options={{ title: "Register" }} />
      </Stack>
    </>
  );
}
