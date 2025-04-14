import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window"); // ✅ responsive width

export default function HomeScreen() {
  const router = useRouter();
  const [animations, setAnimations] = useState({});
  const popUpAnimation = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(popUpAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const topics = [
    {
      title: "Relationships & Dating Culture",
      image: require("../assets/images/pexels-git-stephen-gitau-302905-1667849.jpg"),
    },
    {
      title: "Money and lifestyle",
      image: require("../assets/images/pexels-pixabay-210600.jpg"),
    },
    {
      title: "What do you like the most",
      image: require("../assets/images/pexels-karolina-grabowska-4467986.jpg"),
    },
    {
      title: "Mental health",
      image: require("../assets/images/meditation-7718089_1280.jpg"),
    },
    {
      title: "Travel and adventure",
      image: require("../assets/images/pexels-ninauhlikova-287240.jpg"),
    },
    {
      title: "Bgmi and Valorant",
      image: require("../assets/images/pikaso_text-to-image_Candid-image-photography-natural-textures-highly-r.png"),
    },
  ];

  const handlePress = (index) => {
    const animatedValue = new Animated.Value(1);
    setAnimations((prev) => ({ ...prev, [index]: animatedValue }));

    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => router.push("/Ai_page"));
  };

  return (
    <ImageBackground
      source={require("../assets/images/Background.png")}
      style={styles.background}
    >
      {/* AppBar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.replace("/login_page")}>
          <Image
            source={require("../assets/images/back-button.png")}
            style={styles.iconImage}
          />
        </TouchableOpacity>

        <Image
          source={require("../assets/images/LOGO.png")}
          style={styles.logo}
        />

        <TouchableOpacity onPress={() => router.push("/profile_screen")}>
          <Image
            source={require("../assets/images/profile-icon.png")}
            style={styles.iconImage}
          />
        </TouchableOpacity>
      </View>

      {/* Random Talk Box */}
      <Animated.View style={styles.randomTalkContainer}>
        <Image
          source={require("../assets/images/Button_container.png")}
          style={styles.randomTalkImage}
        />
        <View style={styles.textContainer}>
          <Text style={styles.heading}>Let's talk on a random topic!</Text>
          <TouchableOpacity
            style={styles.talkButton}
            onPress={() => router.push("/Ai_page")}
          >
            <Text style={styles.talkButtonText}>Let's Talk</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Topics Grid */}
      <FlatList
        data={topics}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => {
          const animatedValue = animations[index] || new Animated.Value(1);
          const animatedStyle = {
            transform: [
              { scale: animatedValue },
              {
                rotateY: animatedValue.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: ["0deg", "90deg"],
                }),
              },
            ],
          };
          return (
            <TouchableOpacity onPress={() => handlePress(index)}>
              <Animated.View style={[styles.topicCard, animatedStyle]}>
                <Image source={item.image} style={styles.topicImage} />
                <Text style={styles.topicTitle}>{item.title}</Text>
              </Animated.View>
            </TouchableOpacity>
          );
        }}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  logo: {
    width: 150,
    height: 50,
    resizeMode: "contain",
  },
  iconImage: {
    width: 30,
    height: 25,
    resizeMode: "contain",
  },
  randomTalkContainer: {
    flexDirection: "row",
    backgroundColor: "#0D8B3D",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginVertical: 20,
    alignItems: "center",
    width: "93.5%",
    alignSelf: "center",
    shadowColor: "#555",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  randomTalkImage: {
    height: 120,
    width: 120,
    resizeMode: "contain",
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  talkButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#fff",
  },
  talkButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  gridRow: {
    justifyContent: "space-around",
    marginHorizontal: 5,
  },

  // ✅ UPDATED topicCard style
  topicCard: {
    width: width * 0.42,
    height: width * 0.45,
    backgroundColor: "white",
    padding: 10,
    marginVertical: 10,
    marginHorizontal: 5,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  // ✅ UPDATED topicImage style
  topicImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: (width * 0.25) / 2,
  },

  topicTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "black",
  },
});
