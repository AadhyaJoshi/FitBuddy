const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  getAllReminders,
  getActiveReminders,
  getReminder,
  createReminder,
  updateReminder,
  toggleReminderCompletion,
  deleteReminder,
  getRemindersByCategory,
  getTodaysReminders
} = require('../controllers/reminderController');

// Validation rules
const reminderValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['medication', 'appointment', 'water', 'exercise', 'custom'])
    .withMessage('Invalid category'),
  body('time')
    .notEmpty()
    .withMessage('Time is required')
    .isISO8601()
    .withMessage('Please provide a valid time')
];

// All routes are protected
router.use(protect);

// Routes
router.get('/', getAllReminders);
router.get('/active', getActiveReminders);
router.get('/today', getTodaysReminders);
router.get('/category/:category', getRemindersByCategory);
router.get('/:id', getReminder);
router.post('/', reminderValidation, validate, createReminder);
router.put('/:id', updateReminder);
router.patch('/:id', toggleReminderCompletion);
router.delete('/:id', deleteReminder);

module.exports = router;