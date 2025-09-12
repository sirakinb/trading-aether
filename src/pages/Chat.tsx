import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/app-layout";
import { Upload, Mic, MicOff, Send, Plus, BarChart3, MessageSquare, Brain, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConversationView } from "@/components/chat/ConversationView";
import { ChatComposer } from "@/components/chat/ChatComposer";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  image_url?: string;
  voice_url?: string;
  conversation_id?: string;
  analysis?: {
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
  };
  created_at: string;
}

const Chat = () => {
  const { toast } = useToast();
  
  // State for conversation
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useMemory, setUseMemory] = useState(true);
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation on mount
  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create a new conversation
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: `Chat ${new Date().toLocaleDateString()}`,
        })
        .select()
        .single();

      if (error) throw error;

      setConversationId(conversation.id);
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  // Validate uploaded files
  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, WEBP, GIF)",
        variant: "destructive",
      });
      return false;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 50MB",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Upload file to Supabase Storage and get signed URL
  const uploadToCharts = async (file: File): Promise<string> => {
    // Sanitize filename: remove spaces and special characters
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    
    const fileName = `${Date.now()}_${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from('charts')
      .upload(fileName, file); // Don't add charts/ prefix - it's already in the bucket

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('charts')
      .createSignedUrl(fileName, 60 * 60 * 24);

    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to get signed URL: ${signedUrlError?.message}`);
    }

    return signedUrlData.signedUrl;
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    if (!validateFile(file)) return null;

    try {
      const imageUrl = await uploadToCharts(file);
      toast({
        title: "Image uploaded",
        description: "Your chart has been uploaded successfully",
      });
      return imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', text?: string, imageUrl?: string, analysis?: any) => {
    if (!conversationId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const messageData = {
        conversation_id: conversationId,
        role,
        text: text || null,
        image_url: imageUrl || null,
      };

      const { data: message, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      const newMessage: Message = {
        ...message,
        role: message.role as 'user' | 'assistant',
        analysis,
      };

      setMessages(prev => [...prev, newMessage]);
      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  const saveMemory = async (content: string, kind: 'preference' | 'pattern' | 'note') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          kind,
          content,
        });
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  };

  const handleSendMessage = async (text: string, imageUrl?: string, requestAnalysis = false) => {
    if (!text.trim() && !imageUrl) return;

    setIsLoading(true);
    
    try {
      // Save user message
      await saveMessage('user', text, imageUrl);

      // Call analysis function with retry logic
      let retryCount = 0;
      const maxRetries = 2;
      let lastError: any;

      while (retryCount <= maxRetries) {
        try {
          const { data, error } = await supabase.functions.invoke('analyze', {
            body: { 
              imageUrls: imageUrl ? [imageUrl] : undefined,
              contextText: text.trim() || undefined,
              conversationId,
              requestAnalysis,
              useMemory,
            }
          });

          if (error) throw error;

          const analysis = data.feedback;

          // Save AI response
          await saveMessage('assistant', analysis.narrative, undefined, analysis);

          // Extract and save memories
          if (analysis.memory_hint) {
            await saveMemory(analysis.memory_hint, 'note');
          }

          toast({
            title: "Response received",
            description: "AI coach has analyzed your message",
          });

          return; // Success, exit the function
        } catch (error) {
          lastError = error;
          retryCount++;
          
          if (retryCount <= maxRetries) {
            console.log(`Attempt ${retryCount} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          }
        }
      }

      // If we get here, all retries failed
      throw lastError;

    } catch (error) {
      console.error('Error sending message after retries:', error);
      toast({
        title: "Error", 
        description: "Failed to send message after 3 attempts. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout title="AI Trading Coach" subtitle="Chat with your AI trading mentor">
      <div className="flex flex-col h-screen">
        {/* Header with Memory Toggle */}
        <div className="border-b bg-card">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="memory-mode"
                  checked={useMemory}
                  onCheckedChange={setUseMemory}
                />
                <Label htmlFor="memory-mode" className="text-sm">
                  Use Memory
                </Label>
              </div>
              <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation View */}
        <ConversationView messages={messages} />

        {/* Chat Composer */}
        <div className="border-t p-4">
          <div className="max-w-4xl mx-auto">
            <ChatComposer
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onFileUpload={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Chat;