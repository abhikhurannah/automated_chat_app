import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Image, X, Smile, Bot, Sparkles, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useAIStore } from "@/stores/useAIStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { AISuggestions } from "./AISuggestions";
import { TypingSuggestions } from "./TypingSuggestions";
import { ChatbotDialog } from "./ChatbotDialog";
import toast from "react-hot-toast";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

interface User {
  _id: string;
  fullname: string;
  email: string;
  profilePic?: string;
}

interface MessageInputProps {
  selectedUser: User;
}

export const MessageInput = ({ selectedUser }: MessageInputProps) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, messages } = useChatStore();
  const { authUser } = useAuthStore();
  const { 
    getReplySuggestions, 
    getTypingSuggestions, 
    typingSuggestions, 
    isAIEnabled,
    clearSuggestions,
    setConversationContext,
    selectedTone 
  } = useAIStore();

  // Build conversation context from recent messages
  const buildConversationContext = useCallback(() => {
    const recentMessages = messages.slice(-10).map(msg => ({
      text: msg.text || '[Image]',
      senderId: msg.senderId,
      timestamp: msg.createdAt
    }));

    // Determine relationship based on message patterns
    const messageCount = messages.length;
    const userMessages = messages.filter(m => m.senderId === authUser?._id).length;
    const responsiveness = messageCount > 0 ? userMessages / messageCount : 0;

    let relationship = 'neutral';
    if (messageCount > 50) relationship = 'close';
    else if (messageCount > 20) relationship = 'familiar';
    else if (messageCount > 5) relationship = 'acquaintance';

    // Extract topics from messages
    const allText = messages.map(m => m.text).join(' ').toLowerCase();
    const topics: string[] = [];
    const topicKeywords = {
      work: ['work', 'job', 'office', 'project', 'meeting'],
      personal: ['family', 'friend', 'home', 'weekend'],
      tech: ['code', 'programming', 'software', 'app'],
      entertainment: ['movie', 'music', 'game', 'show']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => allText.includes(keyword))) {
        topics.push(topic);
      }
    });

    return {
      messages: recentMessages,
      userRelationship: relationship,
      previousTopics: topics
    };
  }, [messages, authUser]);

  // Update conversation context when messages change
  useEffect(() => {
    if (messages.length > 0 && isAIEnabled) {
      const context = buildConversationContext();
      setConversationContext(context);
    }
  }, [messages, isAIEnabled, buildConversationContext, setConversationContext]);

  // Debounced typing suggestions with context
  const debouncedGetTypingSuggestions = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (currentText: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (currentText.length >= 2 && isAIEnabled) {
            const context = buildConversationContext();
            getTypingSuggestions(currentText, selectedUser._id, context);
          }
        }, 300);
      };
    })(),
    [getTypingSuggestions, selectedUser._id, isAIEnabled, buildConversationContext]
  );

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Handle text changes and trigger typing suggestions
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    debouncedGetTypingSuggestions(newText);
  };

  // Get AI reply suggestions with full context
  const handleGetReplySuggestions = async () => {
    console.log('🎯 Getting context-aware reply suggestions');
    console.log('AI Enabled:', isAIEnabled);
    console.log('Selected User:', selectedUser);
    console.log('Messages:', messages.length);
    console.log('Selected Tone:', selectedTone);
    
    if (!isAIEnabled) {
      toast.error("AI is disabled. Enable it from the navbar.");
      return;
    }

    if (messages.length === 0) {
      toast.error("No messages yet. Send a message first!");
      return;
    }

    try {
      // Use the last message as context
      const lastMessage = messages[messages.length - 1];
      const messageId = lastMessage?._id || 'latest';
      const context = buildConversationContext();
      
      console.log('🚀 Calling getReplySuggestions with context:', { 
        messageId, 
        receiverId: selectedUser._id,
        tone: selectedTone,
        contextMessages: context.messages.length,
        relationship: context.userRelationship
      });
      
      await getReplySuggestions(messageId, selectedUser._id, context);
      setShowAISuggestions(true);
      
      console.log('✅ Reply suggestions loaded');
    } catch (error) {
      console.error('❌ Error in handleGetReplySuggestions:', error);
      toast.error('Failed to get AI suggestions');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select an image file");
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion);
    setShowAISuggestions(false);
    clearSuggestions();
    inputRef.current?.focus();
  };

  const handleTypingSuggestionClick = (suggestion: string) => {
    setText(suggestion);
    clearSuggestions();
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim() || undefined,
        image: imagePreview || undefined,
      });

      setText("");
      setImagePreview(null);
      setShowEmojiPicker(false);
      setShowAISuggestions(false);
      clearSuggestions();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="space-y-3 relative px-2 sm:px-0">
      {/* AI Reply Suggestions */}
      <AISuggestions
        onSuggestionClick={handleSuggestionClick}
        onClose={() => setShowAISuggestions(false)}
        isVisible={showAISuggestions}
      />

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            ref={emojiPickerRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-20 mb-2 left-1 z-50"
          >
            <div className="backdrop-blur-xl bg-card/95 border border-border rounded-xl shadow-2xl overflow-hidden">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={250}
                height={250}
                theme={(document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT)}
                searchPlaceHolder="Search emoji..."
                previewConfig={{ showPreview: false }}
                skinTonesDisabled={false}
                lazyLoadEmojis={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative inline-block"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={imagePreview}
              alt="Preview"
              className="h-20 rounded-lg border-2 border-primary object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1 shadow-lg transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Form */}
      <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-0">
        {/* Input Row - Full width on mobile, with buttons on desktop */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full">
          {/* Desktop: Show all buttons before input */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Chatbot Button */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setShowChatbot(true)}
              disabled={!isAIEnabled}
              className={`h-10 w-10 flex-shrink-0 transition-all ${
                isAIEnabled 
                  ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110' 
                  : 'text-muted-foreground opacity-50 cursor-not-allowed'
              }`}
              title={isAIEnabled ? "Chat with AI Assistant" : "AI is disabled"}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>

            {/* AI Suggestions Button */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleGetReplySuggestions}
              disabled={!isAIEnabled || messages.length === 0}
              className={`h-10 w-10 flex-shrink-0 transition-all relative ${
                isAIEnabled && messages.length > 0
                  ? 'text-purple-500 hover:text-purple-600 hover:bg-purple-50 hover:scale-110' 
                  : 'text-muted-foreground opacity-50 cursor-not-allowed'
              }`}
              title={
                !isAIEnabled 
                  ? "AI is disabled" 
                  : messages.length === 0 
                    ? "Send a message first" 
                    : `Get ${selectedTone} reply suggestions`
              }
            >
              <Bot className="h-5 w-5" />
              {isAIEnabled && messages.length > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"
                />
              )}
            </Button>

            {/* Smart Suggestions Button with Tone Badge */}
            <div className="relative">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleGetReplySuggestions}
                disabled={!isAIEnabled || messages.length === 0}
                className={`h-10 w-10 flex-shrink-0 transition-all ${
                  isAIEnabled && messages.length > 0
                    ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110' 
                    : 'text-muted-foreground opacity-50 cursor-not-allowed'
                }`}
                title={`Smart suggestions (${selectedTone})`}
              >
                <Sparkles className="h-5 w-5" />
              </Button>
              {isAIEnabled && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[8px] font-bold text-purple-500 uppercase">
                  {selectedTone.slice(0, 3)}
                </span>
              )}
            </div>

            {/* Image Upload */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-foreground"
              title="Upload image"
            >
              <Image className="h-5 w-5" />
            </Button>

            {/* Emoji Picker Button */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`h-10 w-10 flex-shrink-0 transition-all ${
                showEmojiPicker 
                  ? 'text-primary bg-primary/10 scale-110' 
                  : 'text-muted-foreground hover:text-foreground hover:scale-110'
              }`}
              title="Add emoji"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>

          {/* Text Input - Full width on mobile */}
          <div className="flex-1 relative min-w-0">
            <Input
              ref={inputRef}
              type="text"
              placeholder={`Message ${selectedUser.fullname}...`}
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="h-10 w-full bg-muted/30 border-border rounded-full px-4 pr-12 text-sm sm:text-base"
            />
            
            {/* Typing Suggestions */}
            <TypingSuggestions
              suggestions={typingSuggestions}
              onSuggestionClick={handleTypingSuggestionClick}
              isVisible={typingSuggestions.length > 0 && text.length >= 2}
            />
          </div>

          {/* Send Button - Always visible */}
          <Button 
            type="submit" 
            size="icon"
            disabled={!text.trim() && !imagePreview}
            className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-primary to-secondary hover:opacity-90 rounded-full disabled:opacity-40 transition-opacity"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile: Show buttons below input */}
        <div className="flex sm:hidden items-center justify-center gap-3 pt-1">
          {/* Chatbot Button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setShowChatbot(true)}
            disabled={!isAIEnabled}
            className={`h-9 w-9 flex-shrink-0 transition-all ${
              isAIEnabled 
                ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110' 
                : 'text-muted-foreground opacity-50 cursor-not-allowed'
            }`}
            title={isAIEnabled ? "Chat with AI Assistant" : "AI is disabled"}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>

          {/* AI Suggestions Button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleGetReplySuggestions}
            disabled={!isAIEnabled || messages.length === 0}
            className={`h-9 w-9 flex-shrink-0 transition-all relative ${
              isAIEnabled && messages.length > 0
                ? 'text-purple-500 hover:text-purple-600 hover:bg-purple-50 hover:scale-110' 
                : 'text-muted-foreground opacity-50 cursor-not-allowed'
            }`}
            title={
              !isAIEnabled 
                ? "AI is disabled" 
                : messages.length === 0 
                  ? "Send a message first" 
                  : `Get ${selectedTone} reply suggestions`
            }
          >
            <Sparkles className="h-5 w-5" />
            {isAIEnabled && messages.length > 0 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"
              />
            )}
          </Button>

          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground"
            title="Upload image"
          >
            <Image className="h-5 w-5" />
          </Button>

          {/* Emoji Picker Button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`h-9 w-9 flex-shrink-0 transition-all ${
              showEmojiPicker 
                ? 'text-primary bg-primary/10 scale-110' 
                : 'text-muted-foreground hover:text-foreground hover:scale-110'
            }`}
            title="Add emoji"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>
      </form>

      {/* Chatbot Dialog */}
      <ChatbotDialog 
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
      />
    </div>
  );
};