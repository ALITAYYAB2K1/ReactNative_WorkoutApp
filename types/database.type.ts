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

export interface HabitCompletion extends Models.Document {
  $id: string;
  habit_id: string;
  user_id: string;
  $createdAt: string;
  completed_at: string;
}
