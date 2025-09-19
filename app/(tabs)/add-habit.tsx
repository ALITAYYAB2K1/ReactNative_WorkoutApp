import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
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
  const theme = useTheme();
  const handleSubmit = async () => {
    try {
      if (!user) return;
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
          last_completed: new Date().toISOString(),
        }
      );
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        return;
      }
      setError("An unknown error occurred.");
    }
  };
  return (
    <View style={styles.container}>
      <TextInput
        label="Title"
        mode="outlined"
        style={styles.input}
        onChangeText={setTitle}
      />
      <TextInput
        label="Description"
        mode="outlined"
        multiline
        style={styles.input}
        onChangeText={setDescription}
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
          }))}
          density="regular"
          style={styles.segmentedButtons}
        />
      </View>
      <Button
        mode="contained"
        style={styles.button}
        disabled={!title.trim() || !description.trim()}
        onPress={handleSubmit}
      >
        Add Habit
      </Button>
      {error && (
        <Text style={{ color: theme.colors.error, marginBottom: 8 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  input: { marginBottom: 16 },
  frequencyContainer: { marginBottom: 16, width: "100%" },
  frequencyLabel: { marginBottom: 8 },
  button: { marginTop: 12 },
  segmentedButtons: { width: "100%" },
});
