module.exports = {
  SCREEN_TIME_CATEGORIES: ['social', 'work', 'entertainment', 'other'],
  REMINDER_CATEGORIES: ['medication', 'appointment', 'water', 'exercise', 'custom'],
  
  SCREEN_TIME_GOAL_MINUTES: 180, // 3 hours
  
  JWT_COOKIE_EXPIRE: 7, // days
  
  PASSWORD_MIN_LENGTH: 6,
  
  VALIDATION_MESSAGES: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please provide a valid email',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
    INVALID_DATE: 'Please provide a valid date',
    INVALID_TIME: 'Please provide a valid time',
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
  }
};