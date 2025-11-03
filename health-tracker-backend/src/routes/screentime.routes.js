const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  getAllScreenTime,
  getTodayScreenTime,
  getScreenTimeByDate,
  createScreenTime,
  updateScreenTime,
  deleteScreenTime,
  getScreenTimeStats
} = require('../controllers/screenTimeController');

// Validation rules
const screenTimeValidation = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('totalMinutes')
    .notEmpty()
    .withMessage('Total minutes is required')
    .isInt({ min: 0 })
    .withMessage('Total minutes must be a positive number'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['social', 'work', 'entertainment', 'other'])
    .withMessage('Invalid category')
];

// All routes are protected
router.use(protect);

// Routes
router.get('/', getAllScreenTime);
router.get('/today', getTodayScreenTime);
router.get('/stats', getScreenTimeStats);
router.get('/:date', getScreenTimeByDate);
router.post('/', screenTimeValidation, validate, createScreenTime);
router.put('/:id', updateScreenTime);
router.delete('/:id', deleteScreenTime);

module.exports = router;