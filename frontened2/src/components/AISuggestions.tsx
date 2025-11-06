import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, X, Wand2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAIStore } from "@/stores/useAIStore";

interface AISuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const AISuggestions = ({ onSuggestionClick, onClose, isVisible }: AISuggestionsProps) => {
  const { replySuggestions, isLoadingSuggestions, isAIEnabled } = useAIStore();

  console.log('🎨 AISuggestions render:', { 
    isVisible, 
    isAIEnabled, 
    isLoadingSuggestions, 
    suggestionsCount: replySuggestions.length,
    suggestions: replySuggestions 
  });

  if (!isAIEnabled || !isVisible) return null;

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
          <Card className="mx-2 p-4 bg-card/95 backdrop-blur-lg border border-purple-200/20 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">AI Reply Suggestions</span>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Smart
                </Badge>
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

            {/* Loading State */}
            {isLoadingSuggestions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 py-4"
              >
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.2, 1],
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
                <span className="text-sm text-muted-foreground">
                  Generating intelligent suggestions...
                </span>
              </motion.div>
            )}

            {/* Suggestions */}
            {!isLoadingSuggestions && replySuggestions.length > 0 && (
              <div className="space-y-2">
                {replySuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onSuggestionClick(suggestion.suggestion)}
                    className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted/80 border border-transparent hover:border-purple-200/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-foreground group-hover:text-purple-600 transition-colors">
                          {suggestion.suggestion}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Brain className="h-3 w-3 text-purple-500" />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                      <Wand2 className="h-4 w-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingSuggestions && replySuggestions.length === 0 && (
              <div className="text-center py-4">
                <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No suggestions available
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};