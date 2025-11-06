import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Brain, MessageSquare, TrendingUp, X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIStore } from "@/stores/useAIStore";

interface AIAnalysisProps {
  selectedUserId: string;
  userName: string;
  isVisible: boolean;
  onClose: () => void;
}

export const AIAnalysis = ({ selectedUserId, userName, isVisible, onClose }: AIAnalysisProps) => {
  const { analysis, isLoadingAnalysis, analyzeConversation } = useAIStore();
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleAnalyze = async () => {
    if (!hasLoaded) {
      await analyzeConversation(selectedUserId);
      setHasLoaded(true);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone?.toLowerCase()) {
      case 'casual': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'formal': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'friendly': return 'text-green-600 bg-green-50 border-green-200';
      case 'professional': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <Card className="bg-card/95 backdrop-blur-lg border border-purple-200/20 shadow-2xl">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Conversation Analysis</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      AI insights for conversation with {userName}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="p-6 space-y-6">
                  {!hasLoaded && !isLoadingAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Analyze Your Conversation
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Get AI-powered insights about sentiment, tone, and conversation patterns
                      </p>
                      <Button onClick={handleAnalyze} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90">
                        <Brain className="h-4 w-4 mr-2" />
                        Start Analysis
                      </Button>
                    </motion.div>
                  )}

                  {isLoadingAnalysis && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Analyzing Conversation...
                      </h3>
                      <p className="text-muted-foreground">
                        AI is processing your messages and generating insights
                      </p>
                    </motion.div>
                  )}

                  {analysis && !isLoadingAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Sentiment & Tone */}
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Sentiment</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getSentimentColor(analysis.sentiment)} font-medium`}
                          >
                            {analysis.sentiment}
                          </Badge>
                        </Card>

                        <Card className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Tone</span>
                          </div>
                          <Badge 
                            variant="outline"
                            className={`${getToneColor(analysis.tone)} font-medium`}
                          >
                            {analysis.tone}
                          </Badge>
                        </Card>
                      </div>

                      {/* Topics */}
                      {analysis.topics && analysis.topics.length > 0 && (
                        <Card className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="h-4 w-4 text-indigo-500" />
                            <span className="text-sm font-medium">Key Topics</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {analysis.topics.map((topic, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                  {topic}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Suggestions */}
                      {analysis.suggestions && analysis.suggestions.length > 0 && (
                        <Card className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">AI Suggestions</span>
                          </div>
                          <div className="space-y-2">
                            {analysis.suggestions.map((suggestion, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                              >
                                <p className="text-sm text-yellow-800">{suggestion}</p>
                              </motion.div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};