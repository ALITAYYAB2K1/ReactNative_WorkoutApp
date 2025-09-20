import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const FREQUENCIES = ["daily", "weekly", "monthly"] as const;
type Frequency = (typeof FREQUENCIES)[number];
export default function AddHabitScreen() {
  const router = useRouter();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const { user } = useAuth();
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const theme = useTheme();
  const disabled = !title.trim() || !description.trim() || submitting;

  const templates = useMemo(
    () => [
      {
        title: "Meditate",
        description: "5 minutes of meditation every morning",
      },
      { title: "Workout", description: "30 minutes of exercise" },
      { title: "Read", description: "Read 10 pages of a book" },
    ],
    []
  );
  const handleSubmit = async () => {
    try {
      if (!user) return;
      setSubmitting(true);
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          title,
          description,
          frequency,
          streak_count: 0,
          // Leave last_completed empty so a brand-new habit doesn't show as done
          last_completed: "",
        }
      );
      setTitle("");
      setDescription("");
      setFrequency("daily");
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        return;
      }
      setError("An unknown error occurred.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <View style={styles.container}>
      {/* Hero header */}
      <View style={styles.hero}>
        <MaterialCommunityIcons
          name="star-four-points-outline"
          size={26}
          color="#6b62ff"
        />
        <Text style={styles.title}>Create a Habit</Text>
        <Text style={styles.subtitle}>
          Build consistency with small daily wins
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <TextInput
          label="Title"
          mode="outlined"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          left={
            <TextInput.Icon
              icon={() => (
                <MaterialCommunityIcons name="pencil-outline" size={20} />
              )}
            />
          }
          placeholder="e.g. Meditate"
        />
        <HelperText type="info" visible={!!title && title.length < 4}>
          Short titles work best
        </HelperText>
        <TextInput
          label="Description"
          mode="outlined"
          multiline
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          left={
            <TextInput.Icon
              icon={() => (
                <MaterialCommunityIcons name="text-box-outline" size={20} />
              )}
            />
          }
          placeholder="What will you do?"
        />
        <View style={styles.frequencyContainer}>
          <Text variant="titleSmall" style={styles.frequencyLabel}>
            Frequency
          </Text>
          <SegmentedButtons
            value={frequency}
            onValueChange={(value) => setFrequency(value as Frequency)}
            buttons={FREQUENCIES.map((freq) => ({
              value: freq,
              label: freq.charAt(0).toUpperCase() + freq.slice(1),
              icon:
                freq === "daily"
                  ? () => (
                      <MaterialCommunityIcons name="calendar-today" size={16} />
                    )
                  : freq === "weekly"
                  ? () => (
                      <MaterialCommunityIcons name="calendar-week" size={16} />
                    )
                  : () => (
                      <MaterialCommunityIcons name="calendar-month" size={16} />
                    ),
            }))}
            density="regular"
            style={styles.segmentedButtons}
          />
        </View>

        {/* Quick templates */}
        <View style={styles.templatesRow}>
          {templates.map((t) => (
            <Button
              key={t.title}
              mode="outlined"
              compact
              style={styles.templateBtn}
              onPress={() => {
                setTitle(t.title);
                setDescription(t.description);
              }}
              icon={() => (
                <MaterialCommunityIcons
                  name="star-four-points-outline"
                  size={16}
                  color="#6b62ff"
                />
              )}
            >
              {t.title}
            </Button>
          ))}
        </View>

        <Button
          mode="contained"
          style={styles.button}
          disabled={disabled}
          onPress={handleSubmit}
          loading={submitting}
          icon={() => (
            <MaterialCommunityIcons name="plus-circle-outline" size={18} />
          )}
        >
          Add Habit
        </Button>
        {error && (
          <Text style={{ color: theme.colors.error, marginTop: 8 }}>
            {error}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f7f7fb",
  },
  hero: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  subtitle: { color: "#6b7280", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  input: { marginBottom: 10 },
  frequencyContainer: { marginBottom: 16, width: "100%" },
  frequencyLabel: { marginBottom: 8 },
  button: { marginTop: 12 },
  segmentedButtons: { width: "100%" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  templatesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  templateBtn: { borderColor: "#d9d6fe", backgroundColor: "#f6f5ff" },
});
