import React, { useState } from 'react';
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  StyleSheet,
  ImageBackground
} from 'react-native';

export default function EditProfileScreen (){
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ImageBackground
      source={require('../assets/images/Background.png')}
      style={styles.background}
    >
      {/* GLAVOX Logo */}
      <Image source={require('../assets/images/LOGO.png')} style={styles.logo} />

      {/* Back Button with Image */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.navigate("profile_screen")}>
        <Image
          source={require('../assets/images/back-button.png')} // backbutton image
          style={styles.backIcon}
        />
      </TouchableOpacity>

      {/* Profile Edit Box */}
      <View style={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        {/* Profile Image with Edit Icon */}
        <View style={styles.profileContainer}>
          <Image source={require('../assets/images/metahuman.png')} style={styles.profileImage} />
          <TouchableOpacity style={styles.editIcon}>
            <Text style={styles.editText}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* Name Input */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />

        {/* Email Input */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
        />

        {/* Dark Mode Toggle */}
        {/* <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>Light</Text>
          <Switch value={isDarkMode} onValueChange={toggleTheme} />
          <Text style={styles.toggleText}>Dark</Text>
        </View> */}

        {/* Save Button */}
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    position: 'absolute',
    top: 40,
    height: 50,
    resizeMode: 'contain',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  backIcon: {
    width: 30, // size of the back button image
    height: 30,
    resizeMode: 'contain',
  },
  container: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  profileContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  editText: {
    fontSize: 16,
    color: '#000',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  toggleText: {
    fontSize: 16,
    color: '#000',
    marginHorizontal: 10,
  },
  button: {
    width: '100%',
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
