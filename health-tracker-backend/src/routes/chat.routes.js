const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  sendMessage,
  getChatHistory,
  deleteChatHistory,
  getConversations
} = require('../controllers/chatController');

// Validation rules
const messageValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
];

// All routes are protected
router.use(protect);

// Routes
router.post('/', messageValidation, validate, sendMessage);
router.get('/history', getChatHistory);
router.get('/conversations', getConversations);
router.delete('/history/:conversationId', deleteChatHistory);

module.exports = router;