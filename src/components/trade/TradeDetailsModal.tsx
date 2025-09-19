import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, TrendingDown, AlertTriangle, CheckSquare, Brain, BookOpen, Edit2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Trade } from '@/lib/trades';

interface TradeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade;
  onTradeUpdate: (updatedTrade: Trade) => void;
}

interface AnalysisData {
  narrative?: string;
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

export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
  isOpen,
  onClose,
  trade,
  onTradeUpdate,
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [chartImage, setChartImage] = useState<string | null>(null);
  
  // Edit form state
  const [editOutcome, setEditOutcome] = useState<'unknown' | 'win' | 'loss'>(trade.outcome);
  const [editRR, setEditRR] = useState(trade.rr_numeric?.toString() || '');
  const [editNotes, setEditNotes] = useState(trade.notes || '');

  useEffect(() => {
    if (isOpen && trade) {
      setIsLoadingChart(true);
      loadTradeDetails();
      setEditOutcome(trade.outcome);
      setEditRR(trade.rr_numeric?.toString() || '');
      setEditNotes(trade.notes || '');
    }
  }, [isOpen, trade]);

  const loadTradeDetails = async () => {
    try {
      let foundChartImage: string | null = null;
      
      // Load analysis data if message_id exists
      if (trade.message_id) {
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .select('text, image_url')
          .eq('id', trade.message_id)
          .single();

        if (!messageError && message) {
          // Try to parse analysis from the message
          try {
            // Analysis data might be stored in a separate field or parsed from text
            // For now, we'll use a simple approach
            setAnalysisData({
              narrative: message.text || 'No analysis available'
            });
          } catch (e) {
            setAnalysisData({
              narrative: message.text || 'No analysis available'
            });
          }
          
          if (message.image_url) {
            // Generate signed URL if it's a file path
            if (message.image_url.startsWith('charts/')) {
              const { data: signedUrlData } = await supabase.storage
                .from('charts')
                .createSignedUrl(message.image_url.replace('charts/', ''), 60 * 60 * 24);
              foundChartImage = signedUrlData?.signedUrl || message.image_url;
            } else {
              foundChartImage = message.image_url;
            }
          }
        }
      }

      // If we still don't have a chart and have a conversation_id, try to find any user message with image
      if (!foundChartImage && trade.conversation_id) {
        const { data: userMessages, error } = await supabase
          .from('messages')
          .select('image_url, created_at')
          .eq('conversation_id', trade.conversation_id)
          .eq('role', 'user')
          .not('image_url', 'is', null)
          .order('created_at', { ascending: false });

        if (!error && userMessages && userMessages.length > 0) {
          // Use the most recent user message with an image
          const imageUrl = userMessages[0].image_url;
          if (imageUrl && imageUrl.startsWith('charts/')) {
            const { data: signedUrlData } = await supabase.storage
              .from('charts')
              .createSignedUrl(imageUrl.replace('charts/', ''), 60 * 60 * 24);
            foundChartImage = signedUrlData?.signedUrl || imageUrl;
          } else {
            foundChartImage = imageUrl;
          }
        }
      }

      // If we still don't have a chart, try to find any message in the conversation with an image
      if (!foundChartImage && trade.conversation_id) {
        const { data: anyMessages, error } = await supabase
          .from('messages')
          .select('image_url, created_at')
          .eq('conversation_id', trade.conversation_id)
          .not('image_url', 'is', null)
          .order('created_at', { ascending: false });

        if (!error && anyMessages && anyMessages.length > 0) {
          // Use the most recent message with an image
          const imageUrl = anyMessages[0].image_url;
          if (imageUrl && imageUrl.startsWith('charts/')) {
            const { data: signedUrlData } = await supabase.storage
              .from('charts')
              .createSignedUrl(imageUrl.replace('charts/', ''), 60 * 60 * 24);
            foundChartImage = signedUrlData?.signedUrl || imageUrl;
          } else {
            foundChartImage = imageUrl;
          }
        }
      }

      setChartImage(foundChartImage);
    } catch (error) {
      console.error('Error loading trade details:', error);
    } finally {
      setIsLoadingChart(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      const updates: any = {
        outcome: editOutcome,
        notes: editNotes || null,
        rr_numeric: editRR ? parseFloat(editRR) : null,
      };

      const { data, error } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', trade.id)
        .select()
        .single();

      if (error) throw error;

      onTradeUpdate(data);
      setIsEditing(false);
      toast({
        title: "Trade Updated",
        description: "Trade details have been saved successfully",
      });
    } catch (error) {
      console.error('Error updating trade:', error);
      toast({
        title: "Error",
        description: "Failed to update trade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {trade.instrument} {trade.direction.toUpperCase()} - Trade Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trade Summary */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Trade Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Instrument</span>
                <div className="font-medium">{trade.instrument}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Direction</span>
                <div className={`font-medium flex items-center gap-1 ${
                  trade.direction === 'long' ? 'text-success' : 'text-danger'
                }`}>
                  {trade.direction === 'long' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {trade.direction.toUpperCase()}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Select value={editOutcome} onValueChange={(value) => setEditOutcome(value as any)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Pending</SelectItem>
                        <SelectItem value="win">Win</SelectItem>
                        <SelectItem value="loss">Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={
                      trade.outcome === 'win' ? 'default' :
                      trade.outcome === 'loss' ? 'destructive' : 'secondary'
                    }>
                      {trade.outcome === 'unknown' ? 'PENDING' : trade.outcome.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">R:R Ratio</span>
                <div>
                  {isEditing ? (
                    <Input
                      value={editRR}
                      onChange={(e) => setEditRR(e.target.value)}
                      placeholder="e.g., 2.5"
                      type="number"
                      step="0.1"
                      className="h-8"
                    />
                  ) : (
                    <span className="font-medium">
                      {trade.rr_numeric ? `1:${trade.rr_numeric.toFixed(1)}` : 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2">{formatDate(trade.created_at)}</span>
            </div>
          </Card>

          {/* Chart Image */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Chart</h3>
            {isLoadingChart ? (
              <div className="w-full max-w-2xl mx-auto p-8 text-center">
                <div className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded"></div>
                  <div className="text-sm text-gray-500 mt-2">Loading chart...</div>
                </div>
              </div>
            ) : chartImage ? (
              <img
                src={chartImage}
                alt="Trading chart"
                className="w-full max-w-2xl mx-auto rounded border"
                onError={(e) => {
                  console.error('Failed to load chart image:', chartImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full max-w-2xl mx-auto p-8 border-2 border-dashed border-gray-300 rounded text-center text-gray-500">
                <div className="text-lg mb-2">📈</div>
                <div className="text-sm">
                  {trade.conversation_id ? 'Chart not found for this trade' : 'No chart available'}
                </div>
                {trade.conversation_id && (
                  <div className="text-xs mt-1 text-gray-400">
                    This trade may not have had a chart uploaded
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Entry Plan */}
          {trade.entry_plan && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Entry Plan</h3>
              <p className="text-sm whitespace-pre-wrap">{trade.entry_plan}</p>
            </Card>
          )}

          {/* Analysis Cards */}
          {analysisData && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">AI Analysis</h3>
              <div className="space-y-4">
                {analysisData.narrative && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {analysisData.narrative}
                    </p>
                  </div>
                )}

                {/* Analysis sections would go here if available */}
                {analysisData.confluences && analysisData.confluences.length > 0 && (
                  <Card className="p-3 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <h4 className="font-medium text-green-800">Positive Signals</h4>
                    </div>
                    <ul className="space-y-1">
                      {analysisData.confluences.map((item, idx) => (
                        <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            </Card>
          )}

          {/* Timeframes & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trade.timeframes && trade.timeframes.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Timeframes</h3>
                <div className="flex flex-wrap gap-2">
                  {trade.timeframes.map((tf) => (
                    <Badge key={tf} variant="outline">{tf}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {trade.tags && trade.tags.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {trade.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Notes */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Notes</h3>
            {isEditing ? (
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes about this trade..."
                rows={4}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {trade.notes || 'No notes added'}
              </p>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
