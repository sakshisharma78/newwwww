const TimeTracking = require('../models/TimeTracking');
const Session = require('../models/Session');
const mongoose = require('mongoose');

const startChatTracking = async (req, res) => {
  try {
    const { userId, startTime } = req.body;
    
    if (!userId || !startTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new session
    const session = new Session({
      userId,
      startTime: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      duration: "0:00" // Will be updated when session ends
    });
    await session.save();
    
    // Create time tracking record
    const timeTracking = new TimeTracking({
      userId,
      sessionId: session._id,
      chatPageEnterTime: new Date(startTime),
      firstMessageTime: null,
      lastMessageTime: null,
      chatDuration: 0,
      totalSpeakingTime: 0,
      speakingSessions: []
    });
    
    await timeTracking.save();
    
    res.json({ 
      success: true, 
      trackingId: timeTracking._id,
      sessionId: session._id
    });
  } catch (error) {
    console.error('Start chat tracking error:', error);
    res.status(500).json({ error: 'Failed to start chat tracking' });
  }
};

const endChatTracking = async (req, res) => {
  try {
    const { trackingId, endTime, duration } = req.body;
    
    if (!trackingId || !endTime || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const timeTracking = await TimeTracking.findById(trackingId);
    if (!timeTracking) {
      return res.status(404).json({ error: 'Tracking record not found' });
    }

    timeTracking.chatPageExitTime = new Date(endTime);
    timeTracking.chatPageDuration = duration;
    
    // Update session duration
    const session = await Session.findById(timeTracking.sessionId);
    if (session) {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      session.duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      await session.save();
    }

    await timeTracking.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('End chat tracking error:', error);
    res.status(500).json({ error: 'Failed to end chat tracking' });
  }
};

const trackSpeakingTime = async (req, res) => {
  try {
    const { trackingId, startTime, endTime, duration } = req.body;
    
    if (!trackingId || !startTime || !endTime || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const timeTracking = await TimeTracking.findById(trackingId);
    if (!timeTracking) {
      return res.status(404).json({ error: 'Tracking record not found' });
    }

    // Add new speaking session
    const newSession = {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration: Number(duration)
    };

    timeTracking.speakingSessions.push(newSession);
    
    // Calculate statistics
    const sessions = timeTracking.speakingSessions;
    const totalSpeakingTime = sessions.reduce((sum, session) => sum + session.duration, 0);
    const speakingCount = sessions.length;
    const averageDuration = speakingCount > 0 ? totalSpeakingTime / speakingCount : 0;
    const longestDuration = Math.max(...sessions.map(s => s.duration));
    const shortestDuration = Math.min(...sessions.map(s => s.duration));

    // Update statistics
    timeTracking.totalSpeakingTime = Number(totalSpeakingTime.toFixed(2));
    timeTracking.speakingCount = speakingCount;
    timeTracking.averageDuration = Number(averageDuration.toFixed(2));
    timeTracking.longestDuration = Number(longestDuration.toFixed(2));
    timeTracking.shortestDuration = Number(shortestDuration.toFixed(2));

    await timeTracking.save();
    
    res.json({ 
      success: true,
      data: {
        totalSpeakingTime: timeTracking.totalSpeakingTime,
        speakingCount: timeTracking.speakingCount,
        averageDuration: timeTracking.averageDuration,
        longestDuration: timeTracking.longestDuration,
        shortestDuration: timeTracking.shortestDuration
      }
    });
  } catch (error) {
    console.error('Speaking time tracking error:', error);
    res.status(500).json({ error: 'Failed to track speaking time' });
  }
};

const getTimeTrackingAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const analytics = await TimeTracking.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalChatTime: { $sum: "$chatPageDuration" },
          totalSpeakingTime: { $sum: "$totalSpeakingTime" },
          averageSessionDuration: { $avg: "$chatPageDuration" },
          totalSessions: { $sum: 1 }
        }
      }
    ]);

    res.json({ success: true, data: analytics[0] || {} });
  } catch (error) {
    console.error('Time tracking analytics error:', error);
    res.status(500).json({ error: 'Failed to get time tracking analytics' });
  }
};

module.exports = {
  startChatTracking,
  endChatTracking,
  trackSpeakingTime,
  getTimeTrackingAnalytics
}; 