const mongoose = require('mongoose');
const moment = require('moment-timezone');

// Utility function to convert UTC to IST formatted string
const formatToIST = (utcDate) => {
  if (!utcDate) return null;
  return moment(utcDate).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
};

// Utility function to calculate duration in seconds
const calculateDurationInSeconds = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  return Math.round((endDate - startDate) / 1000);
};

const timeTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  // Chat Page Timing
  chatPageEnterTimeUTC: {
    type: Date,
    required: true
  },
  chatPageEnterTimeIST: {
    type: String,
    required: true
  },
  chatPageExitTimeUTC: {
    type: Date
  },
  chatPageExitTimeIST: {
    type: String
  },
  totalChatDurationInSeconds: {
    type: Number,
    default: 0
  },
  // Chat Session Timing
  firstMessageTimeUTC: {
    type: Date
  },
  firstMessageTimeIST: {
    type: String
  },
  lastMessageTimeUTC: {
    type: Date
  },
  lastMessageTimeIST: {
    type: String
  },
  chatDurationInSeconds: {
    type: Number,
    default: 0
  },
  // Speaking Time
  totalSpeakingTimeInSeconds: {
    type: Number,
    default: 0
  },
  speakingCount: {
    type: Number,
    default: 0
  },
  averageDurationInSeconds: {
    type: Number,
    default: 0
  },
  longestDurationInSeconds: {
    type: Number,
    default: 0
  },
  shortestDurationInSeconds: {
    type: Number,
    default: 0
  },
  speakingSegments: [{
    fileName: {
      type: String,
      required: true
    },
    startTimeUTC: {
      type: Date,
      required: true
    },
    startTimeIST: {
      type: String,
      required: true
    },
    endTimeUTC: {
      type: Date,
      required: true
    },
    endTimeIST: {
      type: String,
      required: true
    },
    durationInSeconds: {
      type: Number,
      required: true
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for formatted durations
timeTrackingSchema.virtual('formattedChatDuration').get(function() {
  const hours = Math.floor(this.totalChatDurationInSeconds / 3600);
  const minutes = Math.floor((this.totalChatDurationInSeconds % 3600) / 60);
  const seconds = this.totalChatDurationInSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
});

timeTrackingSchema.virtual('formattedSpeakingTime').get(function() {
  const hours = Math.floor(this.totalSpeakingTimeInSeconds / 3600);
  const minutes = Math.floor((this.totalSpeakingTimeInSeconds % 3600) / 60);
  const seconds = this.totalSpeakingTimeInSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
});

// Pre-save middleware to ensure IST times are set and durations are calculated
timeTrackingSchema.pre('save', function(next) {
  // Set IST times for chat page
  if (this.chatPageEnterTimeUTC) {
    this.chatPageEnterTimeIST = formatToIST(this.chatPageEnterTimeUTC);
  }
  
  if (this.chatPageExitTimeUTC) {
    this.chatPageExitTimeIST = formatToIST(this.chatPageExitTimeUTC);
  }

  // Set IST times for chat session
  if (this.firstMessageTimeUTC) {
    this.firstMessageTimeIST = formatToIST(this.firstMessageTimeUTC);
  }
  
  if (this.lastMessageTimeUTC) {
    this.lastMessageTimeIST = formatToIST(this.lastMessageTimeUTC);
  }

  // Calculate total chat duration
  if (this.chatPageEnterTimeUTC && this.chatPageExitTimeUTC) {
    this.totalChatDurationInSeconds = calculateDurationInSeconds(
      this.chatPageEnterTimeUTC,
      this.chatPageExitTimeUTC
    );
  }

  // Calculate chat session duration
  if (this.firstMessageTimeUTC && this.lastMessageTimeUTC) {
    this.chatDurationInSeconds = calculateDurationInSeconds(
      this.firstMessageTimeUTC,
      this.lastMessageTimeUTC
    );
  }

  // Calculate speaking statistics
  if (this.speakingSegments && this.speakingSegments.length > 0) {
    // Ensure each segment has its IST times and duration calculated
    this.speakingSegments = this.speakingSegments.map(segment => {
      return {
        ...segment,
        startTimeIST: formatToIST(segment.startTimeUTC),
        endTimeIST: formatToIST(segment.endTimeUTC)
      };
    });

    // Calculate speaking statistics
    const stats = this.speakingSegments.reduce((acc, segment) => {
      acc.total += segment.durationInSeconds;
      acc.max = Math.max(acc.max, segment.durationInSeconds);
      acc.min = Math.min(acc.min, segment.durationInSeconds);
      return acc;
    }, { total: 0, max: -Infinity, min: Infinity });

    this.totalSpeakingTimeInSeconds = stats.total;
    this.speakingCount = this.speakingSegments.length;
    this.averageDurationInSeconds = Number((stats.total / this.speakingCount).toFixed(2));
    this.longestDurationInSeconds = stats.max;
    this.shortestDurationInSeconds = stats.min;
  }

  next();
});

// Indexes
timeTrackingSchema.index({ userId: 1, createdAt: -1 });
timeTrackingSchema.index({ sessionId: 1 });
timeTrackingSchema.index({ chatPageEnterTimeUTC: 1 });

module.exports = mongoose.model('TimeTracking', timeTrackingSchema);
