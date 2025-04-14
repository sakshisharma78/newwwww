import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { useRouter } from "expo-router";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { jwtDecode } from 'jwt-decode';
import { timingService } from '../services/TimingService';
import * as Speech from 'expo-speech';

const API_URL = 'http://172.16.155.247:5000/api';
const FLASK_API_URL = 'http://172.16.155.247:5001/api';

// Add conversation history constants
const CONVERSATION_HISTORY_KEY = 'conversation_history';
const SESSION_START_TIME_KEY = 'session_start_time';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

const { width } = Dimensions.get('window');

// Add token validation function
const validateToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      return false;
    }

    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      // Token expired, try to refresh
      try {
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (refreshResponse.data.token) {
          await AsyncStorage.setItem('token', refreshResponse.data.token);
          return refreshResponse.data.token;
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return false;
      }
    }
    return token;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

export default function AiScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Add useEffect for conversation history management
  useEffect(() => {
    loadConversationHistory();
    startNewSession();
    
    // Cleanup on component unmount
    return () => {
      endSession();
    };
  }, []);

  // Add session management functions
  const startNewSession = async () => {
    try {
      const currentTime = new Date().getTime();
      await AsyncStorage.setItem(SESSION_START_TIME_KEY, currentTime.toString());
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const isSessionValid = async () => {
    try {
      const sessionStartTime = await AsyncStorage.getItem(SESSION_START_TIME_KEY);
      if (!sessionStartTime) return false;
      
      const currentTime = new Date().getTime();
      const sessionAge = currentTime - parseInt(sessionStartTime);
      return sessionAge < SESSION_TIMEOUT;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  };

  const loadConversationHistory = async () => {
    try {
      const isValid = await isSessionValid();
      if (!isValid) {
        await clearConversationHistory();
        return;
      }

      const history = await AsyncStorage.getItem(CONVERSATION_HISTORY_KEY);
      if (history) {
        setConversationHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const saveConversationHistory = async (newMessage) => {
    try {
      const updatedHistory = [...conversationHistory, newMessage];
      setConversationHistory(updatedHistory);
      await AsyncStorage.setItem(CONVERSATION_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  };

  const clearConversationHistory = async () => {
    try {
      await AsyncStorage.removeItem(CONVERSATION_HISTORY_KEY);
      await AsyncStorage.removeItem(SESSION_START_TIME_KEY);
      setConversationHistory([]);
    } catch (error) {
      console.error('Error clearing conversation history:', error);
    }
  };

  const endSession = async () => {
    await clearConversationHistory();
    await endConversation();
  };

  // Animation for the mic button
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Clean up sound and recording when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [sound, recording]);

  // Initialize timing service and start tracking
  useEffect(() => {
    const initializeTiming = async () => {
      try {
        const token = await validateToken();
        if (!token) return;

        const decoded = jwtDecode(token);
        
        // Initialize timing service
        await timingService.initialize();
        
        // Start chat tracking
        await timingService.startChatTracking(decoded.userId, token);
      } catch (error) {
        console.error('Timing initialization error:', error);
        // Don't block the app if timing fails
      }
    };

    initializeTiming();

    // Cleanup timing on unmount
    return () => {
      const cleanup = async () => {
        try {
          const token = await validateToken();
          if (token) {
            await timingService.endChatTracking(token);
            await timingService.cleanup();
          }
        } catch (error) {
          console.error('Timing cleanup error:', error);
        }
      };
      cleanup();
    };
  }, []);

  // Modify startRecording
  const startRecording = async () => {
    console.log("startRecording initiated..");
    try {
      // Stop any existing recording
      if (recording) {
        console.log("recording is : ", recording);
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      // Start speaking tracking
      await timingService.startSpeakingTracking();
      setIsSpeaking(true);

      setIsRecording(true);
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
      setIsSpeaking(false);
    }
  };

  // Modify stopRecording
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsSpeaking(false);
      
      if (!recording) return;

      // End speaking tracking
      const token = await validateToken();
      if (token) {
        await timingService.endSpeakingTracking(token);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Get user ID from token
      if (!token) {
        Alert.alert('Error', 'Please login first');
        router.push('/login_page');
        return;
      }

      const decoded = jwtDecode(token);
      const userId = decoded.userId;

      // Create FormData to send audio file
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a'
      });
      formData.append('userId', userId);

      // Send audio to backend for transcription
      const transcriptionResponse = await axios.post(
        `${FLASK_API_URL}/ai/transcribe`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      // Send transcribed text to backend with userId
      await handleMicPress(userId, transcriptionResponse.data.text);
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  // Add conversation end function
  const endConversation = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const decoded = jwtDecode(token);
      
      await axios.post(`${API_URL}/ai/end-conversation`, {
        userId: decoded.userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('End conversation error:', error);
    }
  };

  const playAudio = async (audioUrl) => {
    try {
      // Stop any currently playing sound

      if (sound) {
        await sound.unloadAsync();
      }

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const urlWithTimestamp = `http://172.16.155.247:5000${audioUrl}`;
      console.log(urlWithTimestamp);

      // Load and play the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: urlWithTimestamp },
        { shouldPlay: true }
      );
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleMicPress = async (userId, transcribedText) => {
    try {
      setIsLoading(true);
      
      // Check session validity
      const isValid = await isSessionValid();
      if (!isValid) {
        await clearConversationHistory();
        startNewSession();
      }

      const token = await validateToken();
      if (!token) {
        Alert.alert('Error', 'Please login again');
        router.push('/login_page');
        return;
      }

      // Save user's message to history
      const userMessage = {
        role: 'user',
        content: transcribedText,
        timestamp: new Date().toISOString()
      };
      await saveConversationHistory(userMessage);

      // Send request to AI with conversation history
      const response = await axios.post(
        `${API_URL}/ai/chat`,
        {
          userId,
          message: transcribedText,
          conversationHistory: conversationHistory
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Save AI's response to history
      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date().toISOString()
      };
      await saveConversationHistory(aiMessage);

      // Play audio response
      if (response.data.audioUrl) {
        await playAudio(response.data.audioUrl);
      }
    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Error', 'Failed to process your message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image source={require('../assets/images/Background.png')} style={styles.backgroundImage} />

      {/* AppBar */}
      <View style={styles.appBar}>
        {/* Back Button (Left) */}
        <TouchableOpacity onPress={() => router.replace('./home_screen')}>
          <Image source={require('../assets/images/back-button.png')} style={styles.backIcon} />
        </TouchableOpacity>

        {/* GLAVOX Logo (Center) */}
        <Image source={require('../assets/images/LOGO.png')} style={styles.logo} />

        {/* Profile Icon (Right) */}
        <TouchableOpacity onPress={() => router.navigate('./profile_screen')}>
          <Image source={require('../assets/images/profile-icon.png')} style={styles.profileIcon} />
        </TouchableOpacity>
      </View>

      {/* MetaHuman Image with Animation */}
      <Animated.View style={[styles.metahumanContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Image source={require('../assets/images/metahuman.png')} style={styles.metahuman} />
      </Animated.View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Processing your request...</Text>
        </View>
      )}

      {/* Recording Status Text */}
      {isRecording && (
        <Text style={styles.recordingText}>
          Recording... Tap again to stop
        </Text>
      )}

      {/* Mic Button */}
      <TouchableOpacity 
        style={[
          styles.micButton, 
          isLoading && styles.buttonDisabled,
          isRecording && styles.recordingButton
        ]} 
        onPress={() => {
          if (isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
        }}
        disabled={isLoading}
      >
        <Image 
          source={require('../assets/images/favicon.png')} 
          style={[styles.micIcon, isRecording && styles.recordingIcon]} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 1,
  },
  backIcon: { width: 28, height: 28, resizeMode: 'contain' },
  logo: {
    height: 40,
    width: 150,
    resizeMode: 'contain',
  },
  profileIcon: { width: 30, height: 30, resizeMode: 'contain' },
  metahumanContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  metahuman: {
    width: width * 0.8,
    height: width * 0.8,
    resizeMode: 'contain',
  },
  responseContainer: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  responseText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
    fontSize: 16,
  },
  micButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  recordingButton: {
    backgroundColor: '#ff4444',
  },
  micIcon: {
    width: 40,
    height: 40,
    tintColor: '#fff',
  },
  recordingIcon: {
    tintColor: '#fff',
  },
  recordingText: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});