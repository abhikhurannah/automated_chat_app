import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, X, Wand2, Brain, Smile, Briefcase, Heart, Users, Theater, Laugh } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAIStore, ConversationTone } from "@/stores/useAIStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AISuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

const toneOptions: Array<{ value: ConversationTone; label: string; icon: any; color: string }> = [
  { value: 'casual', label: 'Casual', icon: Smile, color: 'text-blue-500' },
  { value: 'professional', label: 'Professional', icon: Briefcase, color: 'text-purple-500' },
  { value: 'flirty', label: 'Flirty', icon: Heart, color: 'text-pink-500' },
  { value: 'friendly', label: 'Friendly', icon: Users, color: 'text-green-500' },
  { value: 'formal', label: 'Formal', icon: Theater, color: 'text-indigo-500' },
  { value: 'humorous', label: 'Humorous', icon: Laugh, color: 'text-orange-500' },
];

export const AISuggestions = ({ onSuggestionClick, onClose, isVisible }: AISuggestionsProps) => {
  const { 
    replySuggestions, 
    isLoadingSuggestions, 
    isAIEnabled,
    selectedTone,
    setSelectedTone 
  } = useAIStore();

  console.log('🎨 AISuggestions render:', { 
    isVisible, 
    isAIEnabled, 
    isLoadingSuggestions, 
    suggestionsCount: replySuggestions.length,
    suggestions: replySuggestions,
    selectedTone 
  });

  if (!isAIEnabled || !isVisible) return null;

  const getToneIcon = (tone: ConversationTone) => {
    const option = toneOptions.find(opt => opt.value === tone);
    return option ? <option.icon className={`h-3 w-3 ${option.color}`} /> : null;
  };

  const getToneColor = (tone: ConversationTone) => {
    const option = toneOptions.find(opt => opt.value === tone);
    return option?.color || 'text-gray-500';
  };

  return (
    <AnimatePresence>
      {(isLoadingSuggestions || replySuggestions.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute bottom-16 left-0 right-0 z-50"
        >
          <Card className="mx-2 p-4 bg-card/98 backdrop-blur-xl border border-purple-200/30 shadow-2xl shadow-purple-500/10">
            {/* Header with Tone Selector */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bot className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">AI Reply Suggestions</span>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Smart
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {getToneIcon(selectedTone)}
                    <span className={`text-xs ${getToneColor(selectedTone)}`}>
                      {selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)} tone
                    </span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tone Selector */}
            <div className="mb-4 p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Theater className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Conversation Tone</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {toneOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedTone === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => setSelectedTone(option.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        flex items-center justify-center gap-1.5 p-2 rounded-md text-xs font-medium
                        transition-all duration-200
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'bg-background hover:bg-muted border border-border'
                        }
                      `}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-primary-foreground' : option.color}`} />
                      <span>{option.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Loading State */}
            {isLoadingSuggestions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 py-6"
              >
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      className="w-2 h-2 bg-purple-500 rounded-full"
                    />
                  ))}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-foreground font-medium">Generating intelligent suggestions...</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Analyzing conversation context and tone
                  </div>
                </div>
              </motion.div>
            )}

            {/* Suggestions */}
            {!isLoadingSuggestions && replySuggestions.length > 0 && (
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {replySuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onSuggestionClick(suggestion.suggestion)}
                    className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/80 hover:to-muted/60 border border-transparent hover:border-purple-200/40 transition-all group relative overflow-hidden"
                  >
                    {/* Animated background on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                    />
                    
                    <div className="relative flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground group-hover:text-purple-600 transition-colors leading-relaxed">
                          {suggestion.suggestion}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <Brain className="h-3 w-3 text-purple-500" />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(suggestion.confidence * 100)}% match
                            </span>
                          </div>
                          {suggestion.tone && (
                            <div className="flex items-center gap-1">
                              {getToneIcon(suggestion.tone)}
                              <span className={`text-xs ${getToneColor(suggestion.tone)}`}>
                                {suggestion.tone}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 0 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className="flex-shrink-0"
                      >
                        <Wand2 className="h-4 w-4 text-purple-500" />
                      </motion.div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingSuggestions && replySuggestions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium text-foreground mb-1">
                  No suggestions available
                </p>
                <p className="text-xs text-muted-foreground">
                  Try sending a message to get AI-powered reply suggestions
                </p>
              </motion.div>
            )}

            {/* Footer tip */}
            {replySuggestions.length > 0 && !isLoadingSuggestions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-3 pt-3 border-t border-border"
              >
                <p className="text-xs text-muted-foreground text-center">
                  💡 Tip: Change the tone above for different suggestion styles
                </p>
              </motion.div>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};