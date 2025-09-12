import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Mic, Send, BarChart3, Shield, Target, FileText, X, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { TradingCard, TradingCardContent, TradingCardHeader, TradingCardTitle } from "@/components/ui/trading-card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { VoiceRecorder } from "@/components/ui/voice-recorder";

const analysisOptions = [
  {
    icon: Upload,
    title: "Screenshot Analysis",
    description: "Upload charts, setups, or trade screenshots",
    action: "Upload Image"
  },
  {
    icon: Mic,
    title: "Voice Context",
    description: "Add spoken context to your analysis",
    action: "Record Voice"
  },
  {
    icon: BarChart3,
    title: "Structured Feedback",
    description: "Get organized insights and checklists",
    action: "Quick Analysis"
  },
  {
    icon: FileText,
    title: "Save as Trade",
    description: "Export analysis to your trade journal",
    action: "Save Trade"
  }
];

export default function Chat() {
  const [message, setMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState<{url: string, name: string} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audio recording hook
  const { isRecording, startRecording, stopRecording, duration, error: recordingError } = useAudioRecorder();

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please upload an image file (PNG, JPG)", variant: "destructive" });
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
      return false;
    }
    return true;
  };

  const uploadToCharts = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      
      // Sanitize filename: remove spaces, special chars, keep only alphanumeric, dots, hyphens
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_'); // Replace multiple underscores with single
      
      const fileName = `${Date.now()}_${sanitizedName}`;
      
      const { data, error } = await supabase.storage
        .from('charts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: signedUrl } = await supabase.storage
        .from('charts')
        .createSignedUrl(data.path, 3600); // 1 hour expiry

      return signedUrl?.signedUrl || null;
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;
    
    const url = await uploadToCharts(file);
    if (url) {
      setUploadedImage({ url, name: file.name });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) handleFileUpload(files[0]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) handleFileUpload(file);
    }
  }, []);

  const removeImage = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
  };

  const handleSend = async () => {
    if (!message.trim() && !uploadedImage) return;
    
    try {
      setIsAnalyzing(true);
      
      const requestBody: any = {};
      
      if (uploadedImage) {
        requestBody.imageUrls = [uploadedImage.url];
      }
      
      if (message.trim()) {
        requestBody.contextText = message.trim();
      }

      const { data, error } = await supabase.functions.invoke('analyze', {
        body: requestBody
      });

      if (error) {
        console.error('Analysis error:', error);
        toast({
          title: "Analysis Error",
          description: "Failed to analyze your content. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setAnalysisResult(data);
      console.log('Analysis result:', data);
      
      toast({
        title: "Analysis Complete",
        description: "Your trading analysis is ready!",
      });
      
    } catch (error) {
      console.error('Send error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      // Reset form
      setMessage("");
      setUploadedImage(null);
    }
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      setIsTranscribing(true);
      try {
        const audioUrl = await stopRecording();
        if (audioUrl) {
          // Call transcription edge function
          const { data, error } = await supabase.functions.invoke('transcribe', {
            body: { audioUrl }
          });

          if (error) {
            throw error;
          }

          if (data?.text) {
            // Append transcript to existing message
            setMessage(prev => prev ? `${prev}\n\n${data.text}` : data.text);
            
            toast({
              title: "Voice recorded",
              description: `Transcribed ${Math.round(data.duration_ms / 1000)}s of audio`,
            });
          } else {
            toast({
              title: "No speech detected",
              description: "Try speaking more clearly or closer to the microphone",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Transcription error:', error);
        toast({
          title: "Transcription failed",
          description: "Failed to transcribe audio. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsTranscribing(false);
      }
    } else {
      try {
        await startRecording();
      } catch (error) {
        toast({
          title: "Recording failed",
          description: "Failed to start recording. Please check microphone permissions.",
          variant: "destructive",
        });
      }
    }
  };

  // Show recording error
  if (recordingError) {
    toast({
      title: "Recording error",
      description: recordingError,
      variant: "destructive",
    });
  }

  return (
    <AppLayout 
      title="Trade Analysis Chat" 
      subtitle="Upload screenshots of your trades, charts, or analysis, and I'll provide structured feedback with actionable insights."
    >
      <div className="flex h-full flex-col">
        {/* Welcome Section */}
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Welcome Card */}
            <TradingCard variant="premium" className="mb-8">
              <TradingCardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <TradingCardTitle className="text-xl">Welcome to TradeCopilot</TradingCardTitle>
                    <p className="text-muted-foreground">
                      I'm your AI trading assistant. Upload screenshots of your trades, charts, or analysis, and I'll provide structured feedback with actionable insights.
                    </p>
                  </div>
                </div>
              </TradingCardHeader>
            </TradingCard>

            {/* Analysis Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {analysisOptions.map((option, index) => (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TradingCard className="h-full hover:shadow-glow transition-all duration-200 cursor-pointer group">
                    <TradingCardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <option.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm mb-1">{option.title}</h3>
                          <p className="text-xs text-muted-foreground mb-3">{option.description}</p>
                          <Button size="sm" variant="outline" className="text-xs">
                            {option.action}
                          </Button>
                        </div>
                      </div>
                    </TradingCardContent>
                  </TradingCard>
                </motion.div>
              ))}
            </div>

            {/* Upload Area */}
            <TradingCard 
              className={`border-dashed border-2 transition-all cursor-pointer ${
                isDragOver 
                  ? "border-primary bg-primary/5" 
                  : "border-border/50 hover:border-primary/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <TradingCardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {isUploading ? "Uploading..." : "Drop your chart here or click to upload"}
                    </h3>
                    <p className="text-muted-foreground">
                      PNG, JPG, or paste from clipboard • Max 10MB
                    </p>
                  </div>
                  <Button variant="premium" size="lg" disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Choose File"}
                  </Button>
                </div>
              </TradingCardContent>
            </TradingCard>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </motion.div>
        </div>

        {/* Chat Input Area */}
        <div className="mt-auto border-t border-border bg-background/80 backdrop-blur">
          <div className="max-w-4xl mx-auto p-6">
            {/* Analysis Status */}
            {isAnalyzing && (
              <div className="mb-4 flex items-center justify-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Analyzing your chart...</span>
              </div>
            )}

            {/* Image Preview Chip */}
            {uploadedImage && (
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 bg-muted rounded-full px-3 py-2 text-sm">
                  <img 
                    src={uploadedImage.url} 
                    alt="Uploaded chart" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="truncate max-w-[200px]">{uploadedImage.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-background"
                    onClick={removeImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  placeholder="Add context about your trade setup, timeframe, strategy..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onPaste={handlePaste}
                  className="w-full min-h-[100px] p-4 rounded-2xl bg-input border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <VoiceRecorder
                    isRecording={isRecording}
                    isTranscribing={isTranscribing}
                    duration={duration}
                    onStartRecording={handleVoiceRecording}
                    onStopRecording={handleVoiceRecording}
                  />
                </div>
              </div>
              <Button 
                variant="premium" 
                size="lg" 
                className="self-end min-w-[120px]"
                onClick={handleSend}
                disabled={(!message.trim() && !uploadedImage) || isAnalyzing}
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Analysis
                  </>
                )}
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="ghost" className="text-xs">
                📊 Analyze Chart
              </Button>
              <Button size="sm" variant="ghost" className="text-xs">
                🎯 Position Size
              </Button>
              <Button size="sm" variant="ghost" className="text-xs">
                ⚠️ Risk Check
              </Button>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto p-6"
          >
            <TradingCard className="bg-card">
              <TradingCardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Trading Analysis</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnalysisResult(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Main Narrative */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2 text-foreground">Coach Feedback</h4>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {analysisResult.feedback?.narrative}
                  </p>
                </div>

                {/* Structured Sections */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Confluences */}
                  {analysisResult.feedback?.confluences?.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-green-700 dark:text-green-400">
                        ✅ Positive Signals
                      </h4>
                      <ul className="space-y-1">
                        {analysisResult.feedback.confluences.map((item: string, index: number) => (
                          <li key={index} className="text-sm text-green-600 dark:text-green-300">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risks */}
                  {analysisResult.feedback?.risks?.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-red-700 dark:text-red-400">
                        ⚠️ Key Risks
                      </h4>
                      <ul className="space-y-1">
                        {analysisResult.feedback.risks.map((item: string, index: number) => (
                          <li key={index} className="text-sm text-red-600 dark:text-red-300">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Scenarios */}
                {(analysisResult.feedback?.scenarios?.bull || 
                  analysisResult.feedback?.scenarios?.bear || 
                  analysisResult.feedback?.scenarios?.invalidation) && (
                  <div className="mt-4 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-blue-700 dark:text-blue-400">
                      📊 Market Scenarios
                    </h4>
                    <div className="space-y-2 text-sm">
                      {analysisResult.feedback.scenarios.bull && (
                        <div>
                          <span className="font-medium text-green-600 dark:text-green-400">Bull Case: </span>
                          <span className="text-blue-600 dark:text-blue-300">{analysisResult.feedback.scenarios.bull}</span>
                        </div>
                      )}
                      {analysisResult.feedback.scenarios.bear && (
                        <div>
                          <span className="font-medium text-red-600 dark:text-red-400">Bear Case: </span>
                          <span className="text-blue-600 dark:text-blue-300">{analysisResult.feedback.scenarios.bear}</span>
                        </div>
                      )}
                      {analysisResult.feedback.scenarios.invalidation && (
                        <div>
                          <span className="font-medium text-orange-600 dark:text-orange-400">Invalidation: </span>
                          <span className="text-blue-600 dark:text-blue-300">{analysisResult.feedback.scenarios.invalidation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {analysisResult.feedback?.checklist?.length > 0 && (
                  <div className="mt-4 bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-purple-700 dark:text-purple-400">
                      📋 Action Items
                    </h4>
                    <ul className="space-y-1">
                      {analysisResult.feedback.checklist.map((item: string, index: number) => (
                        <li key={index} className="text-sm text-purple-600 dark:text-purple-300">
                          {index + 1}. {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Psychology Hint */}
                {analysisResult.feedback?.psychology_hint && (
                  <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-yellow-700 dark:text-yellow-400">
                      🧠 Psychology Note
                    </h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">
                      {analysisResult.feedback.psychology_hint}
                    </p>
                  </div>
                )}

                {/* Latency */}
                {analysisResult.latency_ms && (
                  <div className="mt-4 text-xs text-muted-foreground text-center">
                    Analysis completed in {analysisResult.latency_ms}ms
                  </div>
                )}
              </TradingCardContent>
            </TradingCard>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}