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
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Surface, Text } from "react-native-paper";

type Completion = { habit_id: string; completed_at: string };
type HabitStats = {
  habit: Habit;
  current: number;
  best: number;
  total: number;
};

// Pure helpers outside component to avoid hook deps
const prevPeriodKey = (key: string, frequency?: string) => {
  const f = (frequency || "daily").toLowerCase();
  if (f === "weekly") {
    const [yearStr, weekStr] = key.split("-W");
    let y = parseInt(yearStr, 10);
    let w = parseInt(weekStr, 10) - 1;
    if (w < 1) {
      y -= 1;
      w = 52;
    }
    return `${y}-W${String(w).padStart(2, "0")}`;
  }
  if (f === "monthly") {
    const [yStr, mStr] = key.split("-");
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      y -= 1;
      m = 12;
    }
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  const [yStr, mStr, dStr] = key.split("-");
  const d = new Date(
    parseInt(yStr, 10),
    parseInt(mStr, 10) - 1,
    parseInt(dStr, 10)
  );
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function StreaksScreen() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  // Data fetching + realtime subscriptions
  useEffect(() => {
    const userId = user?.$id;
    if (!userId) {
      setHabits([]);
      setCompletions([]);
      setLoading(false);
      return;
    }

    const fetchHabits = async () => {
      const res = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", userId), Query.limit(100)]
      );
      setHabits(res.documents as unknown as Habit[]);
    };

    const fetchCompletions = async () => {
      // Fetch last 12 months of completions to compute current/best streaks
      const now = new Date();
      const start = new Date(now);
      start.setMonth(start.getMonth() - 12);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const pageSize = 100;
      let offset = 0;
      let all: Completion[] = [];
      // Paginate to avoid truncation
      while (true) {
        const res = await databases.listDocuments(
          DATABASE_ID,
          HABITS_COMPLETION_ID,
          [
            Query.equal("user_id", userId),
            Query.greaterThanEqual("completed_at", start.toISOString()),
            Query.limit(pageSize),
            Query.offset(offset),
          ]
        );
        const docs = res.documents as unknown as Completion[];
        all = all.concat(
          docs.map((d) => ({
            habit_id: d.habit_id,
            completed_at: d.completed_at,
          }))
        );
        if (docs.length < pageSize) break;
        offset += pageSize;
        // Safety cap to avoid runaway loops
        if (offset > 2000) break;
      }
      setCompletions(all);
    };

    const run = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchHabits(), fetchCompletions()]);
      } finally {
        setLoading(false);
      }
    };

    // Realtime subscriptions
    const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const completionsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COMPLETION_ID}.documents`;
    const hSub = client.subscribe(
      habitsChannel,
      (response: RealTimeResponse) => {
        if (
          response.events.some((ev) =>
            [
              "databases.*.collections.*.documents.*.create",
              "databases.*.collections.*.documents.*.delete",
              "databases.*.collections.*.documents.*.update",
            ].includes(ev)
          )
        ) {
          fetchHabits();
        }
      }
    );
    const cSub = client.subscribe(
      completionsChannel,
      (response: RealTimeResponse) => {
        if (
          response.events.some((ev) =>
            [
              "databases.*.collections.*.documents.*.create",
              "databases.*.collections.*.documents.*.delete",
              "databases.*.collections.*.documents.*.update",
            ].includes(ev)
          )
        ) {
          fetchCompletions();
        }
      }
    );

    run();
    return () => {
      hSub();
      cSub();
    };
  }, [user?.$id]);

  // Helpers for period math
  const periodKey = (date: Date, frequency?: string) => {
    const f = (frequency || "daily").toLowerCase();
    const d = new Date(date);
    if (f === "weekly") {
      // Monday-based weeks: compute ISO week number
      const temp = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
      );
      const day = temp.getUTCDay() || 7; // 1..7 with Monday=1
      temp.setUTCDate(temp.getUTCDate() + (1 - day));
      const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
      const weekNo = Math.round(
        ((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
      );
      return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
    }
    if (f === "monthly") {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    // daily
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // previousPeriod now provided by prevPeriodKey helper

  const computeStats = useMemo(() => {
    const byHabit: Record<string, Completion[]> = {};
    completions.forEach((c) => {
      if (!byHabit[c.habit_id]) byHabit[c.habit_id] = [];
      byHabit[c.habit_id].push(c);
    });

    const stats: HabitStats[] = habits.map((habit) => {
      const list = (byHabit[habit.$id] || []).slice();
      // Deduplicate by period key (guard against accidental duplicates)
      const uniqueByPeriod = new Map<string, string>(); // key -> completed_at
      for (const c of list) {
        const k = periodKey(new Date(c.completed_at), habit.frequency);
        if (!uniqueByPeriod.has(k)) uniqueByPeriod.set(k, c.completed_at);
      }
      const periodKeys = Array.from(uniqueByPeriod.keys()).sort();

      // Current streak: count back from current period
      let current = 0;
      let curKey = periodKey(new Date(), habit.frequency);
      const set = new Set(periodKeys);
      while (set.has(curKey)) {
        current += 1;
        curKey = prevPeriodKey(curKey, habit.frequency);
      }

      // Best streak: scan through periods looking for longest run
      let best = 0;
      let running = 0;
      let prev: string | null = null;
      for (const k of periodKeys) {
        // If the previous period of k equals the last key we saw, the streak continues
        if (prev && prevPeriodKey(k, habit.frequency) === prev) {
          running += 1;
        } else {
          running = 1;
        }
        best = Math.max(best, running);
        prev = k;
      }

      const total = periodKeys.length;
      return { habit, current, best, total };
    });

    // Sort stats for top section (current desc, then best, then total)
    const topSorted = [...stats].sort((a, b) => {
      if (b.current !== a.current) return b.current - a.current;
      if (b.best !== a.best) return b.best - a.best;
      return b.total - a.total;
    });

    return { stats, top3: topSorted.slice(0, 3) };
  }, [habits, completions]);

  const { stats, top3 } = computeStats;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="headlineSmall" style={styles.header}>
        Streaks
      </Text>

      <Surface style={styles.topCard} elevation={0}>
        <View style={styles.topHeaderRow}>
          <MaterialCommunityIcons
            name="trophy-outline"
            size={20}
            color="#7b61ff"
          />
          <Text style={styles.topHeaderText}>Top Streaks</Text>
        </View>
        {loading && <Text style={styles.muted}>Loading…</Text>}
        {!loading && top3.length === 0 && (
          <Text style={styles.muted}>
            No streaks yet. Complete a habit to get started.
          </Text>
        )}
        {!loading &&
          top3.map((s, idx) => (
            <View key={s.habit.$id} style={styles.topRow}>
              <Text style={styles.topIndex}>{idx + 1}</Text>
              <Text style={styles.topTitle}>{s.habit.title}</Text>
              <View style={styles.statPillCurrent}>
                <MaterialCommunityIcons name="fire" size={16} color="#ff9800" />
                <Text style={styles.statPillText}>{s.current}</Text>
              </View>
            </View>
          ))}
      </Surface>

      <View style={{ height: 12 }} />

      {stats.map((s) => (
        <Surface key={s.habit.$id} style={styles.card} elevation={0}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {s.habit.title}
            </Text>
          </View>
          {s.habit.description ? (
            <Text style={styles.cardDesc}>{s.habit.description}</Text>
          ) : null}
          <View style={styles.badgesRow}>
            <View style={styles.statPillCurrent}>
              <MaterialCommunityIcons name="fire" size={18} color="#ff9800" />
              <Text style={styles.statPillText}>Current {s.current}</Text>
            </View>
            <View style={styles.statPillBest}>
              <MaterialCommunityIcons
                name="trophy-outline"
                size={18}
                color="#7b61ff"
              />
              <Text style={styles.statPillText}>Best {s.best}</Text>
            </View>
            <View style={styles.statPillTotal}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={18}
                color="#13c552"
              />
              <Text style={styles.statPillText}>Total {s.total}</Text>
            </View>
          </View>
        </Surface>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f7f7f7" },
  header: { textAlign: "center", fontWeight: "700", marginBottom: 12 },
  muted: { color: "#7a7a7a" },
  topCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  topHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  topHeaderText: { fontWeight: "700", color: "#3d2ef2" },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  topIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: "center",
    textAlignVertical: "center",
    color: "#3d2ef2",
    fontWeight: "bold",
    backgroundColor: "#efeafe",
    marginRight: 8,
  },
  topTitle: { flex: 1, fontWeight: "600" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eaeaea",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontWeight: "700" },
  cardDesc: { color: "#666", marginTop: 4 },
  badgesRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  statPillBase: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statPillText: { fontWeight: "700" },
  statPillCurrent: {
    backgroundColor: "#fff2e1",
    borderColor: "#ffe0b2",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statPillBest: {
    backgroundColor: "#efeafe",
    borderColor: "#d8cef9",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statPillTotal: {
    backgroundColor: "#e9f8ef",
    borderColor: "#c9efdb",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
