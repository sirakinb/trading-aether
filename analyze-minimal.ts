import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('Analyze function called - minimal version');

    const { imageUrls, contextText, conversationId, requestAnalysis, useMemory } = await req.json();

    console.log('Request data:', { 
      hasImages: !!imageUrls?.length, 
      hasContext: !!contextText,
      requestAnalysis,
      useMemory
    });

    // Check OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Simple system prompt that FORCES memory_hint
    const systemPrompt = `You are a trading coach. Always respond with valid JSON in this exact format:
{
  "narrative": "Your trading advice here",
  "memory_hint": "Always include this field - write a trading insight or use null"
}

CRITICAL: You MUST include both narrative and memory_hint fields. Never omit memory_hint.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: contextText || "Analyze this trading setup" }
    ];

    console.log('Calling OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
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
        narrative: "I'm having trouble with JSON formatting. Please try again.",
        memory_hint: "User experienced JSON parsing issues"
      };
    }

    // Force memory_hint to exist
    if (!feedback.memory_hint) {
      feedback.memory_hint = "No specific trading insight from this interaction";
    }

    console.log('Final feedback:', JSON.stringify(feedback, null, 2));

    return new Response(JSON.stringify({ feedback }), {
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
