import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'ollama';
    this.apiKey = process.env.GROK_API_KEY || process.env.OPENAI_API_KEY;
    this.apiUrl = this.getApiUrl();
    this.model = process.env.AI_MODEL || 'llama3.2:8b';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 150;
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
    
    console.log(`🤖 AI Service initialized with provider: ${this.provider}`);
    console.log(`📦 Model: ${this.model}`);
    console.log(`🌐 API URL: ${this.apiUrl}`);
  }

  getApiUrl() {
    switch (this.provider) {
      case 'ollama':
        return process.env.OLLAMA_API_URL || 'http://localhost:11434';
      case 'grok':
        return process.env.GROK_API_URL || 'https://api.x.ai/v1';
      case 'openai':
        return 'https://api.openai.com/v1';
      default:
        return process.env.OLLAMA_API_URL || 'http://localhost:11434';
    }
  }

  /**
   * Generate reply suggestions based on conversation context
   * @param {Array} conversationHistory - Array of message objects
   * @param {String} currentMessage - The message to reply to
   * @param {Object} userContext - Additional context about the user
   * @returns {Promise<Array>} Array of suggested replies
   */
  async generateReplySuggestions(conversationHistory, currentMessage, userContext = {}) {
    try {
      const prompt = this.buildPrompt(conversationHistory, currentMessage, userContext);
      
      let response;
      
      if (this.provider === 'ollama') {
        response = await this.generateWithOllama(prompt);
      } else {
        response = await this.generateWithCloudAPI(prompt);
      }

      const suggestions = this.parseResponse(response);
      console.log('✅ AI suggestions generated successfully:', suggestions);
      return suggestions;
    } catch (error) {
      console.error('AI Service Error:', error.response?.data || error.message);
      
      // More specific error handling
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to local AI service (Ollama not running?)');
      } else if (error.response?.status === 401) {
        console.error('❌ Authentication failed - please check your API key');
      } else if (error.response?.status === 429) {
        console.error('❌ Rate limit exceeded');
      }
      
      // Fallback suggestions if AI fails
      return this.getFallbackSuggestions(currentMessage);
    }
  }

  async generateWithOllama(prompt) {
    console.log('🦙 Using Ollama for AI generation...');
    
    const response = await axios.post(
      `${this.apiUrl}/api/generate`,
      {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
          stop: ['\n\n', '---']
        }
      },
      {
        timeout: 30000 // 30 second timeout
      }
    );

    return {
      choices: [{
        message: {
          content: response.data.response
        }
      }]
    };
  }

  async generateWithCloudAPI(prompt) {
    console.log(`☁️ Using cloud API (${this.provider}) for AI generation...`);
    
    const isGrok = this.apiUrl.includes('x.ai');
    
    const requestData = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that suggests natural, contextual reply messages. Generate 3 diverse, appropriate reply options that match the conversation tone and context. Return ONLY a JSON array of strings, no markdown or extra text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: false
    };

    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    const response = await axios.post(
      `${this.apiUrl}/chat/completions`,
      requestData,
      { 
        headers,
        timeout: 30000
      }
    );

    return response.data;
  }

  /**
   * Build context-aware prompt from conversation
   */
  buildPrompt(conversationHistory, currentMessage, userContext) {
    const recentMessages = conversationHistory.slice(-5); // Last 5 messages
    
    let contextText = 'Recent conversation:\n';
    recentMessages.forEach((msg, idx) => {
      const role = msg.senderId === userContext.userId ? 'Me' : 'Them';
      contextText += `${role}: ${msg.text || '[Image]'}\n`;
    });
    
    contextText += `\nLatest message to reply to: "${currentMessage}"\n\n`;
    
    if (this.provider === 'ollama') {
      // Simplified prompt for local models
      contextText += 'Generate 3 natural, diverse reply options. Return them as a simple list, one per line:';
    } else {
      // More structured prompt for cloud APIs
      contextText += 'Generate 3 natural, diverse reply options as a JSON array. ';
      contextText += 'Make them conversational and appropriate to the context. ';
      contextText += 'Format: ["reply 1", "reply 2", "reply 3"]';
    }
    
    return contextText;
  }

  /**
   * Parse AI response to extract suggestions
   */
  parseResponse(responseData) {
    try {
      let content;
      
      if (this.provider === 'ollama') {
        // Ollama returns response directly
        content = responseData.choices[0].message.content.trim();
        
        // Parse line-by-line format from Ollama
        const lines = content.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
          .filter(line => line.length > 0);
        
        // Take first 3 lines as suggestions
        let suggestions = lines.slice(0, 3);
        
        // Ensure we have 3 suggestions
        while (suggestions.length < 3) {
          suggestions.push("That's interesting! Tell me more.");
        }
        
        return suggestions;
      } else {
        // Cloud API format
        content = responseData.choices[0].message.content.trim();
        
        // Try to parse as JSON
        let suggestions;
        if (content.startsWith('[') && content.endsWith(']')) {
          suggestions = JSON.parse(content);
        } else {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            suggestions = JSON.parse(jsonMatch[0]);
          } else {
            // Split by newlines as fallback
            suggestions = content.split('\n')
              .filter(line => line.trim().length > 0)
              .map(line => line.replace(/^[-*\d.]+\s*/, '').replace(/^["']|["']$/g, ''))
              .slice(0, 3);
          }
        }
        
        // Ensure we have 3 suggestions
        while (suggestions.length < 3) {
          suggestions.push(`That's interesting! Tell me more.`);
        }
        
        return suggestions.slice(0, 3);
      }
    } catch (error) {
      console.error('Response parsing error:', error);
      return this.getFallbackSuggestions();
    }
  }

  /**
   * Fallback suggestions when AI is unavailable
   */
  getFallbackSuggestions(message = '') {
    const generic = [
      "Thanks for sharing that!",
      "That's interesting! Tell me more.",
      "Got it, thanks!"
    ];
    
    const question = [
      "That's a great question! Let me think about it.",
      "Interesting question! Here's what I think...",
      "Good point! I'd say..."
    ];
    
    const excited = [
      "That's awesome! 🎉",
      "So glad to hear that!",
      "That's really exciting!"
    ];
    
    // Simple heuristic to pick appropriate set
    if (message.includes('?')) {
      return question;
    } else if (message.match(/!|awesome|great|amazing/i)) {
      return excited;
    }
    
    return generic;
  }

  /**
   * Generate a custom AI response (for direct chatbot conversations)
   */
  async generateChatbotResponse(conversationHistory, userMessage) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a friendly, helpful chatbot assistant. Provide concise, natural responses.'
        }
      ];
      
      // Add conversation history
      conversationHistory.slice(-6).forEach(msg => {
        messages.push({
          role: msg.isBot ? 'assistant' : 'user',
          content: msg.text || '[Image shared]'
        });
      });
      
      // Add current message
      messages.push({
        role: 'user',
        content: userMessage
      });
      
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: 200,
          temperature: 0.8
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Chatbot response error:', error.response?.data || error.message);
      return "I'm sorry, I'm having trouble processing that right now. Could you try again?";
    }
  }

  /**
   * Check if AI service is configured and available
   */
  isAvailable() {
    if (this.provider === 'ollama') {
      // For Ollama, we just need the URL (no API key required)
      return !!(this.apiUrl);
    } else {
      // For cloud APIs, we need both URL and API key
      return !!(this.apiKey && this.apiUrl);
    }
  }

  /**
   * Test if Ollama is running and has the model
   */
  async testOllama() {
    try {
      // Check if Ollama is running
      const response = await axios.get(`${this.apiUrl}/api/version`, {
        timeout: 5000
      });
      
      console.log('✅ Ollama is running, version:', response.data.version);
      
      // Check if model is available
      const modelsResponse = await axios.get(`${this.apiUrl}/api/tags`);
      const availableModels = modelsResponse.data.models.map(m => m.name);
      
      if (availableModels.includes(this.model)) {
        console.log('✅ Model', this.model, 'is available');
        return true;
      } else {
        console.log('❌ Model', this.model, 'not found. Available models:', availableModels);
        console.log('💡 Run: ollama pull', this.model);
        return false;
      }
    } catch (error) {
      console.log('❌ Ollama not available:', error.message);
      return false;
    }
  }
}

// Singleton instance
const aiService = new AIService();

export default aiService;