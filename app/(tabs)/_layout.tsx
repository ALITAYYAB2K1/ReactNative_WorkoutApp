import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Tabs } from "expo-router";
export default function TabsLayout() {
  return (
    <>
      <Tabs screenOptions={{ tabBarActiveTintColor: "coral" }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="home" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Login"
          options={{
            title: "Login",
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="sign-in-alt" size={20} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
