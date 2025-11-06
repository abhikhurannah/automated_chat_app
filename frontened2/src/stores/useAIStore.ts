import { create } from "zustand";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface AISuggestion {
  suggestion: string;
  confidence: number;
}

interface AIAnalysis {
  sentiment: string;
  tone: string;
  topics: string[];
  suggestions: string[];
}

interface AIState {
  replySuggestions: AISuggestion[];
  typingSuggestions: string[];
  isLoadingSuggestions: boolean;
  isLoadingTyping: boolean;
  isLoadingAnalysis: boolean;
  analysis: AIAnalysis | null;
  isAIEnabled: boolean;

  // Actions
  getReplySuggestions: (messageId: string, receiverId: string) => Promise<void>;
  getTypingSuggestions: (partialText: string, receiverId: string) => Promise<void>;
  analyzeConversation: (receiverId: string) => Promise<void>;
  chatWithBot: (message: string) => Promise<string>;
  clearSuggestions: () => void;
  toggleAI: () => void;
}

// Generic API request function
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}/api/chatbot${endpoint}`;
  
  console.log('🌐 API Request:', { url, options });
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  const response = await fetch(url, config);
  
  console.log('📡 API Response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'AI request failed' }));
    console.error('❌ API Error:', errorData);
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('✅ API Success:', data);
  return data;
}

export const useAIStore = create<AIState>((set, get) => ({
  replySuggestions: [],
  typingSuggestions: [],
  isLoadingSuggestions: false,
  isLoadingTyping: false,
  isLoadingAnalysis: false,
  analysis: null,
  isAIEnabled: true,

  getReplySuggestions: async (messageId, receiverId) => {
    if (!get().isAIEnabled) return;
    
    console.log('🤖 Getting reply suggestions...', { messageId, receiverId });
    set({ isLoadingSuggestions: true });
    try {
      const response = await apiRequest<{ suggestions: AISuggestion[] }>('/suggestions/reply', {
        method: 'POST',
        body: JSON.stringify({
          messageId,
          receiverId,
        }),
      });
      console.log('✅ Reply suggestions received:', response);
      set({ replySuggestions: response.suggestions });
    } catch (error) {
      console.error("❌ Error getting reply suggestions:", error);
      // Don't show error toast for AI failures to avoid spam
      set({ replySuggestions: [] });
    } finally {
      set({ isLoadingSuggestions: false });
    }
  },

  getTypingSuggestions: async (partialText, receiverId) => {
    if (!get().isAIEnabled || partialText.length < 2) {
      set({ typingSuggestions: [] });
      return;
    }
    
    set({ isLoadingTyping: true });
    try {
      const response = await apiRequest<{ suggestions: any[] }>('/suggestions/typing', {
        method: 'POST',
        body: JSON.stringify({
          partialText,
          receiverId,
        }),
      });
      // Extract suggestion text from the response
      const suggestionTexts = response.suggestions.map(s => 
        typeof s === 'string' ? s : s.suggestion || s.text || s
      );
      set({ typingSuggestions: suggestionTexts });
    } catch (error) {
      console.error("Error getting typing suggestions:", error);
      set({ typingSuggestions: [] });
    } finally {
      set({ isLoadingTyping: false });
    }
  },

  analyzeConversation: async (receiverId) => {
    if (!get().isAIEnabled) return;
    
    set({ isLoadingAnalysis: true });
    try {
      const response = await apiRequest<AIAnalysis>(`/analyze/${receiverId}`);
      set({ analysis: response });
    } catch (error) {
      console.error("Error analyzing conversation:", error);
      toast.error("Failed to analyze conversation");
    } finally {
      set({ isLoadingAnalysis: false });
    }
  },

  chatWithBot: async (message) => {
    if (!get().isAIEnabled) throw new Error("AI is disabled");
    
    try {
      const response = await apiRequest<{ response: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      return response.response;
    } catch (error) {
      console.error("Error chatting with bot:", error);
      throw new Error("Failed to get AI response");
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
    toast.success(`AI ${newState ? 'enabled' : 'disabled'}`);
  },
}));