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
    const { imageUrls, contextText, conversationId, requestAnalysis, useMemory } = await req.json();

    console.log('Analyze request received:', { 
      hasImages: !!imageUrls?.length, 
      hasContext: !!contextText,
      imageCount: imageUrls?.length || 0
    });

    if (!imageUrls?.length && !contextText) {
      throw new Error('Either imageUrls or contextText must be provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get user memories if enabled
    let memories: string[] = [];
    if (useMemory && conversationId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: memoriesData, error: memoriesError } = await supabase
          .from('memories')
          .select('kind, content')
          .order('created_at', { ascending: false })
          .limit(10);

        if (memoriesError) {
          console.log('Error fetching memories:', memoriesError);
        } else if (memoriesData) {
          memories = memoriesData.map(m => `(${m.kind}) ${m.content}`);
        }
      } catch (error) {
        console.log('Memory fetch failed:', error);
        // Continue without memories if fetch fails
      }
    }

    // Determine model based on presence of images
    const hasImages = imageUrls?.length > 0;
    // Use GPT-4.1 for both text and vision for now to avoid potential GPT-5 issues
    const model = 'gpt-4.1-2025-04-14';
    
    console.log(`Using model: ${model} (${hasImages ? 'vision' : 'text-only'})`);

    // Build messages array
    const messages: any[] = [
      { role: "system", content: buildSystemPrompt(memories, requestAnalysis) },
    ];

    // Add context text if provided
    if (contextText) {
      messages.push({ role: "user", content: contextText });
    }

    // Add images if provided
    if (imageUrls?.length) {
      for (const imageUrl of imageUrls) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: "Attached image for analysis:" },
            { 
              type: "image_url", 
              image_url: { 
                url: imageUrl,
                detail: "high"
              }
            },
          ],
        });
      }
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
        max_completion_tokens: 2000,
        temperature: 0.6, // Always include temperature for GPT-4.1
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const rawContent = data.choices[0].message?.content ?? "";
    
    let feedback: any;
    try {
      feedback = JSON.parse(rawContent);
    } catch (parseError) {
      console.warn('Failed to parse JSON response, using fallback structure');
      // Fallback if model replies conversationally instead of JSON
      feedback = {
        narrative: rawContent,
        confluences: [],
        risks: [],
        scenarios: { bull: "", bear: "", invalidation: "" },
        checklist: [],
      };
    }

    // Don't add disclaimer anymore - removed per user request
    
    // Ensure we have at least a narrative response
    if (!feedback.narrative) {
      feedback.narrative = rawContent;
    }

    const latency_ms = Date.now() - start;
    console.log(`Analysis completed in ${latency_ms}ms`);

    return new Response(JSON.stringify({ feedback, latency_ms }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze function:', error);
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