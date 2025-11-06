import { create } from "zustand";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export type ConversationTone = 'casual' | 'professional' | 'flirty' | 'friendly' | 'formal' | 'humorous';

interface AISuggestion {
  suggestion: string;
  confidence: number;
  tone?: ConversationTone;
}

interface AIAnalysis {
  sentiment: string;
  tone: string;
  topics: string[];
  suggestions: string[];
  conversationStyle?: string;
  emotionalTone?: string;
}

interface ConversationContext {
  messages: Array<{
    text: string;
    senderId: string;
    timestamp: string;
  }>;
  userRelationship?: string;
  previousTopics?: string[];
}

interface AIState {
  replySuggestions: AISuggestion[];
  typingSuggestions: string[];
  isLoadingSuggestions: boolean;
  isLoadingTyping: boolean;
  isLoadingAnalysis: boolean;
  analysis: AIAnalysis | null;
  isAIEnabled: boolean;
  selectedTone: ConversationTone;
  conversationContext: ConversationContext | null;
  chatbotMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  isLoadingChatbot: boolean;

  // Actions
  getReplySuggestions: (messageId: string, receiverId: string, context?: ConversationContext) => Promise<void>;
  getTypingSuggestions: (partialText: string, receiverId: string, context?: ConversationContext) => Promise<void>;
  analyzeConversation: (receiverId: string, messages: any[]) => Promise<void>;
  chatWithBot: (message: string, tone?: ConversationTone) => Promise<string>;
  clearSuggestions: () => void;
  toggleAI: () => void;
  setSelectedTone: (tone: ConversationTone) => void;
  setConversationContext: (context: ConversationContext) => void;
  clearChatbotMessages: () => void;
}

