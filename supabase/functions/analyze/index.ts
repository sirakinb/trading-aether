import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an AI Trading Coach with deep expertise in charts, setups, market structure, risk, psychology, journaling, backtesting, and news impact.

The user may share screenshots, stats, notes, news, or just general thoughts. Treat every message as part of an ongoing conversation.

Your role: act like a mentor. Give thoughtful, encouraging, and honest feedback that helps the user think clearly, improve discipline, and refine decision-making.

When you respond:

Always keep a natural, conversational tone — like a coach talking to a trader.

Provide insights and observations (what stands out, what looks strong).

Point out risks and blind spots (technical, emotional, or market-related).

Offer scenarios (bull/bear paths, invalidation if applicable).

Share a checklist or next steps (3–5 actionable items).

Add optional coaching notes — psychology reminders, performance reflections, mindset nudges.

Be clear, practical, and explainable. Never promise certainty or profit. If inputs are unclear, ask for clarification.

You should respond with a JSON object containing:
{
  "narrative": "Main conversational feedback (always required)",
  "confluences": ["Technical confluences or positive signals if any"],
  "risks": ["Key risks or concerns to watch"],
  "scenarios": {
    "bull": "Bullish scenario description",
    "bear": "Bearish scenario description", 
    "invalidation": "What would invalidate the current setup"
  },
  "checklist": ["3-5 actionable next steps"],
  "psychology_hint": "Optional mindset or psychology coaching note",
  "memory_hint": "Optional note about patterns or style observations"
}

End every response with: "Educational content — Not financial advice."`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const start = Date.now();
    const { imageUrls, contextText } = await req.json();

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

    // Build messages array
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
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

    console.log('Calling OpenAI with model gpt-5-2025-08-07');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages,
        max_completion_tokens: 2000,
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
        narrative: rawContent + "\n\nEducational content — Not financial advice.",
        confluences: [],
        risks: [],
        scenarios: { bull: "", bear: "", invalidation: "" },
        checklist: [],
      };
    }

    // Ensure narrative always ends with disclaimer
    if (feedback.narrative && !feedback.narrative.includes("Educational content — Not financial advice")) {
      feedback.narrative += "\n\nEducational content — Not financial advice.";
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
        narrative: "I apologize, but I encountered an error while analyzing your request. Please try again or contact support if the issue persists.\n\nEducational content — Not financial advice.",
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