import api from './api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const chatbotService = {
  // For production with real API
  async sendMessage(message: string, history: Message[] = []) {
    try {
      const response = await api.post('/chat', {
        message,
        history: history.slice(-10) // Send last 10 messages for context
      });
      return {
        message: response.data.message,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Chatbot error:', error);
      throw error;
    }
  },

  // Mock responses for testing without backend
  getMockResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase();
    
    const responses: Record<string, string> = {
      'headache': 'For headaches, try:\n\n1. Stay well hydrated - drink water throughout the day\n2. Rest in a quiet, dark room\n3. Apply a cold compress to your forehead\n4. Consider over-the-counter pain relief if needed\n\nIf headaches are severe, frequent, or persistent, please consult a healthcare provider.',
      
      'sleep': 'For better sleep quality:\n\n1. Maintain a consistent sleep schedule\n2. Avoid screens 1 hour before bedtime\n3. Keep your bedroom cool (65-68°F) and dark\n4. Avoid caffeine after 2 PM\n5. Try relaxation techniques like deep breathing\n6. Limit daytime naps to 20-30 minutes\n\nGood sleep is essential for overall health!',
      
      'exercise': 'Exercise recommendations:\n\n1. Aim for 150 minutes of moderate activity weekly\n2. Start with 30-minute walks, 5 days a week\n3. Include strength training twice weekly\n4. Always warm up for 5-10 minutes\n5. Stay hydrated before, during, and after\n6. Cool down and stretch after workouts\n\nConsult a doctor before starting any new exercise program.',
      
      'water': 'Hydration guidelines:\n\n1. Aim for 8 glasses (64 oz) of water daily\n2. Increase intake when exercising or in hot weather\n3. Signs of good hydration: clear or light yellow urine\n4. Drink water with each meal\n5. Keep a water bottle with you\n\nProper hydration supports all body functions!',
      
      'stress': 'Stress management tips:\n\n1. Practice deep breathing exercises\n2. Regular physical activity\n3. Ensure adequate sleep (7-9 hours)\n4. Time management and prioritization\n5. Talk to friends, family, or a counselor\n6. Try meditation or yoga\n7. Limit caffeine and alcohol\n\nChronic stress affects health - seek support if needed.',
      
      'diet': 'Healthy eating basics:\n\n1. Eat plenty of fruits and vegetables\n2. Choose whole grains over refined grains\n3. Include lean proteins\n4. Limit processed foods and added sugars\n5. Control portion sizes\n6. Stay hydrated\n7. Plan meals ahead when possible\n\nA balanced diet supports overall health and energy.',
      
      'vitamin': 'About vitamins:\n\n1. Best to get nutrients from whole foods\n2. Consider vitamin D, especially in winter\n3. B12 important for vegetarians/vegans\n4. Consult a doctor before starting supplements\n5. More isn\'t always better - some can be harmful in excess\n\nA blood test can identify deficiencies.',
    };

    // Check for keywords
    for (const [keyword, response] of Object.entries(responses)) {
      if (msg.includes(keyword)) {
        return response;
      }
    }

    // Default response
    return 'I understand you\'re asking about health. While I can provide general wellness information, please remember:\n\n• I\'m not a doctor or medical professional\n• This is not medical advice\n• For specific medical concerns, always consult a healthcare provider\n\nCould you tell me more specifically what health topic you\'d like to learn about? I can help with topics like nutrition, exercise, sleep, stress management, and general wellness tips.';
  }
};