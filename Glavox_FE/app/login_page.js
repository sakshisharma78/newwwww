import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageBackground,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons"; // Import the Ionicons icon library
import * as Animatable from "react-native-animatable"; // Import Animatable

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // username/email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // toggle password

  const handleLogin = () => {
    const isLengthValid = password.length >= 8;
    const hasCapitalLetter = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (isLengthValid && hasCapitalLetter && hasSpecialChar) {
      router.replace("/home_screen");
    } else {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 8 characters long, contain at least one capital letter, and one special character."
      );
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/Background.png")}
      style={styles.background}
    >
      <Animatable.View
        animation="slideInUp" // This will slide the container up from the bottom
        duration={2000} // Slow down the slide animation to 2000 milliseconds
        style={styles.container}
      >
        <Image source={require("../assets/images/LOGO.png")} style={styles.logo} />
        <Text style={styles.title}>Hi there!</Text>
        <Text style={styles.subtitle}>Please enter required details</Text>

        <TextInput
          style={styles.input}
          placeholder="Username or Email"
          placeholderTextColor="black"
          value={identifier}
          onChangeText={setIdentifier}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="black"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye" : "eye-off"} // Eye icon toggles based on password visibility
              size={24}
              color="black"
              style={styles.toggleIcon}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => router.push("/ForgotPasswordPage")}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/signup_page")}>
          <Text style={styles.signupText}>
            Create an account? <Text style={styles.signupLink}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </Animatable.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    width: "90%",
  },
  logo: {
    height: 85,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  subtitle: {
    fontSize: 14,
    color: "black",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: "black",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    color: "black",
  },
  toggleIcon: {
    marginLeft: 10,
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotText: {
    color: "black",
    fontSize: 14,
  },
  button: {
    width: "100%",
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupText: {
    color: "black",
    marginTop: 15,
    fontSize: 14,
  },
  signupLink: {
    color: "blue",
    fontWeight: "bold",
  },
});
