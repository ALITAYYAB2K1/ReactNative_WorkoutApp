import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
export default function Index() {
  return (
    <View style={styles.view}>
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Link href="/Login" style={styles.navButton}>
        Login{" "}
      </Link>
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
