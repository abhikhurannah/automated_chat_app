import Message from "../models/message.model.js";
import aiService from "../lib/ai.js";

/**
 * Get AI-powered reply suggestions based on conversation context
 */
export const getReplySuggestions = async (req, res) => {
  try {
    const { messageId, receiverId } = req.body;
    const userId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ 
        message: "receiverId is required" 
      });
    }

    // Check if AI service is available
    if (!aiService.isAvailable()) {
      return res.status(503).json({ 
        message: "AI service not configured",
        suggestions: aiService.getFallbackSuggestions()
      });
    }

    let targetMessage = null;
    
    // If messageId provided, get specific message
    if (messageId && messageId !== 'latest') {
      targetMessage = await Message.findById(messageId);
    }

    // Get recent conversation history
    const conversationHistory = await Message.find({
      $or: [
        { senderId: userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // Reverse to get chronological order
    conversationHistory.reverse();

    // Use the last message if no specific message provided
    const messageText = targetMessage?.text || 
                       (conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1].text : '') || 
                       'Hello!';

    // Generate suggestions
    const suggestions = await aiService.generateReplySuggestions(
      conversationHistory,
      messageText,
      { userId: userId.toString() }
    );

    res.status(200).json({
      suggestions,
      messageId: messageId || 'latest',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in getReplySuggestions:", error.message);
    res.status(500).json({ 
      message: "Failed to generate suggestions",
      suggestions: aiService.getFallbackSuggestions()
    });
  }
};

/**
 * Generate contextual suggestions while typing
 */
export const getTypingSuggestions = async (req, res) => {
  try {
    const { partialText, receiverId } = req.body;
    const userId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    // Get minimal recent context
    const recentMessages = await Message.find({
      $or: [
        { senderId: userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

    recentMessages.reverse();

    // If no text provided or too short, return quick replies
    if (!partialText || partialText.length < 3) {
      return res.status(200).json({
        suggestions: [
          "Sure, sounds good!",
          "Let me think about it",
          "Thanks for letting me know"
        ],
        type: 'quick-reply'
      });
    }

    // Generate context-aware completions
    const suggestions = await aiService.generateReplySuggestions(
      recentMessages,
      partialText,
      { userId: userId.toString(), isPartial: true }
    );

    res.status(200).json({
      suggestions,
      type: 'completion',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in getTypingSuggestions:", error.message);
    res.status(500).json({ 
      message: "Failed to generate typing suggestions",
      suggestions: []
    });
  }
};

/**
 * Direct chatbot conversation (if you want a dedicated AI assistant)
 */
export const chatWithBot = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!aiService.isAvailable()) {
      return res.status(503).json({ 
        message: "AI chatbot not available" 
      });
    }

    // Get recent bot conversation history for this user
    const botConversation = await Message.find({
      $or: [
        { senderId: userId, receiverId: 'bot' },
        { senderId: 'bot', receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    botConversation.reverse();

    // Generate bot response
    const botResponse = await aiService.generateChatbotResponse(
      botConversation,
      message
    );

    // Save user message (if you want to persist bot conversations)
    // const userMessage = new Message({
    //   senderId: userId,
    //   receiverId: 'bot',
    //   text: message
    // });
    // await userMessage.save();

    // Save bot response
    // const botMessage = new Message({
    //   senderId: 'bot',
    //   receiverId: userId,
    //   text: botResponse
    // });
    // await botMessage.save();

    res.status(200).json({
      response: botResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in chatWithBot:", error.message);
    res.status(500).json({ 
      message: "Failed to get bot response",
      response: "I apologize, but I'm having trouble responding right now."
    });
  }
};

/**
 * Get AI analysis of conversation sentiment/tone
 */
export const analyzeConversation = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const userId = req.user._id;

    // Get recent conversation
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    if (messages.length === 0) {
      return res.status(200).json({
        sentiment: 'neutral',
        tone: 'casual',
        topics: []
      });
    }

    // Simple analysis (you can enhance this with AI)
    const analysis = {
      messageCount: messages.length,
      sentiment: 'positive', // Placeholder
      tone: 'friendly',      // Placeholder
      topics: [],            // Placeholder
      timestamp: new Date().toISOString()
    };

    res.status(200).json(analysis);

  } catch (error) {
    console.error("Error in analyzeConversation:", error.message);
    res.status(500).json({ message: "Failed to analyze conversation" });
  }
};