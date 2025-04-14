import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Speech from 'expo-speech';

const API_URL = 'http://172.16.155.247:5000/api';

const TIMING_KEYS = {
  TRACKING_ID: '@timing_tracking_id',
  PAGE_ENTER_TIME: '@page_enter_time',
  SPEAKING_START_TIME: '@speaking_start_time',
  CHAT_START_TIME: '@chat_start_time'
};

// Convert milliseconds to minutes
const convertToMinutes = (milliseconds) => {
  return Number((milliseconds / (1000 * 60)).toFixed(2));
};

class TimingService {
  static instance = null;
  
  constructor() {
    if (TimingService.instance) {
      return TimingService.instance;
    }
    TimingService.instance = this;
    this.trackingId = null;
    this.currentPageEnterTime = null;
    this.speakingStartTime = null;
    this.chatStartTime = null;
    this.isSpeaking = false;
    this.speechListener = null;
  }

  // Initialize timing service
  async initialize() {
    try {
      // Recover any existing tracking session
      this.trackingId = await AsyncStorage.getItem(TIMING_KEYS.TRACKING_ID);
      
      // Set up speech recognition listener
      this.setupSpeechListener();
      
      return true;
    } catch (error) {
      console.error('Timing service initialization error:', error);
      return false;
    }
  }

  // Set up speech recognition listener
  setupSpeechListener() {
    if (this.speechListener) return;

    this.speechListener = Speech.addListener('onSpeechStart', () => {
      this.startSpeakingTracking();
    });

    this.speechListener = Speech.addListener('onSpeechEnd', () => {
      this.endSpeakingTracking();
    });
  }

  // Start chat tracking
  async startChatTracking(userId, token) {
    try {
      if (!token || !userId) {
        console.warn('Missing token or userId for chat tracking');
        return false;
      }

      const startTime = new Date();
      this.chatStartTime = startTime;
      await AsyncStorage.setItem(TIMING_KEYS.CHAT_START_TIME, startTime.toISOString());

      const response = await axios.post(
        `${API_URL}/tracking/start-chat`,
        {
          userId,
          startTime: startTime.toISOString()
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      if (response.data.trackingId) {
        this.trackingId = response.data.trackingId;
        await AsyncStorage.setItem(TIMING_KEYS.TRACKING_ID, this.trackingId);
      }

      return true;
    } catch (error) {
      console.error('Start chat tracking error:', error);
      return false;
    }
  }

  // End chat tracking
  async endChatTracking(token) {
    try {
      if (!this.trackingId || !this.chatStartTime) {
        return false;
      }

      const endTime = new Date();
      const durationMs = endTime - this.chatStartTime;
      const duration = convertToMinutes(durationMs); // Convert to minutes

      await axios.post(
        `${API_URL}/tracking/end-chat`,
        {
          trackingId: this.trackingId,
          endTime: endTime.toISOString(),
          duration
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      this.chatStartTime = null;
      await AsyncStorage.removeItem(TIMING_KEYS.CHAT_START_TIME);
      return true;
    } catch (error) {
      console.error('End chat tracking error:', error);
      return false;
    }
  }

  // Start speaking tracking
  async startSpeakingTracking() {
    try {
      if (this.isSpeaking) return true;

      const startTime = new Date();
      this.speakingStartTime = startTime;
      this.isSpeaking = true;
      await AsyncStorage.setItem(TIMING_KEYS.SPEAKING_START_TIME, startTime.toISOString());
      
      console.log('Speaking tracking started at:', startTime.toISOString());
      return true;
    } catch (error) {
      console.error('Start speaking tracking error:', error);
      return false;
    }
  }

  // End speaking tracking
  async endSpeakingTracking(token) {
    try {
      if (!this.trackingId || !this.speakingStartTime || !this.isSpeaking) {
        console.warn('Cannot end speaking tracking: missing required data');
        return false;
      }

      const endTime = new Date();
      const durationMs = endTime - this.speakingStartTime;
      const duration = convertToMinutes(durationMs);

      console.log('Speaking tracking ended:', {
        startTime: this.speakingStartTime.toISOString(),
        endTime: endTime.toISOString(),
        duration
      });

      await axios.post(
        `${API_URL}/tracking/speaking-time`,
        {
          trackingId: this.trackingId,
          startTime: this.speakingStartTime.toISOString(),
          endTime: endTime.toISOString(),
          duration
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      this.speakingStartTime = null;
      this.isSpeaking = false;
      await AsyncStorage.removeItem(TIMING_KEYS.SPEAKING_START_TIME);
      return true;
    } catch (error) {
      console.error('End speaking tracking error:', error);
      return false;
    }
  }

  // Cleanup timing service
  async cleanup() {
    try {
      if (this.speechListener) {
        this.speechListener.remove();
        this.speechListener = null;
      }

      await AsyncStorage.multiRemove([
        TIMING_KEYS.TRACKING_ID,
        TIMING_KEYS.PAGE_ENTER_TIME,
        TIMING_KEYS.SPEAKING_START_TIME,
        TIMING_KEYS.CHAT_START_TIME
      ]);
      this.trackingId = null;
      this.currentPageEnterTime = null;
      this.speakingStartTime = null;
      this.chatStartTime = null;
      this.isSpeaking = false;
      return true;
    } catch (error) {
      console.error('Timing service cleanup error:', error);
      return false;
    }
  }
}

export const timingService = new TimingService(); 