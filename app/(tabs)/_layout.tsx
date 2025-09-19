import { useAuth } from "@/lib/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";

function HeaderSignOut() {
  const { signOut } = useAuth();
  return (
    <TouchableOpacity
      onPress={signOut}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
      }}
      accessibilityRole="button"
    >
      <MaterialCommunityIcons name="logout" size={20} color="#a6270dff" />
      <Text style={{ color: "#a6270dff", marginLeft: 6 }}>SignOut</Text>
    </TouchableOpacity>
  );
}
export default function TabsLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#f5f5f5" },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: "#f5f5f5",
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: "#6200ee",
          tabBarInactiveTintColor: "#666666",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Today's Habits",
            headerRight: () => <HeaderSignOut />,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="calendar-today"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="streaks"
          options={{
            title: "Streaks",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="chart-line"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="add-habit"
          options={{
            title: "Add Habit",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="plus-circle"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
