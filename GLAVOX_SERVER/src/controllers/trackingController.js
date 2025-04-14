const TimeTracking = require('../models/TimeTracking');
const Session = require('../models/Session');
const { formatISTDateTime, formatDuration, calculateSpeakingStats, calculateTotalSpeakingTime } = require('../utils/timeUtils');
const { createSpeakingSegment } = require('../utils/audioUtils');

exports.startChatTracking = async (req, res) => {
  try {
    const { userId, startTime } = req.body;
    
    // Create a new session
    const session = new Session({
      userId,
      startTime: new Date(startTime)
    });
    await session.save();

    // Create time tracking record with both UTC and IST times
    const timeTracking = new TimeTracking({
      userId,
      sessionId: session._id,
      chatPageEnterTimeUTC: new Date(startTime),
      chatPageEnterTimeIST: formatISTDateTime(new Date(startTime))
    });
    await timeTracking.save();

    res.status(201).json({
      success: true,
      trackingId: timeTracking._id,
      sessionId: session._id,
      formattedEnterTime: timeTracking.chatPageEnterTimeIST
    });
  } catch (error) {
    console.error('Start chat tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start chat tracking'
    });
  }
};

exports.endChatTracking = async (req, res) => {
  try {
    const { trackingId, endTime, duration } = req.body;
    
    const timeTracking = await TimeTracking.findById(trackingId);
    if (!timeTracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking record not found'
      });
    }

    timeTracking.chatPageExitTimeUTC = new Date(endTime);
    timeTracking.chatPageExitTimeIST = formatISTDateTime(new Date(endTime));
    timeTracking.totalChatDurationInSeconds = duration;
    await timeTracking.save();

    res.status(200).json({
      success: true,
      message: 'Chat tracking ended successfully',
      formattedExitTime: timeTracking.chatPageExitTimeIST,
      formattedDuration: formatDuration(timeTracking.totalChatDurationInSeconds)
    });
  } catch (error) {
    console.error('End chat tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end chat tracking'
    });
  }
};

exports.updateSpeakingTime = async (req, res) => {
  try {
    const { trackingId, startTime } = req.body;
    const audioFile = req.file;

    if (!trackingId || !startTime || !audioFile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: trackingId, startTime, and audio file are required'
      });
    }

    const timeTracking = await TimeTracking.findById(trackingId);
    if (!timeTracking) {
      return res.status(404).json({
        success: false,
        message: 'Time tracking record not found'
      });
    }

    // Create speaking segment from audio file
    const segment = await createSpeakingSegment(
      audioFile.path,
      audioFile.filename,
      new Date(startTime)
    );

    // Add new speaking segment with both UTC and IST times
    timeTracking.speakingSegments.push({
      fileName: segment.fileName,
      startTimeUTC: segment.startTimeUTC,
      startTimeIST: formatISTDateTime(segment.startTimeUTC),
      endTimeUTC: segment.endTimeUTC,
      endTimeIST: formatISTDateTime(segment.endTimeUTC),
      duration: segment.durationInSeconds
    });

    // Calculate speaking statistics
    const stats = calculateSpeakingStats(timeTracking.speakingSegments);

    // Update the document
    timeTracking.totalSpeakingTimeInSeconds = stats.totalSpeakingTime;
    timeTracking.speakingCount = stats.speakingCount;
    timeTracking.averageDurationInSeconds = stats.averageDuration;
    timeTracking.longestDurationInSeconds = stats.longestDuration;
    timeTracking.shortestDurationInSeconds = stats.shortestDuration;

    await timeTracking.save();

    // Prepare response with formatted times and statistics
    const response = {
      success: true,
      data: {
        currentSegment: {
          fileName: segment.fileName,
          startTime: formatISTDateTime(segment.startTimeUTC),
          endTime: formatISTDateTime(segment.endTimeUTC),
          duration: formatDuration(segment.durationInSeconds)
        },
        speakingStats: {
          totalSessions: stats.speakingCount,
          totalSpeakingTime: stats.formattedStats.totalTime,
          averageSpeakingTime: stats.formattedStats.averageTime,
          longestSpeakingTime: stats.formattedStats.longestTime,
          shortestSpeakingTime: stats.formattedStats.shortestTime
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating speaking time:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating speaking time',
      error: error.message
    });
  }
};

exports.getSessionSpeakingTime = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const totalSpeakingTime = await calculateTotalSpeakingTime(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        totalSpeakingTime,
        formattedDuration: `${Math.floor(totalSpeakingTime)} seconds`
      }
    });
  } catch (error) {
    console.error('Error getting session speaking time:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating speaking time',
      error: error.message
    });
  }
}; 