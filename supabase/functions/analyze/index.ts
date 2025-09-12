import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const buildSystemPrompt = (memories?: string[], requestAnalysis?: boolean) => {
  if (requestAnalysis) {
    // Full analysis mode with structured response
    let prompt = `You are an experienced trading coach and mentor. Respond in a natural, conversational way like you're chatting with a fellow trader over coffee.

The user may share screenshots, stats, notes, news, or free-form thoughts. Treat every message as part of an ongoing conversation.

Your role: act like a seasoned mentor who's been in the markets for years. Be direct, honest, and supportive. Share insights, point out risks, and discuss scenarios naturally. Add coaching notes about psychology or performance when it feels right.

Never promise profit or certainty. If unclear, ask for clarification.`;

    if (memories && memories.length > 0) {
      prompt += `\n\nWhat I know about your trading style:\n${memories.map(m => `- ${m}`).join('\n')}`;
    }

    prompt += `\n\nProvide both a natural conversational response AND structured analysis. Respond with a JSON object:
{
  "narrative": "Main conversational feedback (always required)",
  "confluences": ["Technical confluences or positive signals if any"] (optional),
  "risks": ["Key risks or concerns to watch"] (optional),
  "scenarios": {
    "bull": "Bullish scenario description",
    "bear": "Bearish scenario description", 
    "invalidation": "What would invalidate the current setup"
  } (optional),
  "checklist": ["3-5 actionable next steps"] (optional),
  "psychology_hint": "Optional mindset or psychology coaching note",
  "memory_hint": "Optional note about patterns or style observations"
}`;
  } else {
    // Quick chat mode - conversational only
    let prompt = `You are an experienced trading coach and mentor. Respond in a natural, conversational way like you're chatting with a fellow trader.

Be direct, friendly, and supportive. Keep responses concise but helpful. Share quick insights or ask follow-up questions. Act like you're having a casual conversation about trading.

Never promise profit or certainty.`;

    if (memories && memories.length > 0) {
      prompt += `\n\nWhat I know about your trading style:\n${memories.map(m => `- ${m}`).join('\n')}`;
    }

    prompt += `\n\nRespond with a JSON object containing only:
{
  "narrative": "Natural conversational response",
  "memory_hint": "Optional note about patterns or style observations"
}`;
  }

  return prompt;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const start = Date.now();
    console.log('Analyze function called');

    const { imageUrls, contextText, conversationId, requestAnalysis, useMemory } = await req.json();

    console.log('Analyze request received:', { 
      hasImages: !!imageUrls?.length, 
      hasContext: !!contextText,
      imageCount: imageUrls?.length || 0,
      requestAnalysis,
      useMemory
    });

    if (!imageUrls?.length && !contextText) {
      throw new Error('Either imageUrls or contextText must be provided');
    }

    // Check OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('OpenAI API key found:', !!openAIApiKey);

    // Get conversation history for context
    let conversationHistory: any[] = [];
    if (conversationId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Fetching conversation history for:', conversationId);

        const { data: messages, error } = await supabase
          .from('messages')
          .select('role, text, image_url, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(10); // Get last 10 messages for context

        if (error) {
          console.log('Error fetching conversation history:', error);
        } else if (messages) {
          conversationHistory = messages;
          console.log(`Found ${messages.length} previous messages in conversation`);
        }
      } catch (error) {
        console.log('Failed to fetch conversation history:', error);
      }
    }

    // Use simple models for now
    const hasImages = imageUrls?.length > 0;
    const model = hasImages ? 'gpt-4o' : 'gpt-4o-mini';
    
    console.log(`Using model: ${model} (${hasImages ? 'vision' : 'text-only'})`);
    // Build system prompt
    const systemPrompt = requestAnalysis 
      ? `You are an experienced trading coach having an ongoing conversation with a trader. You remember the context of your previous discussions. Respond naturally and conversationally like you're continuing a chat with a fellow trader. Provide both narrative feedback AND structured analysis. Respond with a JSON object:
{
  "narrative": "Natural conversational response that references previous context when relevant",
  "confluences": ["Positive signals if any"],
  "risks": ["Key risks if any"], 
  "scenarios": {"bull": "Bullish scenario", "bear": "Bearish scenario", "invalidation": "Invalidation level"},
  "checklist": ["Action items"],
  "psychology_hint": "Mindset note"
}`
      : `You are an experienced trading coach having an ongoing conversation with a trader. You remember the context of your previous discussions. Respond naturally and conversationally like you're continuing a chat with a fellow trader. Keep it concise but reference previous context when relevant. Respond with JSON: {"narrative": "Natural conversational response"}`;

    // Build messages array starting with system prompt
    const messages = [{ role: "system", content: systemPrompt }];

    // Add conversation history for context
    if (conversationHistory.length > 0) {
      console.log('Adding conversation history to context');
      conversationHistory.forEach(msg => {
        if (msg.text) {
          messages.push({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.text
          });
        }
      });
    }

    // Add current message
    const currentMessage = contextText || "Please analyze this trading chart";
    if (imageUrls?.length) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: currentMessage },
          { 
            type: "image_url", 
            image_url: { 
              url: imageUrls[0],
              detail: "high"
            }
          }
        ]
      });
    } else {
      messages.push({ role: "user", content: currentMessage });
    }

    console.log(`Calling OpenAI with model ${model}`);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1500,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const rawContent = data.choices[0].message?.content ?? "";
    
    let feedback: any;
    try {
      feedback = JSON.parse(rawContent);
    } catch (parseError) {
      console.warn('Failed to parse JSON response, using fallback');
      feedback = {
        narrative: rawContent || "I'm having trouble processing your request right now. Please try again.",
      };
    }

    // Ensure we have at least a narrative response
    if (!feedback.narrative) {
      feedback.narrative = "I'm processing your request. Please try again.";
    }

    const latency_ms = Date.now() - start;
    console.log(`Analysis completed in ${latency_ms}ms`);

    return new Response(JSON.stringify({ feedback, latency_ms }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze function:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(JSON.stringify({ 
      error: error.message,
      feedback: {
        narrative: "I apologize, but I encountered an error while analyzing your request. Please try again or contact support if the issue persists.",
        confluences: [],
        risks: ["Technical analysis temporarily unavailable"],
        scenarios: { bull: "", bear: "", invalidation: "" },
        checklist: ["Try submitting your analysis request again"],
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});