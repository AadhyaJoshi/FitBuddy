const Reminder = require('../models/Reminder');
const { HTTP_STATUS } = require('../config/constants');

// @desc    Get all reminders for user
// @route   GET /api/reminders
// @access  Private
exports.getAllReminders = async (req, res, next) => {
  try {
    const { isActive, category } = req.query;

    let query = { userId: req.user.id };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (category) {
      query.category = category;
    }

    const reminders = await Reminder.find(query).sort({ time: 1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active reminders
// @route   GET /api/reminders/active
// @access  Private
exports.getActiveReminders = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({
      userId: req.user.id,
      isActive: true
    }).sort({ time: 1 });

    // Get upcoming reminders (next 5)
    const now = new Date();
    const upcoming = reminders
      .filter(r => new Date(r.time) > now)
      .slice(0, 5);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: reminders.length,
      upcoming,
      data: reminders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single reminder
// @route   GET /api/reminders/:id
// @access  Private
exports.getReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Make sure user owns the reminder
    if (reminder.userId.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Not authorized to access this reminder'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create reminder
// @route   POST /api/reminders
// @access  Private
exports.createReminder = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.userId = req.user.id;

    const reminder = await Reminder.create(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Reminder created successfully',
      data: reminder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
// @access  Private
exports.updateReminder = async (req, res, next) => {
  try {
    let reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Make sure user owns the reminder
    if (reminder.userId.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Not authorized to update this reminder'
      });
    }

    reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle reminder completion
// @route   PATCH /api/reminders/:id
// @access  Private
exports.toggleReminderCompletion = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Make sure user owns the reminder
    if (reminder.userId.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Not authorized to update this reminder'
      });
    }

    reminder.isCompleted = req.body.isCompleted !== undefined 
      ? req.body.isCompleted 
      : !reminder.isCompleted;
    
    if (reminder.isCompleted) {
      reminder.completedAt = new Date();
    } else {
      reminder.completedAt = undefined;
    }

    await reminder.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
exports.deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Make sure user owns the reminder
    if (reminder.userId.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Not authorized to delete this reminder'
      });
    }

    await reminder.deleteOne();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Reminder deleted',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reminders by category
// @route   GET /api/reminders/category/:category
// @access  Private
exports.getRemindersByCategory = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({
      userId: req.user.id,
      category: req.params.category,
      isActive: true
    }).sort({ time: 1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's reminders
// @route   GET /api/reminders/today
// @access  Private
exports.getTodaysReminders = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reminders = await Reminder.find({
      userId: req.user.id,
      isActive: true,
      time: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ time: 1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    next(error);
  }
};