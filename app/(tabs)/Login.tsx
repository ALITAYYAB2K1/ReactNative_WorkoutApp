import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function LoginScreen() {
  return (
    <View>
      <Text>Login</Text>
      <Text>Please enter your credentials</Text>
      <Link href="/" style={{ marginTop: 20, color: "blue" }}>
        Go to Home
      </Link>
    </View>
  );
}
