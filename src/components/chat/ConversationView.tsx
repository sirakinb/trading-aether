import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckSquare, Brain, BookOpen } from 'lucide-react';
import { SaveTradeModal } from './SaveTradeModal';

interface AnalysisResult {
  narrative: string;
  confluences?: string[];
  risks?: string[];
  scenarios?: {
    bull?: string;
    bear?: string;
    invalidation?: string;
  };
  checklist?: string[];
  psychology_hint?: string;
  memory_hint?: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  image_url?: string;
  voice_url?: string;
  analysis?: AnalysisResult;
  created_at: string;
}

interface ConversationViewProps {
  messages: Message[];
  onSaveTrade?: (analysis: AnalysisResult, imageUrl?: string) => void;
  isLoading?: boolean;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ 
  messages, 
  onSaveTrade,
  isLoading 
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<{
    analysis: AnalysisResult;
    imageUrl?: string;
  } | null>(null);

  const handleSaveTrade = (analysis: AnalysisResult, imageUrl?: string) => {
    setSelectedAnalysis({ analysis, imageUrl });
    setShowSaveModal(true);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Start a conversation with your AI trading coach...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-4 space-y-3`}>
            {/* User message content */}
            {message.role === 'user' && (
              <div className="space-y-2">
                {message.text && <p className="text-sm">{message.text}</p>}
                {message.image_url && (
                  <img 
                    src={message.image_url} 
                    alt="Chart or trading image" 
                    className="max-w-full h-auto rounded border"
                  />
                )}
                {message.voice_url && (
                  <div className="flex items-center gap-2 text-xs opacity-75">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                    Voice message
                  </div>
                )}
              </div>
            )}

            {/* AI message content */}
            {message.role === 'ai' && (
              <div className="space-y-4">
                {/* Main narrative */}
                {message.analysis?.narrative && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.analysis.narrative}
                    </p>
                  </div>
                )}

                {/* Analysis cards - only show if analysis data exists */}
                {message.analysis && (
                  message.analysis.confluences || 
                  message.analysis.risks || 
                  message.analysis.scenarios || 
                  message.analysis.checklist || 
                  message.analysis.psychology_hint || 
                  message.analysis.memory_hint
                ) && (
                  <div className="space-y-3">
                    {/* Confluences */}
                    {message.analysis?.confluences && message.analysis.confluences.length > 0 && (
                      <Card className="p-3 bg-green-50 border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <h4 className="font-medium text-green-800">Positive Signals</h4>
                        </div>
                        <ul className="space-y-1">
                          {message.analysis.confluences.map((item, idx) => (
                            <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                              <span className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {/* Risks */}
                    {message.analysis?.risks && message.analysis.risks.length > 0 && (
                      <Card className="p-3 bg-red-50 border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <h4 className="font-medium text-red-800">Risks & Concerns</h4>
                        </div>
                        <ul className="space-y-1">
                          {message.analysis.risks.map((item, idx) => (
                            <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                              <span className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {/* Scenarios */}
                    {message.analysis?.scenarios && (
                      <Card className="p-3 bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <h4 className="font-medium text-blue-800">Market Scenarios</h4>
                        </div>
                        <div className="space-y-2">
                          {message.analysis.scenarios.bull && (
                            <div>
                              <Badge variant="outline" className="text-green-700 border-green-300 mb-1">Bull Case</Badge>
                              <p className="text-sm text-blue-700">{message.analysis.scenarios.bull}</p>
                            </div>
                          )}
                          {message.analysis.scenarios.bear && (
                            <div>
                              <Badge variant="outline" className="text-red-700 border-red-300 mb-1">Bear Case</Badge>
                              <p className="text-sm text-blue-700">{message.analysis.scenarios.bear}</p>
                            </div>
                          )}
                          {message.analysis.scenarios.invalidation && (
                            <div>
                              <Badge variant="outline" className="text-orange-700 border-orange-300 mb-1">Invalidation</Badge>
                              <p className="text-sm text-blue-700">{message.analysis.scenarios.invalidation}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Checklist */}
                    {message.analysis?.checklist && message.analysis.checklist.length > 0 && (
                      <Card className="p-3 bg-purple-50 border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckSquare className="w-4 h-4 text-purple-600" />
                          <h4 className="font-medium text-purple-800">Action Items</h4>
                        </div>
                        <ul className="space-y-1">
                          {message.analysis.checklist.map((item, idx) => (
                            <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                              <span className="w-1 h-1 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {/* Psychology hint */}
                    {message.analysis?.psychology_hint && (
                      <Card className="p-3 bg-amber-50 border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-amber-600" />
                          <h4 className="font-medium text-amber-800">Psychology Note</h4>
                        </div>
                        <p className="text-sm text-amber-700">{message.analysis.psychology_hint}</p>
                      </Card>
                    )}

                    {/* Memory hint */}
                    {message.analysis?.memory_hint && (
                      <Card className="p-3 bg-slate-50 border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-slate-600" />
                          <h4 className="font-medium text-slate-800">Pattern Observation</h4>
                        </div>
                        <p className="text-sm text-slate-700">{message.analysis.memory_hint}</p>
                      </Card>
                    )}
                  </div>
                )}

                {/* Save Trade button - only show if analysis cards are present */}
                {message.analysis && (message.analysis.confluences || message.analysis.risks || message.analysis.scenarios) && (
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSaveTrade(message.analysis!, message.image_url)}
                      className="w-full"
                    >
                      Save as Trade
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs opacity-50 mt-2">
              {new Date(message.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
      
      {/* Thinking indicator when AI is processing */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[80%] bg-muted rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                AI
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-muted-foreground">AI Coach is analyzing...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Trade Modal */}
      {showSaveModal && selectedAnalysis && (
        <SaveTradeModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          analysis={selectedAnalysis.analysis}
          imageUrl={selectedAnalysis.imageUrl}
          onSave={() => {
            setShowSaveModal(false);
            setSelectedAnalysis(null);
          }}
        />
      )}
    </div>
  );
};