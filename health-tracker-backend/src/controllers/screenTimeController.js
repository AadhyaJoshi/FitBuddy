const ScreenTime = require('../models/ScreenTime');
const { HTTP_STATUS } = require('../config/constants');

// @desc    Get all screen time entries for user
// @route   GET /api/screentime
// @access  Private
exports.getAllScreenTime = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;

    let query = { userId: req.user.id };

    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const screenTimes = await ScreenTime.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: screenTimes.length,
      data: screenTimes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's screen time
// @route   GET /api/screentime/today
// @access  Private
exports.getTodayScreenTime = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const screenTime = await ScreenTime.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Get total days tracked
    const daysTracked = await ScreenTime.countDocuments({
      userId: req.user.id
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      totalMinutes: screenTime ? screenTime.totalMinutes : 0,
      breakdown: screenTime ? screenTime.breakdown : [],
      daysTracked,
      data: screenTime
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get screen time by date
// @route   GET /api/screentime/:date
// @access  Private
exports.getScreenTimeByDate = async (req, res, next) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const screenTime = await ScreenTime.findOne({
      userId: req.user.id,
      date: {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!screenTime) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'No screen time entry found for this date'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: screenTime
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update screen time entry
// @route   POST /api/screentime
// @access  Private
exports.createScreenTime = async (req, res, next) => {
  try {
    const { date, totalMinutes, category } = req.body;

    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    // Check if entry already exists for this date
    let screenTime = await ScreenTime.findOne({
      userId: req.user.id,
      date: {
        $gte: entryDate,
        $lt: new Date(entryDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (screenTime) {
      // Add to existing entry
      screenTime.breakdown.push({
        category,
        minutes: totalMinutes
      });
      screenTime.totalMinutes += totalMinutes;
      await screenTime.save();
    } else {
      // Create new entry
      screenTime = await ScreenTime.create({
        userId: req.user.id,
        date: entryDate,
        totalMinutes,
        breakdown: [{ category, minutes: totalMinutes }]
      });
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Screen time logged successfully',
      data: screenTime
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update screen time entry
// @route   PUT /api/screentime/:id
// @access  Private
exports.updateScreenTime = async (req, res, next) => {
  try {
    let screenTime = await ScreenTime.findById(req.params.id);

    if (!screenTime) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Screen time entry not found'
      });
    }

    // Make sure user owns the screen time entry
    if (screenTime.userId.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Not authorized to update this entry'
      });
    }

    screenTime = await ScreenTime.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: screenTime
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete screen time entry
// @route   DELETE /api/screentime/:id
// @access  Private
exports.deleteScreenTime = async (req, res, next) => {
  try {
    const screenTime = await ScreenTime.findById(req.params.id);

    if (!screenTime) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Screen time entry not found'
      });
    }

    // Make sure user owns the screen time entry
    if (screenTime.userId.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Not authorized to delete this entry'
      });
    }

    await screenTime.deleteOne();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Screen time entry deleted',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get screen time statistics
// @route   GET /api/screentime/stats
// @access  Private
exports.getScreenTimeStats = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const screenTimes = await ScreenTime.find({
      userId: req.user.id,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Calculate statistics
    const totalMinutes = screenTimes.reduce((sum, st) => sum + st.totalMinutes, 0);
    const avgMinutesPerDay = screenTimes.length > 0 ? totalMinutes / screenTimes.length : 0;

    // Category breakdown
    const categoryStats = {};
    screenTimes.forEach(st => {
      st.breakdown.forEach(item => {
        if (!categoryStats[item.category]) {
          categoryStats[item.category] = 0;
        }
        categoryStats[item.category] += item.minutes;
      });
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        period: `${days} days`,
        totalMinutes,
        avgMinutesPerDay: Math.round(avgMinutesPerDay),
        daysLogged: screenTimes.length,
        categoryBreakdown: categoryStats,
        entries: screenTimes
      }
    });
  } catch (error) {
    next(error);
  }
};