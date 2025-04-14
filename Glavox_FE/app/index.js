import { useRouter } from "expo-router";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import * as Animatable from "react-native-animatable";

export default function index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image
        source={require("../assets/images/Background.png")}
        style={styles.backgroundImage}
      />

      {/* Glavox Logo Animation */}
      <Animatable.View
        animation="fadeInDown"
        duration={1500}
        delay={500}
        style={styles.logoContainer}
      >
        <Animatable.Image
          animation={{
            0: { opacity: 0, scale: 0.5, translateY: -100 },
            0.5: { opacity: 1, scale: 1.1 },
            1: { scale: 1, translateY: 0 },
          }}
          duration={2000}
          delay={800}
          source={require("../assets/images/LOGO.png")}
          style={styles.logo}
        />
        {/* Subtitle under logo */}
        <Animatable.Text
          animation="fadeInUp"
          delay={1500}
          style={styles.subtitle}
        >
          where hesitation leaves the chat
        </Animatable.Text>
      </Animatable.View>

      {/* Get Started Button */}
      <Animatable.View
        animation="fadeInUp"
        delay={2500}
        style={styles.buttonContainer}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/login_page")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between", // Space between logo+subtitle and button
    alignItems: "center",
    backgroundColor: "#f5f3f3",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1, // Takes up available space at the top
  },
  logo: {
    width: 280,
    height: 180,
    resizeMode: "contain",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0D0C0C",
    letterSpacing: 1.2,
    textAlign: "center",
    marginTop: 10, // Keeps a small gap between logo and subtitle
  },
  buttonContainer: {
    justifyContent: "flex-end", // Button stays at the bottom
    width: "100%",
    marginBottom: 20, // Ensures space at the bottom
  },
  button: {
    backgroundColor: "#0D8B3D",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignSelf: "center", // Centers the button
  },
  buttonText: {
    fontSize: 18,
    color: "white",
  },
});
