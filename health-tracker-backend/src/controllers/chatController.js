const ChatMessage = require('../models/ChatMessage');
const { HTTP_STATUS } = require('../config/constants');
const axios = require('axios');

// Mock responses for testing without API keys
const getMockResponse = (userMessage) => {
  const msg = userMessage.toLowerCase();
  
  const responses = {
    'headache': 'For headaches, try:\n\n1. Stay well hydrated - drink water throughout the day\n2. Rest in a quiet, dark room\n3. Apply a cold compress to your forehead\n4. Consider over-the-counter pain relief if needed\n\nIf headaches are severe, frequent, or persistent, please consult a healthcare provider.',
    'sleep': 'For better sleep quality:\n\n1. Maintain a consistent sleep schedule\n2. Avoid screens 1 hour before bedtime\n3. Keep your bedroom cool (65-68°F) and dark\n4. Avoid caffeine after 2 PM\n5. Try relaxation techniques like deep breathing\n\nGood sleep is essential for overall health!',
    'exercise': 'Exercise recommendations:\n\n1. Aim for 150 minutes of moderate activity weekly\n2. Start with 30-minute walks, 5 days a week\n3. Include strength training twice weekly\n4. Always warm up before and cool down after\n\nConsult a doctor before starting any new exercise program.',
    'water': 'Hydration guidelines:\n\n1. Aim for 8 glasses (64 oz) of water daily\n2. Increase intake when exercising or in hot weather\n3. Signs of good hydration: clear or light yellow urine\n\nProper hydration supports all body functions!',
    'stress': 'Stress management tips:\n\n1. Practice deep breathing exercises\n2. Regular physical activity\n3. Ensure adequate sleep (7-9 hours)\n4. Talk to friends, family, or a counselor\n5. Try meditation or yoga\n\nChronic stress affects health - seek support if needed.',
  };

  for (const [keyword, response] of Object.entries(responses)) {
    if (msg.includes(keyword)) return response;
  }

  return 'I understand you\'re asking about health. While I can provide general wellness information, please remember I\'m not a doctor. For specific medical concerns, always consult a healthcare provider.\n\nWhat health topic would you like to learn about? I can help with nutrition, exercise, sleep, stress management, and general wellness tips.';
};

// @desc    Send message to chatbot
// @route   POST /api/chat
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, conversationId = 'default' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Save user message
    await ChatMessage.create({
      userId: req.user.id,
      conversationId,
      role: 'user',
      content: message
    });

    let assistantMessage;

    // Try to use OpenAI API if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful health assistant. Provide general health information and wellness tips. Always remind users to consult healthcare professionals for medical advice. Keep responses concise and practical.'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 300,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        assistantMessage = response.data.choices[0].message.content;
      } catch (apiError) {
        console.error('OpenAI API error:', apiError.response?.data || apiError.message);
        assistantMessage = getMockResponse(message);
      }
    } else {
      // Use mock responses
      assistantMessage = getMockResponse(message);
    }

    // Save assistant message
    await ChatMessage.create({
      userId: req.user.id,
      conversationId,
      role: 'assistant',
      content: assistantMessage
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: assistantMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat history
// @route   GET /api/chat/history
// @access  Private
exports.getChatHistory = async (req, res, next) => {
  try {
    const { conversationId = 'default', limit = 50 } = req.query;

    const messages = await ChatMessage.find({
      userId: req.user.id,
      conversationId
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: messages.length,
      data: messages.reverse()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete chat history
// @route   DELETE /api/chat/history/:conversationId
// @access  Private
exports.deleteChatHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    await ChatMessage.deleteMany({
      userId: req.user.id,
      conversationId
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Chat history deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await ChatMessage.aggregate([
      { $match: { userId: req.user._id } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$content' },
          lastTimestamp: { $first: '$timestamp' },
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { lastTimestamp: -1 } }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};