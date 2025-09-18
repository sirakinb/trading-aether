import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const start = Date.now();
    console.log('Analyze function called - improved version');

    const { imageUrls, contextText, conversationId, requestAnalysis, useMemory } = await req.json();

    console.log('Request data:', { 
      hasImages: !!imageUrls?.length, 
      hasContext: !!contextText,
      requestAnalysis,
      useMemory,
      conversationId
    });

    // Check OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Load user settings and memories
    let userSettings: any = null;
    let memories: string[] = [];
    
    if (conversationId && useMemory) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Loading user data for conversation:', conversationId);

        // Get conversation to find user_id
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('user_id')
          .eq('id', conversationId)
          .single();

        if (!convError && conversation) {
          console.log('Found user_id:', conversation.user_id);

          // Load user settings
          const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', conversation.user_id)
            .single();

          if (!settingsError && settings) {
            userSettings = settings;
            console.log('Loaded user settings:', {
              experience: settings.trading_experience,
              style: settings.trading_style,
              remember_patterns: settings.remember_patterns
            });
          }

          // Load memories if enabled
          if (userSettings?.remember_patterns !== false) {
            const { data: memoryData, error: memoryError } = await supabase
              .from('memories')
              .select('content')
              .eq('user_id', conversation.user_id)
              .order('created_at', { ascending: false })
              .limit(5); // Load recent memories

            if (!memoryError && memoryData) {
              memories = memoryData
                .filter(m => m.content)
                .map(m => m.content!);
              console.log('Loaded memories:', memories.length, memories);
            }
          }
        }
      } catch (error) {
        console.log('Failed to load user data:', error.message);
      }
    }

    // Build enhanced system prompt
    let systemPrompt = `You are an experienced trading coach. `;
    
    // Add user context if available
    if (userSettings) {
      systemPrompt += `You're working with a ${userSettings.trading_experience || 'intermediate'} trader who prefers ${userSettings.trading_style || 'day trading'} with ${userSettings.risk_level || 'moderate'} risk tolerance. `;
    }

    // Add memory context if available
    if (memories.length > 0) {
      systemPrompt += `\n\nWhat you remember about this trader:\n${memories.map(m => `- ${m}`).join('\n')}\n\n`;
    }

    // Different response formats based on request type
    if (requestAnalysis) {
      systemPrompt += `Provide detailed trading analysis. Always respond with valid JSON:
{
  "narrative": "Your detailed trading analysis and advice",
  "confluences": ["Positive technical signals if any"],
  "risks": ["Key risks to watch"],
  "scenarios": {"bull": "Bullish scenario", "bear": "Bearish scenario", "invalidation": "What invalidates the setup"},
  "checklist": ["Action items for the trader"],
  "psychology_hint": "Trading psychology insight if relevant",
  "memory_hint": "Key insight about this trader's style/preferences to remember - ALWAYS include this field"
}`;
    } else {
      systemPrompt += `Provide conversational trading advice. Always respond with valid JSON:
{
  "narrative": "Your conversational trading advice",
  "memory_hint": "Key insight about this trader's style/preferences to remember - ALWAYS include this field"
}`;
    }

    systemPrompt += `\n\nCRITICAL: Always include the memory_hint field. Use null if no specific insight.`;

    // Build messages
    const messages = [{ role: "system", content: systemPrompt }];

    // Add current message
    const currentMessage = contextText || "Analyze this trading setup";
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

    console.log('Calling OpenAI with model:', imageUrls?.length ? 'gpt-4o' : 'gpt-4o-mini');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageUrls?.length ? 'gpt-4o' : 'gpt-4o-mini',
        messages,
        max_tokens: requestAnalysis ? 1500 : 500,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message?.content ?? "";
    
    console.log('Raw AI response:', rawContent);
    
    let feedback;
    try {
      feedback = JSON.parse(rawContent);
      console.log('Parsed response:', JSON.stringify(feedback, null, 2));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      feedback = {
        narrative: "I'm having trouble with response formatting. Please try again.",
        memory_hint: "User experienced parsing issues with AI response"
      };
    }

    // Ensure memory_hint exists
    if (!feedback.hasOwnProperty('memory_hint')) {
      feedback.memory_hint = "No specific trading insight from this interaction";
      console.log('Added default memory_hint');
    }

    console.log('Final feedback:', JSON.stringify(feedback, null, 2));

    const latency_ms = Date.now() - start;
    console.log(`Analysis completed in ${latency_ms}ms`);

    return new Response(JSON.stringify({ feedback, latency_ms }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      feedback: {
        narrative: "Error occurred: " + error.message,
        memory_hint: "Error encountered during analysis"
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
