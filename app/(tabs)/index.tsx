import {
  client,
  DATABASE_ID,
  databases,
  HABITS_COLLECTION_ID,
  RealTimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Surface, Text } from "react-native-paper";
export default function Index() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>();
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
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {habits?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyMedium" style={styles.emptyStateText}>
              No habits found. Add some!
            </Text>
          </View>
        ) : (
          habits?.map((habit, key) => (
            <Surface key={key} style={styles.card} elevation={0}>
              <View style={styles.cardContent}>
                <Text variant="bodyMedium" style={styles.cardTitle}>
                  {habit.title}
                </Text>
                <Text style={styles.cardDescription}>{habit.description}</Text>
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
          ))
        )}
      </View>
    </ScrollView>
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
  header: { marginBottom: 16 },
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
});
