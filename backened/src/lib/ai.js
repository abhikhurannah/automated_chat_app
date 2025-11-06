import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'ollama';
    this.apiKey = process.env.GROK_API_KEY || process.env.OPENAI_API_KEY;
    this.apiUrl = this.getApiUrl();
    this.model = process.env.AI_MODEL || 'llama3.2:3b';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 200;
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.8;
    
    console.log(`🤖 AI Service initialized`);
    console.log(`   Provider: ${this.provider}`);
    console.log(`   Model: ${this.model}`);
    console.log(`   API URL: ${this.apiUrl}`);
    console.log(`   Max Tokens: ${this.maxTokens}`);
    
    // Test connection on startup
    this.testConnection();
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
   * Tone definitions with specific instructions
   */
  getToneInstructions(tone = 'casual') {
    const toneMap = {
      casual: 'Reply in a relaxed, informal, friendly manner. Use everyday language and contractions.',
      professional: 'Reply in a polished, business-appropriate manner. Be clear, concise, and respectful.',
      flirty: 'Reply in a playful, charming, subtly romantic manner. Be fun but tasteful.',
      friendly: 'Reply in a warm, approachable, and supportive manner. Be kind and engaging.',
      formal: 'Reply in a respectful, structured, and proper manner. Use complete sentences and formal language.',
      humorous: 'Reply in a witty, entertaining, and light-hearted manner. Include appropriate humor.'
    };
    
    return toneMap[tone] || toneMap.casual;
  }

  /**
   * Build context summary from conversation history
   */
  buildContextSummary(context) {
    if (!context) return '';
    
    let summary = '';
    
    if (context.userRelationship) {
      const relationshipContext = {
        close: 'very close friend or family',
        familiar: 'good friend or regular contact',
        acquaintance: 'someone they know casually',
        neutral: 'someone they just met'
      };
      summary += `The users are ${relationshipContext[context.userRelationship] || 'chatting'}. `;
    }
    
    if (context.previousTopics && context.previousTopics.length > 0) {
      summary += `Previous topics: ${context.previousTopics.join(', ')}. `;
    }
    
    if (context.messages && context.messages.length > 0) {
      summary += `Recent conversation:\n`;
      context.messages.slice(-5).forEach(msg => {
        const text = msg.text || '[image]';
        summary += `- ${text}\n`;
      });
    }
    
    return summary;
  }

  /**
   * Generate context-aware reply suggestions with tone
   */
  async generateReplySuggestions(conversationHistory, currentMessage, options = {}) {
    try {
      const tone = options.tone || 'casual';
      const context = options.context || {};
      const userId = options.userId;
      const isPartial = options.isPartial || false;
      
      console.log(`🎯 Generating suggestions with tone: ${tone}`);
      
      const prompt = this.buildSuggestionsPrompt(
        conversationHistory,
        currentMessage,
        tone,
        context,
        isPartial
      );
      
      let response;
      
      if (this.provider === 'ollama') {
        response = await this.generateWithOllama(prompt, tone);
      } else {
        response = await this.generateWithCloudAPI(prompt, tone);
      }

      const suggestions = this.parseResponse(response, tone);
      
      console.log('✅ AI suggestions generated:', suggestions.length);
      
      // Return with metadata
      return suggestions.map((suggestion, index) => ({
        suggestion: suggestion,
        confidence: 0.85 - (index * 0.05), // Decreasing confidence
        tone: tone
      }));
      
    } catch (error) {
      console.error('❌ AI Service Error:', error.response?.data || error.message);
      return this.getFallbackSuggestions(currentMessage, tone);
    }
  }

  /**
   * Build prompt for suggestions with tone and context
   */
  buildSuggestionsPrompt(history, message, tone, context, isPartial) {
    let prompt = '';
    
    // Add tone instruction
    prompt += `${this.getToneInstructions(tone)}\n\n`;
    
    // Add context if available
    const contextSummary = this.buildContextSummary(context);
    if (contextSummary) {
      prompt += `Context: ${contextSummary}\n\n`;
    }
    
    // Add recent conversation
    if (history && history.length > 0) {
      prompt += 'Recent conversation:\n';
      history.slice(-5).forEach(msg => {
        const text = msg.text || '[Image]';
        prompt += `${text}\n`;
      });
      prompt += '\n';
    }
    
    // Add the message to respond to
    if (isPartial) {
      prompt += `Complete this message naturally: "${message}"\n\n`;
      prompt += `Provide 3 different ways to complete this message, maintaining the ${tone} tone.\n`;
    } else {
      prompt += `Message to reply to: "${message}"\n\n`;
      prompt += `Generate 3 diverse, natural reply options in a ${tone} tone.\n`;
    }
    
    // Output format instruction
    if (this.provider === 'ollama') {
      prompt += 'Return ONLY the 3 replies, one per line, without numbers or bullets.';
    } else {
      prompt += 'Return ONLY a JSON array of 3 strings: ["reply1", "reply2", "reply3"]';
    }
    
    return prompt;
  }

  /**
   * Generate with Ollama (local)
   */
  async generateWithOllama(prompt, tone = 'casual') {
    console.log('🦙 Using Ollama...');
    
    const response = await axios.post(
      `${this.apiUrl}/api/generate`,
      {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.getToneTemperature(tone),
          num_predict: this.maxTokens,
          stop: ['\n\n', '---', 'User:', 'Assistant:']
        }
      },
      {
        timeout: 30000
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

  /**
   * Generate with Cloud API (OpenAI/Grok)
   */
  async generateWithCloudAPI(prompt, tone = 'casual') {
    console.log(`☁️ Using ${this.provider}...`);
    
    const systemPrompt = `You are a helpful AI assistant that generates natural, contextual message suggestions. 
Always maintain the specified tone and context. Generate diverse, appropriate replies that feel human and natural.
Return responses as a clean JSON array of strings only.`;

    const requestData = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.maxTokens,
      temperature: this.getToneTemperature(tone),
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
   * Get temperature based on tone
   */
  getToneTemperature(tone) {
    const tempMap = {
      casual: 0.8,
      professional: 0.5,
      flirty: 0.9,
      friendly: 0.7,
      formal: 0.4,
      humorous: 0.9
    };
    return tempMap[tone] || 0.7;
  }

  /**
   * Parse AI response
   */
  parseResponse(responseData, tone) {
    try {
      let content;
      
      if (this.provider === 'ollama') {
        content = responseData.choices[0].message.content.trim();
        
        // Parse line-by-line
        const lines = content.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^[-*\d.)"']+\s*/, '').trim())
          .filter(line => line.length > 5 && line.length < 200);
        
        let suggestions = lines.slice(0, 3);
        
        // Ensure 3 suggestions
        while (suggestions.length < 3) {
          suggestions.push(this.getDefaultReply(tone));
        }
        
        return suggestions;
      } else {
        // Cloud API
        content = responseData.choices[0].message.content.trim();
        
        // Try JSON parse
        let suggestions;
        if (content.startsWith('[') && content.endsWith(']')) {
          suggestions = JSON.parse(content);
        } else {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            suggestions = JSON.parse(jsonMatch[0]);
          } else {
            suggestions = content.split('\n')
              .filter(line => line.trim().length > 0)
              .map(line => line.replace(/^[-*\d.)"']+\s*/, '').replace(/^["']|["']$/g, '').trim())
              .slice(0, 3);
          }
        }
        
        while (suggestions.length < 3) {
          suggestions.push(this.getDefaultReply(tone));
        }
        
        return suggestions.slice(0, 3);
      }
    } catch (error) {
      console.error('Response parsing error:', error);
      return this.getFallbackSuggestions('', tone).map(s => s.suggestion);
    }
  }

  /**
   * Get default reply based on tone
   */
  getDefaultReply(tone) {
    const defaults = {
      casual: "That's cool! Tell me more.",
      professional: "Thank you for sharing that information.",
      flirty: "That's interesting... I'd love to know more 😊",
      friendly: "That sounds great! Thanks for telling me!",
      formal: "I appreciate you bringing this to my attention.",
      humorous: "Ha! That's a good one. What happened next?"
    };
    return defaults[tone] || defaults.casual;
  }

  /**
   * Fallback suggestions with tone support
   */
  getFallbackSuggestions(message = '', tone = 'casual') {
    const fallbacks = {
      casual: [
        { suggestion: "That's interesting! Tell me more.", confidence: 0.7, tone },
        { suggestion: "Got it, thanks for sharing!", confidence: 0.65, tone },
        { suggestion: "Cool! What else is up?", confidence: 0.6, tone }
      ],
      professional: [
        { suggestion: "Thank you for the information.", confidence: 0.7, tone },
        { suggestion: "I appreciate you sharing that.", confidence: 0.65, tone },
        { suggestion: "That's helpful to know.", confidence: 0.6, tone }
      ],
      flirty: [
        { suggestion: "That's so interesting... tell me more 😊", confidence: 0.7, tone },
        { suggestion: "I love hearing about this from you!", confidence: 0.65, tone },
        { suggestion: "You always have the best stories 😉", confidence: 0.6, tone }
      ],
      friendly: [
        { suggestion: "That sounds wonderful! Thanks for sharing!", confidence: 0.7, tone },
        { suggestion: "I'm so glad you told me about this!", confidence: 0.65, tone },
        { suggestion: "That's really nice to hear!", confidence: 0.6, tone }
      ],
      formal: [
        { suggestion: "I acknowledge your message.", confidence: 0.7, tone },
        { suggestion: "Thank you for bringing this to my attention.", confidence: 0.65, tone },
        { suggestion: "I understand and appreciate your input.", confidence: 0.6, tone }
      ],
      humorous: [
        { suggestion: "Ha! That's hilarious! What happened next? 😄", confidence: 0.7, tone },
        { suggestion: "You're killing me! Tell me more!", confidence: 0.65, tone },
        { suggestion: "That's comedy gold right there! 🎭", confidence: 0.6, tone }
      ]
    };
    
    return fallbacks[tone] || fallbacks.casual;
  }

  /**
   * Generate chatbot response with tone
   */
  async generateChatbotResponse(chatHistory, userMessage, tone = 'casual') {
    try {
      console.log(`💬 Generating chatbot response (${tone} tone)`);
      
      const messages = [
        {
          role: 'system',
          content: `You are a friendly, helpful chatbot assistant. ${this.getToneInstructions(tone)} 
Provide concise, natural responses. Be engaging and helpful.`
        }
      ];
      
      // Add chat history
      if (chatHistory && chatHistory.length > 0) {
        chatHistory.slice(-6).forEach(msg => {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content || msg.text || '[message]'
          });
        });
      }
      
      // Add current message
      messages.push({
        role: 'user',
        content: userMessage
      });
      
      if (this.provider === 'ollama') {
        // Build conversation for Ollama
        let prompt = `${messages[0].content}\n\n`;
        messages.slice(1).forEach(msg => {
          prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        prompt += 'Assistant: ';
        
        const response = await axios.post(
          `${this.apiUrl}/api/generate`,
          {
            model: this.model,
            prompt: prompt,
            stream: false,
            options: {
              temperature: this.getToneTemperature(tone),
              num_predict: 200
            }
          },
          { timeout: 30000 }
        );
        
        return response.data.response.trim();
      } else {
        // Cloud API
        const response = await axios.post(
          `${this.apiUrl}/chat/completions`,
          {
            model: this.model,
            messages: messages,
            max_tokens: 200,
            temperature: this.getToneTemperature(tone)
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        
        return response.data.choices[0].message.content;
      }
    } catch (error) {
      console.error('❌ Chatbot response error:', error.response?.data || error.message);
      return "I apologize, but I'm having trouble processing that right now. Could you try rephrasing?";
    }
  }

  /**
   * Analyze conversation for sentiment, tone, topics
   */
  async analyzeConversation(messages) {
    try {
      if (!messages || messages.length === 0) {
        return this.getDefaultAnalysis();
      }
      
      console.log(`🔍 Analyzing ${messages.length} messages...`);
      
      // Build analysis prompt
      const messageTexts = messages
        .map(m => m.text || '[image]')
        .filter(t => t !== '[image]')
        .slice(-20)
        .join('\n');
      
      const prompt = `Analyze this conversation and provide:
1. Overall sentiment (positive/negative/neutral)
2. Conversation tone (casual/friendly/professional/formal)
3. Main topics discussed (list 3-5 keywords)
4. 3 suggestions to improve the conversation

Conversation:
${messageTexts}

Return ONLY a JSON object in this exact format:
{
  "sentiment": "positive",
  "tone": "friendly",
  "topics": ["topic1", "topic2", "topic3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "conversationStyle": "engaging",
  "emotionalTone": "warm"
}`;

      let response;
      
      if (this.provider === 'ollama') {
        response = await axios.post(
          `${this.apiUrl}/api/generate`,
          {
            model: this.model,
            prompt: prompt,
            stream: false,
            options: {
              temperature: 0.3,
              num_predict: 300
            }
          },
          { timeout: 30000 }
        );
        
        const content = response.data.response.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } else {
        response = await axios.post(
          `${this.apiUrl}/chat/completions`,
          {
            model: this.model,
            messages: [
              {
                role: 'system',
                content: 'You are a conversation analyst. Return ONLY valid JSON, no markdown.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 300,
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        
        const content = response.data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      return this.getDefaultAnalysis();
      
    } catch (error) {
      console.error('❌ Analysis error:', error.response?.data || error.message);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Default analysis when AI fails
   */
  getDefaultAnalysis() {
    return {
      sentiment: 'neutral',
      tone: 'casual',
      topics: ['general conversation', 'daily chat', 'updates'],
      suggestions: [
        'Ask open-ended questions to keep the conversation flowing',
        'Share more about your experiences and thoughts',
        'Show interest in what the other person is saying'
      ],
      conversationStyle: 'natural',
      emotionalTone: 'neutral'
    };
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    if (this.provider === 'ollama') {
      return !!this.apiUrl;
    }
    return !!(this.apiKey && this.apiUrl);
  }

  /**
   * Test connection on startup
   */
  async testConnection() {
    try {
      if (this.provider === 'ollama') {
        const response = await axios.get(`${this.apiUrl}/api/version`, {
          timeout: 5000
        });
        console.log('✅ Ollama connected, version:', response.data.version);
        
        // Check model availability
        const tags = await axios.get(`${this.apiUrl}/api/tags`);
        const models = tags.data.models.map(m => m.name);
        
        if (models.includes(this.model)) {
          console.log('✅ Model available:', this.model);
        } else {
          console.log('⚠️  Model not found:', this.model);
          console.log('💡 Available models:', models.join(', '));
          console.log('💡 Run: ollama pull', this.model);
        }
      } else {
        if (this.apiKey) {
          console.log('✅ Cloud API configured:', this.provider);
        } else {
          console.log('⚠️  No API key found for:', this.provider);
        }
      }
    } catch (error) {
      console.log('⚠️  AI service not available:', error.message);
      console.log('💡 App will use fallback suggestions');
    }
  }
}

// Singleton instance
const aiService = new AIService();

export default aiService;