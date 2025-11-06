import Message from "../models/message.model.js";
import aiService from "../lib/ai.js";

/**
 * Get AI-powered reply suggestions with context and tone
 */
export const getReplySuggestions = async (req, res) => {
  try {
    const { messageId, receiverId, tone, context } = req.body;
    const userId = req.user._id;

    console.log('📨 Reply suggestions request:', {
      messageId,
      receiverId,
      tone: tone || 'casual',
      hasContext: !!context
    });

    if (!receiverId) {
      return res.status(400).json({ 
        message: "receiverId is required" 
      });
    }

    // Check if AI service is available
    if (!aiService.isAvailable()) {
      console.log('⚠️  AI service not available, using fallbacks');
      return res.status(200).json({ 
        suggestions: aiService.getFallbackSuggestions('', tone || 'casual'),
        fallback: true
      });
    }

    // Get conversation history
    const conversationHistory = await Message.find({
      $or: [
        { senderId: userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    conversationHistory.reverse();

    // Determine the message to respond to
    let targetMessage = null;
    if (messageId && messageId !== 'latest') {
      targetMessage = await Message.findById(messageId);
    }
    
    const messageText = targetMessage?.text || 
                       (conversationHistory.length > 0 ? 
                        conversationHistory[conversationHistory.length - 1].text : '') || 
                       'Hello!';

    // Generate context-aware suggestions
    const suggestions = await aiService.generateReplySuggestions(
      conversationHistory,
      messageText,
      {
        userId: userId.toString(),
        tone: tone || 'casual',
        context: context || {}
      }
    );

    console.log('✅ Suggestions generated:', suggestions.length);

    res.status(200).json({
      suggestions,
      messageId: messageId || 'latest',
      tone: tone || 'casual',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error in getReplySuggestions:", error.message);
    res.status(500).json({ 
      message: "Failed to generate suggestions",
      suggestions: aiService.getFallbackSuggestions('', req.body.tone || 'casual'),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Generate contextual suggestions while typing
 */
export const getTypingSuggestions = async (req, res) => {
  try {
    const { partialText, receiverId, tone, context } = req.body;
    const userId = req.user._id;

    console.log('⌨️  Typing suggestions:', {
      textLength: partialText?.length || 0,
      tone: tone || 'casual',
      hasContext: !!context
    });

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    // Quick replies for short text
    if (!partialText || partialText.length < 2) {
      const quickReplies = {
        casual: ["Sure, sounds good!", "Let me think about it", "Thanks for letting me know"],
        professional: ["I understand.", "Thank you for the update.", "I'll review this shortly."],
        flirty: ["That sounds fun 😊", "I'd love that!", "You're sweet 💕"],
        friendly: ["That's great!", "Sounds awesome!", "I'm so happy for you!"],
        formal: ["Understood.", "Thank you for informing me.", "I acknowledge this."],
        humorous: ["Ha! Good one!", "That's hilarious! 😄", "You crack me up!"]
      };
      
      return res.status(200).json({
        suggestions: quickReplies[tone || 'casual'] || quickReplies.casual,
        type: 'quick-reply'
      });
    }

    // Get recent context
    const recentMessages = await Message.find({
      $or: [
        { senderId: userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    recentMessages.reverse();

    // Generate completions
    if (aiService.isAvailable()) {
      const suggestions = await aiService.generateReplySuggestions(
        recentMessages,
        partialText,
        { 
          userId: userId.toString(), 
          isPartial: true,
          tone: tone || 'casual',
          context: context || {}
        }
      );

      return res.status(200).json({
        suggestions: suggestions.map(s => s.suggestion),
        type: 'completion',
        tone: tone || 'casual',
        timestamp: new Date().toISOString()
      });
    } else {
      // Simple completion fallback
      return res.status(200).json({
        suggestions: [
          `${partialText}...`,
          `${partialText}!`,
          `${partialText}?`
        ],
        type: 'completion',
        fallback: true
      });
    }

  } catch (error) {
    console.error("❌ Error in getTypingSuggestions:", error.message);
    res.status(500).json({ 
      message: "Failed to generate typing suggestions",
      suggestions: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Direct chatbot conversation with tone support
 */
export const chatWithBot = async (req, res) => {
  try {
    const { message, tone, chatHistory } = req.body;
    const userId = req.user._id;

    console.log('💬 Chatbot request:', {
      messageLength: message?.length || 0,
      tone: tone || 'casual',
      historyLength: chatHistory?.length || 0
    });

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!aiService.isAvailable()) {
      return res.status(503).json({ 
        message: "AI chatbot not available",
        response: "I'm sorry, but I'm not available right now. Please try again later."
      });
    }

    // Generate bot response with tone
    const botResponse = await aiService.generateChatbotResponse(
      chatHistory || [],
      message,
      tone || 'casual'
    );

    console.log('✅ Chatbot response generated');

    res.status(200).json({
      response: botResponse,
      tone: tone || 'casual',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error in chatWithBot:", error.message);
    res.status(500).json({ 
      message: "Failed to get bot response",
      response: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Analyze conversation for sentiment, tone, and topics
 */
export const analyzeConversation = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const { messages: providedMessages } = req.body;
    const userId = req.user._id;

    console.log('🔍 Analysis request:', {
      receiverId,
      providedMessages: providedMessages?.length || 0
    });

    // Use provided messages or fetch from database
    let messages;
    if (providedMessages && providedMessages.length > 0) {
      messages = providedMessages;
    } else {
      messages = await Message.find({
        $or: [
          { senderId: userId, receiverId: receiverId },
          { senderId: receiverId, receiverId: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    }

    if (messages.length === 0) {
      return res.status(200).json({
        sentiment: 'neutral',
        tone: 'casual',
        topics: [],
        suggestions: [
          'Start by introducing yourself',
          'Ask an open-ended question',
          'Share something interesting'
        ],
        messageCount: 0
      });
    }

    // Perform AI analysis if available
    let analysis;
    if (aiService.isAvailable()) {
      analysis = await aiService.analyzeConversation(messages);
    } else {
      // Basic analysis without AI
      analysis = performBasicAnalysis(messages);
    }

    // Add message count
    analysis.messageCount = messages.length;
    analysis.timestamp = new Date().toISOString();

    console.log('✅ Analysis complete:', {
      sentiment: analysis.sentiment,
      tone: analysis.tone,
      topicCount: analysis.topics?.length || 0
    });

    res.status(200).json(analysis);

  } catch (error) {
    console.error("❌ Error in analyzeConversation:", error.message);
    res.status(500).json({ 
      message: "Failed to analyze conversation",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Perform basic analysis without AI
 */
function performBasicAnalysis(messages) {
  // Count positive/negative words
  const positiveWords = ['love', 'great', 'awesome', 'good', 'happy', 'thanks', 'wonderful', 'nice', 'amazing', 'perfect'];
  const negativeWords = ['bad', 'hate', 'sad', 'angry', 'terrible', 'awful', 'horrible', 'disappointed', 'sorry', 'upset'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  const topicWords = {};
  
  messages.forEach(msg => {
    if (!msg.text) return;
    const text = msg.text.toLowerCase();
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
    
    // Extract potential topics (words longer than 5 characters)
    const words = text.split(/\s+/);
    words.forEach(word => {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (cleaned.length > 5) {
        topicWords[cleaned] = (topicWords[cleaned] || 0) + 1;
      }
    });
  });
  
  // Determine sentiment
  let sentiment = 'neutral';
  if (positiveCount > negativeCount * 2) sentiment = 'positive';
  else if (negativeCount > positiveCount * 2) sentiment = 'negative';
  
  // Determine tone based on message characteristics
  const avgLength = messages.reduce((sum, m) => sum + (m.text?.length || 0), 0) / messages.length;
  let tone = 'casual';
  if (avgLength > 100) tone = 'formal';
  else if (positiveCount > 5) tone = 'friendly';
  
  // Get top topics
  const topics = Object.entries(topicWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  return {
    sentiment,
    tone,
    topics,
    suggestions: [
      'Keep the conversation balanced with questions and statements',
      'Show genuine interest in what they share',
      'Be responsive and engaged'
    ],
    conversationStyle: avgLength > 80 ? 'detailed' : 'brief',
    emotionalTone: sentiment === 'positive' ? 'warm' : sentiment === 'negative' ? 'concerned' : 'neutral'
  };
}

/**
 * Health check for AI service
 */
export const getAIStatus = async (req, res) => {
  try {
    const status = {
      available: aiService.isAvailable(),
      provider: aiService.provider,
      model: aiService.model,
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ 
      available: false,
      error: error.message 
    });
  }
};