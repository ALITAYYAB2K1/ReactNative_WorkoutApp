import { useAuth } from "@/lib/auth-context";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
export default function Index() {
  const { signOut } = useAuth();
  return (
    <View style={styles.view}>
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button onPress={signOut} mode="text" icon={"logout"}>
        SignOut
      </Button>
    </View>
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
});
