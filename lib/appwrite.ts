import { Account, Client, Databases } from "react-native-appwrite";
export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!);

export const account = new Account(client);

export const databases = new Databases(client);
export const DATABASE_ID = process.env.EXPO_PUBLIC_DB_ID!;
export const HABITS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_HABITS_COLLECTION_ID!;
export const HABITS_COMPLETION_ID =
  process.env.EXPO_PUBLIC_HABITS_COMPLETION_ID!;
export interface RealTimeResponse {
  events: string[];
  payload: any;
}

// Helpful diagnostics in dev if env vars are missing
if (__DEV__) {
  const missing: string[] = [];
  if (!process.env.EXPO_PUBLIC_DB_ID) missing.push("EXPO_PUBLIC_DB_ID");
  if (!process.env.EXPO_PUBLIC_HABITS_COLLECTION_ID)
    missing.push("EXPO_PUBLIC_HABITS_COLLECTION_ID");
  if (!process.env.EXPO_PUBLIC_HABITS_COMPLETION_ID)
    missing.push("EXPO_PUBLIC_HABITS_COMPLETION_ID");
  if (missing.length) {
    console.warn(
      `Missing Appwrite env variables: ${missing.join(
        ", "
      )}. Some features will fail until these are set.`
    );
  }
}
