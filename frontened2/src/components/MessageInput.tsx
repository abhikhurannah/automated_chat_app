import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Image, X, Smile, Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useAIStore } from "@/stores/useAIStore";
import { AISuggestions } from "./AISuggestions";
import { TypingSuggestions } from "./TypingSuggestions";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, messages } = useChatStore();
  const { 
    getReplySuggestions, 
    getTypingSuggestions, 
    typingSuggestions, 
    isAIEnabled,
    clearSuggestions 
  } = useAIStore();

  // Debounced typing suggestions
  const debouncedGetTypingSuggestions = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (currentText: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (currentText.length >= 2 && isAIEnabled) {
            getTypingSuggestions(currentText, selectedUser._id);
          }
        }, 300);
      };
    })(),
    [getTypingSuggestions, selectedUser._id, isAIEnabled]
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

  // Get AI reply suggestions when user starts typing
  const handleGetReplySuggestions = async () => {
    console.log('🎯 Handle get reply suggestions clicked');
    console.log('AI Enabled:', isAIEnabled);
    console.log('Selected User:', selectedUser);
    console.log('Messages:', messages);
    
    if (!isAIEnabled) {
      toast.error("AI is disabled");
      return;
    }

    try {
      // Use the last message as the messageId for context, or create a simple fallback
      const lastMessage = messages[messages.length - 1];
      const messageId = lastMessage?._id || 'latest';
      
      console.log('🚀 Calling getReplySuggestions with:', { messageId, receiverId: selectedUser._id });
      
      await getReplySuggestions(messageId, selectedUser._id);
      setShowAISuggestions(true);
      
      console.log('✅ getReplySuggestions completed');
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
    <div className="space-y-3 relative">
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
            className="absolute bottom-12 mb-2 left-0 z-50"
          >
            <div className="backdrop-blur-xl bg-card/95 border border-border rounded-xl shadow-2xl overflow-hidden">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={300}
                height={280}
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
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* AI Suggestions Button */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleGetReplySuggestions}
          disabled={!isAIEnabled}
          className={`h-10 w-10 flex-shrink-0 transition-all ${
            isAIEnabled 
              ? 'text-purple-500 hover:text-purple-600 hover:bg-purple-50 hover:scale-110' 
              : 'text-muted-foreground opacity-50 cursor-not-allowed'
          }`}
          title={isAIEnabled ? "Get AI suggestions" : "AI is disabled"}
        >
          <Bot className="h-5 w-5" />
        </Button>

        {/* Smart Suggestions Button */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleGetReplySuggestions}
          disabled={!isAIEnabled}
          className={`h-10 w-10 flex-shrink-0 transition-all ${
            isAIEnabled 
              ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110' 
              : 'text-muted-foreground opacity-50 cursor-not-allowed'
          }`}
          title={isAIEnabled ? "Smart reply suggestions" : "AI is disabled"}
        >
          <Sparkles className="h-5 w-5" />
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

        {/* Text Input */}
        <div className="flex-1 relative">
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
            className="h-10 bg-muted/30 border-border rounded-full px-4 pr-12"
          />
          
          {/* Typing Suggestions */}
          <TypingSuggestions
            suggestions={typingSuggestions}
            onSuggestionClick={handleTypingSuggestionClick}
            isVisible={typingSuggestions.length > 0 && text.length >= 2}
          />
        </div>

        {/* Send Button */}
        <Button 
          type="submit" 
          size="icon"
          disabled={!text.trim() && !imagePreview}
          className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-primary to-secondary hover:opacity-90 rounded-full disabled:opacity-40 transition-opacity"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};