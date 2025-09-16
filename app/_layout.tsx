import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isloadingUser } = useAuth();
  const segments = useSegments();
  useEffect(() => {
    const inAuthGroup = segments[0] === "auth";
    if (!user && !inAuthGroup && !isloadingUser) {
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, segments, isloadingUser]);
  return <>{children}</>;
}
export default function RootLayout() {
  return (
    <>
      <AuthProvider>
        <RouteGuard>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </RouteGuard>
      </AuthProvider>
    </>
  );
}
