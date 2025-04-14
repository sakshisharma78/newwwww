import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(
    require("../assets/images/metahuman.png")
  );

  const changeProfileImage = () => {
    setProfileImage(require("../assets/images/favicon.png"));
  };

  return (
    <ImageBackground
      source={require("../assets/images/Background.png")}
      style={styles.background}
    >
      {/* Header with Logo, Back Button and Logout in one line */}
      <View style={styles.headerContainer}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => router.replace("/home_screen")}
        >
          <Image
            source={require("../assets/images/back-button.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>

        {/* Glavox Logo */}
        <Image
          source={require("../assets/images/LOGO.png")}
          style={styles.logo}
        />

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() =>
            Alert.alert("Logout", "Are you sure you want to logout?", [
              { text: "Cancel", style: "cancel" },
              { text: "OK", onPress: () => router.replace("/") },
            ])
          }
        >
          <Image
            source={require("../assets/images/logout-icon.png")}
            style={styles.logoutIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Profile Box */}
      <View style={styles.profileContainer}>
        <Text style={styles.heading}>Profile</Text>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Image source={profileImage} style={styles.profileImage} />
        </View>

        <Text style={styles.userName}>User Name</Text>
        <Text style={styles.email}>user@example.com</Text>

        <Text style={styles.subHeading}>Topics Covered</Text>
        <Text style={styles.details}>Flutter, Dart, Firebase</Text>

        <Text style={styles.subHeading}>Feedback</Text>
        <Text style={styles.details}>Great learning experience!</Text>
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push("/edit_profile")}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // New header container for horizontal layout
  headerContainer: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  headerIcon: {
    width: 30,
    height: 30,
  },
  backIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  logoutIcon: {
    width: 20,
    height: 28,
    resizeMode: "contain",
  },
  logo: {
    width: 150,
    height: 40,
    resizeMode: "contain",
  },

  profileContainer: {
    width: "85%",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  profileImageContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: "black",
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "500",
    color: "black",
    marginTop: 10,
  },
  details: {
    fontSize: 16,
    color: "black",
  },
  editButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "black",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  editButtonText: {
    fontSize: 18,
    color: "white",
  },
});
