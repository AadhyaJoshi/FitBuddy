const mongoose = require('mongoose');

const BreakdownSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['social', 'work', 'entertainment', 'other']
  },
  minutes: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const ScreenTimeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  totalMinutes: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  breakdown: [BreakdownSchema],
  goal: {
    type: Number,
    default: 180 // 3 hours
  },
  notes: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for user and date
ScreenTimeSchema.index({ userId: 1, date: 1 }, { unique: true });

// Update timestamp on save
ScreenTimeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total from breakdown
ScreenTimeSchema.pre('save', function(next) {
  if (this.breakdown && this.breakdown.length > 0) {
    this.totalMinutes = this.breakdown.reduce((sum, item) => sum + item.minutes, 0);
  }
  next();
});

module.exports = mongoose.model('ScreenTime', ScreenTimeSchema);