import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  isRecording: boolean;
  isTranscribing: boolean;
  duration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  className?: string;
}

export function VoiceRecorder({
  isRecording,
  isTranscribing,
  duration,
  onStartRecording,
  onStopRecording,
  className
}: VoiceRecorderProps) {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        size="icon"
        variant={isRecording ? "destructive" : "outline"}
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={isTranscribing}
        className={cn(
          "h-10 w-10 rounded-full transition-all duration-200",
          isRecording && "animate-pulse shadow-lg shadow-destructive/25"
        )}
      >
        {isTranscribing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="font-mono">{formatDuration(duration)}</span>
        </div>
      )}
      
      {isTranscribing && (
        <span className="text-sm text-muted-foreground animate-pulse">
          Transcribing...
        </span>
      )}
    </div>
  );
}