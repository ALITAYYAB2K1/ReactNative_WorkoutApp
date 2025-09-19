import { Models } from "react-native-appwrite";

export interface Habit extends Models.Document {
  $id: string;
  user_id: string;
  title: string;
  description: string;
  frequency: string;
  streak_count: number;
  last_completed: string;
  $createdAt: string;
}
