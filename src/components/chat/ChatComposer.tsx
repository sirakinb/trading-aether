import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Upload, 
  Mic, 
  MicOff, 
  X, 
  Image as ImageIcon,
  BarChart3 
 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { supabase } from '@/integrations/supabase/client';

interface ChatComposerProps {
  onSendMessage: (text: string, imageUrl?: string, isAnalysis?: boolean) => void;
  isLoading?: boolean;
  onFileUpload: (file: File) => Promise<string | null>;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isLoading,
  onFileUpload,
}) => {
  const [message, setMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    duration,
    error: recordingError
  } = useAudioRecorder();

  const handleSend = async (requestAnalysis = false) => {
    if (!message.trim() && !uploadedImage) return;
    
    await onSendMessage(message, uploadedImage || undefined, requestAnalysis);
    setMessage('');
    setUploadedImage(null);
  };

  const handleFileSelect = async (file: File) => {
    try {
      const imageUrl = await onFileUpload(file);
      if (imageUrl) {
        setUploadedImage(imageUrl);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      try {
        const audioUrl = await stopRecording();
        if (audioUrl) {
          // Call transcription edge function
          const { data, error } = await supabase.functions.invoke('transcribe', {
            body: { audioUrl }
          });

          if (error) {
            console.error('Transcription error:', error);
            return;
          }

          if (data?.text) {
            // Append transcript to existing message
            setMessage(prev => prev ? `${prev}\n\n${data.text}` : data.text);
          }
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    } else {
      try {
        await startRecording();
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Image preview */}
      {uploadedImage && (
        <div className="relative">
          <img 
            src={uploadedImage} 
            alt="Uploaded chart" 
            className="max-h-32 rounded border"
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setUploadedImage(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording: {formatDuration(duration)}</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`relative ${isDragOver ? 'border-primary bg-primary/5' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts, analysis, or questions..."
          rows={3}
          className="resize-none"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded">
            <div className="text-center">
              <ImageIcon className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-sm text-primary font-medium">Drop your chart here</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleVoiceRecording}
          disabled={isLoading}
          className={isRecording ? 'text-red-500 border-red-500' : ''}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>

        <div className="flex-1" />

        <Button
          variant="outline"
          onClick={() => handleSend(true)}
          disabled={isLoading || (!message.trim() && !uploadedImage)}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Analyze
        </Button>

        <Button
          onClick={() => handleSend(false)}
          disabled={isLoading || (!message.trim() && !uploadedImage)}
          className="flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </Button>
      </div>

      {recordingError && (
        <div className="text-sm text-red-500">
          Error: {recordingError}
        </div>
      )}
    </Card>
  );
};