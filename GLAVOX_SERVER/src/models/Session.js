const mongoose = require('mongoose');

// Utility: Convert UTC to IST
const convertToIST = (date) => {
  if (!date) return null;
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms
  return new Date(date.getTime() + istOffset);
};

// Utility: Convert milliseconds to "X minutes Y seconds"
const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
};

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in milliseconds
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  }
}, { timestamps: true });

// ⏱ Auto-calculate duration before save
sessionSchema.pre('save', function (next) {
  if (this.endTime && this.startTime) {
    this.duration = this.endTime - this.startTime;
  }
  next();
});

// 🧠 Virtuals
sessionSchema.virtual('startTimeIST').get(function () {
  return convertToIST(this.startTime);
});

sessionSchema.virtual('endTimeIST').get(function () {
  return convertToIST(this.endTime);
});

sessionSchema.virtual('durationFormatted').get(function () {
  return formatDuration(this.duration || 0);
});

// Include virtuals in JSON and object responses
sessionSchema.set('toJSON', { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

// 📊 Get total sessions in current week for a user
sessionSchema.statics.getWeeklySessionsByUser = async function (userId) {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() + diffToMonday);

  return await this.find({
    userId,
    createdAt: { $gte: startOfWeek }
  }).sort({ createdAt: 1 });
};

// Indexes
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