// Generic API request function with better error handling
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}/api/chatbot${endpoint}`;
  
  console.log('🌐 AI API Request:', { url, method: options.method || 'GET' });
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    console.log('📡 AI API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'AI service temporarily unavailable' 
      }));
      console.error('❌ AI API Error:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ AI API Success:', data);
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to AI service. Please check your connection.');
    }
    throw error;
  }
}

export const useAIStore = create<AIState>((set, get) => ({
  replySuggestions: [],
  typingSuggestions: [],
  isLoadingSuggestions: false,
  isLoadingTyping: false,
  isLoadingAnalysis: false,
  analysis: null,
  isAIEnabled: true,
  selectedTone: 'casual',
  conversationContext: null,
  chatbotMessages: [],
  isLoadingChatbot: false,

  getReplySuggestions: async (messageId, receiverId, context) => {
    if (!get().isAIEnabled) return;
    
    const state = get();
    const tone = state.selectedTone;
    const conversationContext = context || state.conversationContext;
    
    console.log('🤖 Getting context-aware reply suggestions...', { 
      messageId, 
      receiverId, 
      tone,
      hasContext: !!conversationContext 
    });
    
    set({ isLoadingSuggestions: true });
    try {
      const response = await apiRequest<{ suggestions: AISuggestion[] }>('/suggestions/reply', {
        method: 'POST',
        body: JSON.stringify({
          messageId,
          receiverId,
          tone,
          context: conversationContext,
        }),
      });
      
      console.log('✅ Reply suggestions received:', response.suggestions);
      set({ replySuggestions: response.suggestions });
    } catch (error) {
      console.error("❌ Error getting reply suggestions:", error);
      // Provide fallback generic suggestions
      set({ 
        replySuggestions: [
          { suggestion: "That's interesting! Tell me more.", confidence: 0.7, tone },
          { suggestion: "I see what you mean.", confidence: 0.6, tone },
          { suggestion: "Thanks for sharing that with me.", confidence: 0.65, tone },
        ]
      });
    } finally {
      set({ isLoadingSuggestions: false });
    }
  },

  getTypingSuggestions: async (partialText, receiverId, context) => {
    if (!get().isAIEnabled || partialText.length < 2) {
      set({ typingSuggestions: [] });
      return;
    }
    
    const state = get();
    const tone = state.selectedTone;
    const conversationContext = context || state.conversationContext;
    
    console.log('⌨️ Getting typing suggestions...', { 
      partialText, 
      tone,
      hasContext: !!conversationContext 
    });
    
    set({ isLoadingTyping: true });
    try {
      const response = await apiRequest<{ suggestions: any[] }>('/suggestions/typing', {
        method: 'POST',
        body: JSON.stringify({
          partialText,
          receiverId,
          tone,
          context: conversationContext,
        }),
      });
      
      // Extract suggestion text from the response
      const suggestionTexts = response.suggestions.map(s => 
        typeof s === 'string' ? s : s.suggestion || s.text || s
      );
      
      console.log('✅ Typing suggestions:', suggestionTexts);
      set({ typingSuggestions: suggestionTexts });
    } catch (error) {
      console.error("Error getting typing suggestions:", error);
      set({ typingSuggestions: [] });
    } finally {
      set({ isLoadingTyping: false });
    }
  },

  analyzeConversation: async (receiverId, messages = []) => {
    if (!get().isAIEnabled) return;
    
    console.log('🔍 Analyzing conversation...', { receiverId, messageCount: messages.length });
    
    set({ isLoadingAnalysis: true });
    try {
      const response = await apiRequest<AIAnalysis>(`/analyze/${receiverId}`, {
        method: 'POST',
        body: JSON.stringify({
          messages: messages.slice(-20), // Send last 20 messages for context
        }),
      });
      
      console.log('✅ Analysis complete:', response);
      set({ analysis: response });
      toast.success('Conversation analyzed successfully!');
    } catch (error) {
      console.error("Error analyzing conversation:", error);
      toast.error("Failed to analyze conversation");
    } finally {
      set({ isLoadingAnalysis: false });
    }
  },

  chatWithBot: async (message, tone) => {
    if (!get().isAIEnabled) throw new Error("AI is disabled");
    
    const selectedTone = tone || get().selectedTone;
    const chatHistory = get().chatbotMessages;
    
    console.log('💬 Chatting with bot...', { message, tone: selectedTone });
    
    // Add user message to history
    const userMessage = { 
      role: 'user' as const, 
      content: message, 
      timestamp: new Date() 
    };
    set({ 
      chatbotMessages: [...chatHistory, userMessage],
      isLoadingChatbot: true 
    });
    
    try {
      const response = await apiRequest<{ response: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message,
          tone: selectedTone,
          chatHistory: chatHistory.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });
      
      // Add bot response to history
      const botMessage = {
        role: 'assistant' as const,
        content: response.response,
        timestamp: new Date()
      };
      set({ 
        chatbotMessages: [...get().chatbotMessages, botMessage],
        isLoadingChatbot: false
      });
      
      return response.response;
    } catch (error) {
      console.error("Error chatting with bot:", error);
      set({ isLoadingChatbot: false });
      throw new Error(error instanceof Error ? error.message : "Failed to get AI response");
    }
  },

  clearSuggestions: () => {
    set({ 
      replySuggestions: [], 
      typingSuggestions: [],
      analysis: null,
    });
  },

  toggleAI: () => {
    const newState = !get().isAIEnabled;
    set({ isAIEnabled: newState });
    if (!newState) {
      get().clearSuggestions();
    }
    toast.success(`AI ${newState ? 'enabled ✨' : 'disabled'}`, {
      icon: newState ? '🤖' : '🚫',
    });
  },

  setSelectedTone: (tone) => {
    console.log('🎨 Tone changed to:', tone);
    set({ selectedTone: tone });
    toast.success(`Conversation tone: ${tone}`, {
      icon: '🎭',
      duration: 2000,
    });
  },

  setConversationContext: (context) => {
    console.log('📝 Conversation context updated');
    set({ conversationContext: context });
  },

  clearChatbotMessages: () => {
    set({ chatbotMessages: [] });
  },
}));