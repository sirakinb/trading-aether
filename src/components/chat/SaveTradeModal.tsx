import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface SaveTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult;
  imageUrl?: string;
  onSave: () => void;
}

export const SaveTradeModal: React.FC<SaveTradeModalProps> = ({
  isOpen,
  onClose,
  analysis,
  imageUrl,
  onSave,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [instrument, setInstrument] = useState('');
  const [direction, setDirection] = useState<'long' | 'short' | ''>('');
  const [entryPlan, setEntryPlan] = useState('');
  const [timeframes, setTimeframes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [newTag, setNewTag] = useState('');

  // Extract data from analysis
  const summary = analysis.narrative.split('\n')[0].substring(0, 100) + '...';

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addTimeframe = (timeframe: string) => {
    if (!timeframes.includes(timeframe)) {
      setTimeframes([...timeframes, timeframe]);
    }
  };

  const removeTimeframe = (timeframe: string) => {
    setTimeframes(timeframes.filter(tf => tf !== timeframe));
  };

  const saveTrade = async (addOutcome: boolean = false) => {
    if (!instrument || !direction) {
      toast({
        title: "Missing Fields",
        description: "Please fill in instrument and direction",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tradeData = {
        user_id: user.id,
        instrument,
        direction,
        entry_plan: entryPlan || null,
        timeframes: timeframes.length > 0 ? timeframes : null,
        tags: tags.length > 0 ? tags : null,
        notes: notes || null,
        outcome: 'unknown' as const,
      };

      const { error } = await supabase
        .from('trades')
        .insert(tradeData);

      if (error) throw error;

      toast({
        title: "Trade Saved",
        description: addOutcome ? "Trade saved! You can add the outcome later." : "Trade saved successfully!",
      });

      onSave();
    } catch (error) {
      console.error('Error saving trade:', error);
      toast({
        title: "Error",
        description: "Failed to save trade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save as Trade</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chart thumbnail and summary */}
          <div className="flex gap-4 p-4 bg-muted rounded-lg">
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt="Chart" 
                className="w-16 h-16 object-cover rounded border"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {summary}
              </p>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instrument">Instrument *</Label>
              <Input
                id="instrument"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                placeholder="e.g., SPY, AAPL, NQ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Direction *</Label>
              <Select value={direction} onValueChange={(value) => setDirection(value as 'long' | 'short' | '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entryPlan">Entry Plan</Label>
            <Textarea
              id="entryPlan"
              value={entryPlan}
              onChange={(e) => setEntryPlan(e.target.value)}
              placeholder="Describe your entry strategy..."
              rows={3}
            />
          </div>

          {/* Timeframes */}
          <div className="space-y-2">
            <Label>Timeframes</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {timeframes.map((tf) => (
                <Badge key={tf} variant="secondary" className="flex items-center gap-1">
                  {tf}
                  <button onClick={() => removeTimeframe(tf)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
                <Button
                  key={tf}
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeframe(tf)}
                  disabled={timeframes.includes(tf)}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button variant="outline" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => saveTrade(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Save
            </Button>
            <Button 
              onClick={() => saveTrade(true)}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Save & Add Outcome Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};