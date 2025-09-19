import {
  client,
  DATABASE_ID,
  databases,
  HABITS_COLLECTION_ID,
  HABITS_COMPLETION_ID,
  RealTimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Snackbar, Surface, Text } from "react-native-paper";
export default function Index() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>();
  const SwipeableRef = useRef<{ [key: string]: Swipeable | null }>({});
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: "",
  });
  const showSnackbar = (message: string) =>
    setSnackbar({ visible: true, message });
  useEffect(() => {
    const userId = user?.$id;
    // If logged out, clear habits and skip subscriptions/fetches
    if (!userId) {
      setHabits([]);
      return;
    }

    const run = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          HABITS_COLLECTION_ID,
          [Query.equal("user_id", userId)]
        );
        // Cast through unknown to satisfy TS when using Appwrite DefaultDocument
        setHabits(response.documents as unknown as Habit[]);
      } catch (err) {
        // Swallow errors when user changes; avoid noisy logs
        console.error("Failed to fetch habits:", err);
      }
    };

    const channel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const habitsSubscription = client.subscribe(
      channel,
      (response: RealTimeResponse) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          run();
        } else if (
          response.events.includes(
            "databases.*.collections.*.documents.*.delete"
          )
        ) {
          run();
        } else if (
          response.events.includes(
            "databases.*.collections.*.documents.*.update"
          )
        ) {
          run();
        }
      }
    );

    run();
    return () => {
      habitsSubscription();
    };
  }, [user?.$id]);

  const handleDeleteHabit = async (id: string) => {
    if (!user) return;
    try {
      await databases.deleteDocument(DATABASE_ID, HABITS_COLLECTION_ID, id);
    } catch (error) {
      console.error("Failed to delete habit:", error);
    }
  };
  const handleCompleteHabit = async (habitId: string) => {
    if (!user) return;
    const userId = user.$id;
    if (!HABITS_COMPLETION_ID) {
      Alert.alert(
        "Missing configuration",
        "EXPO_PUBLIC_HABITS_COMPLETION_ID is not set. Add it to your .env with your Appwrite habit_completions collection ID, then reload."
      );
      return;
    }
    const now = new Date();
    const habit = habits?.find((h) => h.$id === habitId);
    const frequency = habit?.frequency?.toLowerCase?.() ?? "daily";
    // Compute period window based on frequency
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (frequency === "weekly") {
      const day = start.getDay(); // 0-6 (Sun-Sat)
      const diffToMonday = (day + 6) % 7; // days since Monday
      start.setDate(start.getDate() - diffToMonday);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 7);
    } else if (frequency === "monthly") {
      start.setDate(1);
      end.setTime(start.getTime());
      end.setMonth(start.getMonth() + 1);
    } else {
      // daily
      end.setDate(start.getDate() + 1);
    }

    try {
      // 1) Guard: has this habit already been completed today?
      const existing = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COMPLETION_ID,
        [
          Query.equal("user_id", userId),
          Query.equal("habit_id", habitId),
          Query.greaterThanEqual("completed_at", start.toISOString()),
          Query.lessThan("completed_at", end.toISOString()),
        ]
      );
      if (existing.total && existing.total > 0) {
        // Already completed in this period; show feedback and exit
        showSnackbar(
          frequency === "weekly"
            ? "Already completed this week"
            : frequency === "monthly"
            ? "Already completed this month"
            : "Already completed today"
        );
        SwipeableRef.current[habitId]?.close();
        return;
      }

      // 2) Optimistic UI update
      setHabits((prev) =>
        prev?.map((h) =>
          h.$id === habitId
            ? {
                ...h,
                streak_count: h.streak_count + 1,
                last_completed: now.toISOString(),
              }
            : h
        )
      );

      // 3) Create completion record
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COMPLETION_ID,
        ID.unique(),
        {
          habit_id: habitId,
          completed_at: now.toISOString(),
          user_id: userId,
        }
      );

      // 4) Update habit streak in DB (triggers realtime refresh too)
      const habit = habits?.find((h) => h.$id === habitId);
      const currentStreak = habit ? habit.streak_count + 1 : undefined;
      await databases.updateDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        habitId,
        {
          ...(currentStreak !== undefined
            ? { streak_count: currentStreak }
            : {}),
          last_completed: now.toISOString(),
        }
      );
    } catch (error) {
      console.error("Failed to complete habit:", error);
    } finally {
      SwipeableRef.current[habitId]?.close();
    }
  };

  const renderLeftActions = () => (
    <View style={styles.swipeActionLeft}>
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={30}
        color="#f7ececff"
      />
    </View>
  );
  const renderRightActions = () => (
    <View style={styles.swipeActionRight}>
      <MaterialCommunityIcons
        name="check-circle-outline"
        size={30}
        color="#f1f8f2ff"
      />
    </View>
  );
  return (
    <>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerText}>
          Your Habits
        </Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {habits?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyMedium" style={styles.emptyStateText}>
                No habits found. Add some!
              </Text>
            </View>
          ) : (
            habits?.map((habit) => (
              <Swipeable
                key={habit.$id}
                ref={(ref) => {
                  SwipeableRef.current[habit.$id] = ref;
                }}
                overshootLeft={false}
                overshootRight={false}
                renderLeftActions={renderLeftActions}
                renderRightActions={renderRightActions}
                onSwipeableOpen={(direction) => {
                  if (direction === "left") {
                    handleDeleteHabit(habit.$id);
                  } else if (direction === "right") {
                    handleCompleteHabit(habit.$id);
                  }
                  SwipeableRef.current[habit.$id]?.close();
                }}
              >
                <Surface style={styles.card} elevation={0}>
                  <View style={styles.cardContent}>
                    <Text variant="bodyMedium" style={styles.cardTitle}>
                      {habit.title}
                    </Text>
                    <Text style={styles.cardDescription}>
                      {habit.description}
                    </Text>
                    <View style={styles.cardFooter}>
                      <View style={styles.streakBadge}>
                        <MaterialCommunityIcons
                          name="fire"
                          size={20}
                          color={"#ff9800"}
                        />
                        <Text style={styles.streakText}>
                          {habit.streak_count} day streak
                        </Text>
                      </View>
                      <View style={styles.frequencyBadge}>
                        <Text style={styles.frequencyText}>
                          {habit.frequency.charAt(0).toUpperCase() +
                            habit.frequency.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Surface>
              </Swipeable>
            ))
          )}
        </View>
      </ScrollView>
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: "" })}
        duration={2000}
      >
        {snackbar.message}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  view: { flex: 1, justifyContent: "center", alignItems: "center" },
  navButton: {
    padding: 12,
    backgroundColor: "blue",
    width: 100,
    height: 50,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    color: "white",
    textAlign: "center",
    textDecorationColor: "white",
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  header: { marginBottom: 16, justifyContent: "center", alignItems: "center" },
  title: { fontWeight: "bold" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyStateText: { color: "#888", fontSize: 16 },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {},
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  cardDescription: { fontSize: 14, color: "#555", marginBottom: 8 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9dfb9ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: { marginLeft: 4, color: "#ff9800", fontWeight: "bold" },
  frequencyBadge: {
    backgroundColor: "#9bcbf2ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  frequencyText: { color: "#2a4cb4ff", fontWeight: "bold" },
  headerText: { fontWeight: "bold" },
  swipeActionLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "#e21b1bff",
    borderRadius: 18,
    marginBottom: 12,
    marginTop: 2,
    paddingRight: 16,
  },
  swipeActionRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    backgroundColor: "#14d945ff",
    borderRadius: 18,
    marginBottom: 12,
    marginTop: 2,
    paddingRight: 16,
  },
});
