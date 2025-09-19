import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { SaveTradeModal } from "@/components/chat/SaveTradeModal";

interface Message {
  id: string;
  role: 'user' | 'ai';
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // State for conversation
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useMemory, setUseMemory] = useState(true);
  
  // State for save trade modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined);
  const [currentMessageId, setCurrentMessageId] = useState<string | undefined>(undefined);
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation on mount
  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Authentication Error",
          description: "Please sign in to continue",
          variant: "destructive",
        });
        return;
      }
      
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to start a conversation",
          variant: "destructive",
        });
        return;
      }

      console.log('Initializing conversation for user:', user.id);

      // Check if we have URL parameters for specific conversation/message
      const urlConversationId = searchParams.get('conversation');
      const urlMessageId = searchParams.get('message');

      if (urlConversationId) {
        // Load the specific conversation from URL
        console.log('Loading specific conversation from URL:', urlConversationId);
        setConversationId(urlConversationId);
        
        // Load messages for this specific conversation
        const { data: conversationMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', urlConversationId)
          .order('created_at', { ascending: true });

        if (!messagesError && conversationMessages) {
          // Process messages and generate signed URLs for images
          const processedMessages = await Promise.all(
            conversationMessages.map(async (msg) => {
              let processedMsg = { ...msg };
              
              console.log('Processing message:', msg.id, 'image_url:', msg.image_url);
              
              // Generate signed URL for image if it exists
              if (msg.image_url) {
                if (msg.image_url.startsWith('charts/')) {
                  // File path - generate new signed URL
                  console.log('Generating signed URL for file path:', msg.image_url);
                  const signedUrl = await getSignedUrl(msg.image_url);
                  processedMsg.image_url = signedUrl || msg.image_url;
                  console.log('Updated image_url to:', processedMsg.image_url);
                } else if (msg.image_url.includes('supabase.co/storage/v1/object/sign/')) {
                  // Already a signed URL - extract file path and generate fresh signed URL
                  const urlParts = msg.image_url.split('/');
                  const signIndex = urlParts.indexOf('sign');
                  if (signIndex !== -1 && signIndex + 1 < urlParts.length) {
                    const filePath = urlParts.slice(signIndex + 1).join('/').split('?')[0];
                    console.log('Extracting file path from signed URL:', msg.image_url, '->', filePath);
                    const freshSignedUrl = await getSignedUrl(filePath);
                    processedMsg.image_url = freshSignedUrl || msg.image_url;
                    console.log('Generated fresh signed URL:', processedMsg.image_url);
                  }
                } else {
                  console.log('Image URL format not recognized:', msg.image_url);
                }
              }
              
              return processedMsg;
            })
          );
          
          setMessages(processedMessages);
          
          // If we have a specific message ID, scroll to it after a short delay
          if (urlMessageId) {
            setTimeout(() => {
              const messageElement = document.getElementById(`message-${urlMessageId}`);
              if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight the message temporarily
                messageElement.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                setTimeout(() => {
                  messageElement.style.backgroundColor = '';
                }, 3000);
              }
            }, 500);
          }
        }
        return;
      }

      // First, try to load the most recent conversation with messages
      const { data: recentConversations, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          id, 
          title, 
          created_at,
          messages(id, role, text, image_url, created_at)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!fetchError && recentConversations && recentConversations.length > 0) {
        const recentConversation = recentConversations[0];
        console.log('Loading recent conversation:', recentConversation.id);
        
        setConversationId(recentConversation.id);
        
        // Load messages for this conversation
        const { data: conversationMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', recentConversation.id)
          .order('created_at', { ascending: true });

        if (!messagesError && conversationMessages) {
          // Process messages and generate signed URLs for images
          const processedMessages = await Promise.all(
            conversationMessages.map(async (msg) => {
              let processedMsg = {
                ...msg,
                role: msg.role as 'user' | 'ai',
                analysis: msg.role === 'ai' ? { narrative: msg.text || '' } : undefined,
              };
              
              console.log('Processing recent message:', msg.id, 'image_url:', msg.image_url);
              
              // Generate signed URL for image if it exists
              if (msg.image_url) {
                if (msg.image_url.startsWith('charts/')) {
                  // File path - generate new signed URL
                  console.log('Generating signed URL for recent message file path:', msg.image_url);
                  const signedUrl = await getSignedUrl(msg.image_url);
                  processedMsg.image_url = signedUrl || msg.image_url;
                  console.log('Updated recent message image_url to:', processedMsg.image_url);
                } else if (msg.image_url.includes('supabase.co/storage/v1/object/sign/')) {
                  // Already a signed URL - extract file path and generate fresh signed URL
                  const urlParts = msg.image_url.split('/');
                  const signIndex = urlParts.indexOf('sign');
                  if (signIndex !== -1 && signIndex + 1 < urlParts.length) {
                    const filePath = urlParts.slice(signIndex + 1).join('/').split('?')[0];
                    console.log('Extracting file path from recent message signed URL:', msg.image_url, '->', filePath);
                    const freshSignedUrl = await getSignedUrl(filePath);
                    processedMsg.image_url = freshSignedUrl || msg.image_url;
                    console.log('Generated fresh signed URL for recent message:', processedMsg.image_url);
                  }
                } else {
                  console.log('Recent message image URL format not recognized:', msg.image_url);
                }
              }
              
              return processedMsg;
            })
          );
          
          setMessages(processedMessages);
          console.log(`Loaded ${processedMessages.length} messages from recent conversation`);
        }
        return;
      }

      // If no recent conversation exists, create a new one
      console.log('Creating new conversation for user:', user.id);

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: `Chat ${new Date().toLocaleDateString()}`,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }

      console.log('New conversation created:', conversation.id);
      setConversationId(conversation.id);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: "Error",
        description: "Failed to initialize conversation. Please try refreshing the page.",
        variant: "destructive",
      });
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

  // Upload file to Supabase Storage and return file path (not signed URL)
  const uploadToCharts = async (file: File): Promise<string> => {
    // Sanitize filename: remove spaces and special characters
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    
    const fileName = `${Date.now()}_${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from('charts')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Return the file path instead of signed URL - we'll generate signed URLs when needed
    return `charts/${fileName}`;
  };

  // Helper function to generate signed URL from file path
  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    try {
      console.log('getSignedUrl called with filePath:', filePath);
      
      // Extract bucket and file name from path
      const [bucket, ...pathParts] = filePath.split('/');
      const fileName = pathParts.join('/');
      
      console.log('Extracted bucket:', bucket, 'fileName:', fileName);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(fileName, 60 * 60 * 24); // 24 hour expiry

    if (signedUrlError || !signedUrlData) {
        console.error('Failed to get signed URL:', signedUrlError);
        return null;
    }

      console.log('Generated signed URL:', signedUrlData.signedUrl);
    return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    if (!validateFile(file)) return null;

    try {
      const filePath = await uploadToCharts(file);
      
      // Generate signed URL for immediate display
      const signedUrl = await getSignedUrl(filePath);
      
      if (!signedUrl) {
        throw new Error('Failed to generate signed URL for uploaded image');
      }
      
      toast({
        title: "Image uploaded",
        description: "Your chart has been uploaded successfully",
      });
      
      // Return the signed URL for immediate display, but we'll store the file path in the database
      return signedUrl;
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

  const saveMessage = async (role: 'user' | 'ai', text?: string, imageUrl?: string, analysis?: any) => {
    if (!conversationId) {
      console.error('No conversation ID available');
      toast({
        title: "Error",
        description: "No active conversation. Please refresh the page.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication failed');
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Convert signed URL back to file path for storage if it's a signed URL
      let imagePathForStorage = imageUrl;
      if (imageUrl && imageUrl.includes('supabase.co/storage/v1/object/sign/')) {
        // Extract file path from signed URL
        const urlParts = imageUrl.split('/');
        const signIndex = urlParts.indexOf('sign');
        if (signIndex !== -1 && signIndex + 1 < urlParts.length) {
          imagePathForStorage = urlParts.slice(signIndex + 1).join('/').split('?')[0];
        }
        console.log('Converted signed URL to file path:', imageUrl, '->', imagePathForStorage);
      } else {
        console.log('Image URL is already a file path or null:', imageUrl);
      }

      const messageData: any = {
        conversation_id: conversationId,
        role,
        text: text || null,
        image_url: imagePathForStorage || null,
      };

      console.log('Saving message data:', messageData);

      const { data: message, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      const newMessage: Message = {
        ...message,
        role: message.role as 'user' | 'ai',
        analysis,
      };

      setMessages(prev => [...prev, newMessage]);
      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      
      // Show user-friendly error message
      toast({
        title: "Error saving message",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      
      // If database save fails, still add to local state so user sees the response
      if (role === 'ai' && text) {
        const tempMessage: Message = {
          id: Date.now().toString(),
          conversation_id: conversationId,
          role,
          text,
          image_url: imageUrl,
          analysis,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);
      }
      
      return null;
    }
  };

  const saveMemory = async (content: string, kind: 'preference' | 'pattern' | 'note') => {
    try {
      console.log('saveMemory called with:', { content, kind });
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error or no user for memory save:', authError);
        return;
      }

      console.log('Inserting memory for user:', user.id);
      const { data, error } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          kind,
          content,
        })
        .select();

      if (error) {
        console.error('Database error saving memory:', error);
      } else {
        console.log('Memory saved successfully:', data);
      }
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
          const aiMessage = await saveMessage('ai', analysis.narrative, undefined, analysis);

          // Extract and save memories (only if memory is enabled)
          console.log('Memory check:', { 
            memory_hint: analysis.memory_hint, 
            useMemory, 
            analysis 
          });
          if (analysis.memory_hint && analysis.memory_hint !== null && useMemory) {
            console.log('Saving memory:', analysis.memory_hint);
            await saveMemory(analysis.memory_hint, 'note');
          } else {
            console.log('Memory not saved because:', {
              hasMemoryHint: !!analysis.memory_hint,
              memoryHint: analysis.memory_hint,
              useMemory,
              reason: !analysis.memory_hint ? 'No memory hint' : !useMemory ? 'Memory disabled' : 'Unknown'
            });
          }

          // Set up data for save trade modal if this was a detailed analysis
          if (requestAnalysis && (analysis.confluences || analysis.risks || analysis.scenarios)) {
            setCurrentAnalysis(analysis);
            setCurrentImageUrl(imageUrl);
            setCurrentMessageId(aiMessage?.id);
            setShowSaveModal(true);
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

  const handleSaveTradeComplete = () => {
    setShowSaveModal(false);
    setCurrentAnalysis(null);
    setCurrentImageUrl(undefined);
    setCurrentMessageId(undefined);
    toast({
      title: "Trade saved!",
      description: "Your trade has been saved to your history",
    });
  };

  const handleSaveTradeRequest = (analysis: any, imageUrl?: string) => {
    setCurrentAnalysis(analysis);
    setCurrentImageUrl(imageUrl);
    // Find the message ID for this analysis from the messages array
    const messageWithAnalysis = messages.find(m => m.role === 'ai' && m.analysis === analysis);
    setCurrentMessageId(messageWithAnalysis?.id);
    setShowSaveModal(true);
  };

  return (
    <AppLayout title="AI Trading Coach" subtitle="Chat with your AI trading mentor">
      <div className="flex flex-col h-screen">
        {/* Header with Memory Toggle */}
        <div className="border-b bg-card">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-end">
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
            </div>
          </div>
        </div>

        {/* Conversation View */}
        <ConversationView 
          messages={messages} 
          isLoading={isLoading}
          onSaveTrade={handleSaveTradeRequest}
        />

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

        {/* Save Trade Modal */}
        {showSaveModal && currentAnalysis && (
          <SaveTradeModal
            isOpen={showSaveModal}
            onClose={() => setShowSaveModal(false)}
            analysis={currentAnalysis}
            imageUrl={currentImageUrl}
            conversationId={conversationId}
            messageId={currentMessageId}
            onSave={handleSaveTradeComplete}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Chat;