const Session = require('../models/Session');
const mongoose = require('mongoose');

const saveSession = async (req, res) => {
  try {
    const { userId, email, startTime, date, duration } = req.body;

    // Get session number for this user
    const totalSessions = await Session.countDocuments({ userId });
    const sessionNumber = totalSessions + 1;

    const session = new Session({
      userId,
      email,
      sessionNumber,
      startTime,
      date,
      duration
    });

    await session.save();

    res.json({ 
      success: true, 
      message: 'Session saved successfully',
      sessionNumber
    });
  } catch (error) {
    console.error('Session save error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save session' 
    });
  }
};

const getWeeklySessions = async (req, res) => {
  try {
    const userId = req.params.userId;
    const sessions = await Session.getWeeklySessionsByUser(userId);
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch sessions' 
    });
  }
};

// Check active session for a user
const checkUserSession = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Last 30 minutes के sessions check करें
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const session = await Session.findOne({
      userId: userId,
      createdAt: { $gte: thirtyMinutesAgo }
    }).sort({ createdAt: -1 });
    
    if (session) {
      return res.status(200).json({
        hasActiveSession: true,
        sessionDetails: {
          startTime: session.startTime,
          date: session.date,
          duration: session.duration,
          sessionNumber: session.sessionNumber,
          lastInteraction: session.updatedAt
        }
      });
    }
    
    return res.status(200).json({
      hasActiveSession: false
    });
    
  } catch (error) {
    console.error('Session check error:', error);
    return res.status(500).json({
      error: 'Failed to check session'
    });
  }
};

// Get detailed session analytics
const getSessionAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const analytics = await Session.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          sessionsCount: { $sum: 1 },
          totalDuration: { $sum: { $toInt: "$duration" } }
        }
      },
      { $sort: { "_id": -1 } }
    ]);
    
    return res.status(200).json(analytics);
    
  } catch (error) {
    console.error('Session analytics error:', error);
    return res.status(500).json({
      error: 'Failed to get session analytics'
    });
  }
};

module.exports = {
  saveSession,
  getWeeklySessions,
  checkUserSession,
  getSessionAnalytics
}; 