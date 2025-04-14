const moment = require('moment');

/**
 * Convert milliseconds to minutes
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {number} Duration in minutes (rounded to 2 decimal places)
 */
const convertToMinutes = (milliseconds) => {
  if (!milliseconds) return 0;
  return Number((milliseconds / (1000 * 60)).toFixed(2));
};

/**
 * Format a duration in minutes to a human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string (e.g., "5 minutes 30 seconds")
 */
const formatDuration = (minutes) => {
  if (!minutes) return '0 minutes';
  const wholeMinutes = Math.floor(minutes);
  const seconds = Math.round((minutes - wholeMinutes) * 60);
  
  if (wholeMinutes === 0) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  if (seconds === 0) {
    return `${wholeMinutes} minute${wholeMinutes !== 1 ? 's' : ''}`;
  }
  
  return `${wholeMinutes} minute${wholeMinutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
};

/**
 * Format a date to IST format
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted IST date string (e.g., "DD-MM-YYYY hh:mm:ss A IST")
 */
const formatISTDateTime = (date) => {
  if (!date) return 'N/A';
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istDate = new Date(new Date(date).getTime() + istOffset);
  
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const year = istDate.getUTCFullYear();
  
  let hours = istDate.getUTCHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm} IST`;
};

/**
 * Calculate speaking statistics from an array of speaking sessions
 * All durations are converted to minutes
 * @param {Array} sessions - Array of speaking session objects
 * @returns {Object} Statistics object with durations in minutes
 */
const calculateSpeakingStats = (sessions) => {
  if (!sessions || sessions.length === 0) {
    return {
      totalSpeakingTime: 0,
      speakingCount: 0,
      averageDuration: 0,
      longestDuration: 0,
      shortestDuration: 0,
      formattedStats: {
        totalSpeakingTime: '0 mins 0 secs',
        averageDuration: '0 mins 0 secs',
        longestDuration: '0 mins 0 secs',
        shortestDuration: '0 mins 0 secs'
      }
    };
  }

  const durations = sessions.map(session => session.duration || 0);
  const totalSpeakingTime = durations.reduce((sum, duration) => sum + duration, 0);
  const speakingCount = sessions.length;
  const averageDuration = speakingCount > 0 ? totalSpeakingTime / speakingCount : 0;
  const longestDuration = Math.max(...durations);
  const shortestDuration = Math.min(...durations);

  return {
    totalSpeakingTime,
    speakingCount,
    averageDuration,
    longestDuration,
    shortestDuration,
    formattedStats: {
      totalSpeakingTime: formatDuration(totalSpeakingTime),
      averageDuration: formatDuration(averageDuration),
      longestDuration: formatDuration(longestDuration),
      shortestDuration: formatDuration(shortestDuration)
    }
  };
};

module.exports = {
  convertToMinutes,
  formatDuration,
  formatISTDateTime,
  calculateSpeakingStats
}; 