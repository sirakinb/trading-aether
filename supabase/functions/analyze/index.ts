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

    // For now, let's return a simple test response to see if the function works
    const feedback = {
      narrative: requestAnalysis 
        ? "I can see you're looking at the Micro E-mini Nasdaq-100 futures chart. The price action shows strong momentum with higher highs and higher lows since March. We're testing new territory around 24,113 which is exciting, but I'd want to see some volume confirmation on any breakout attempt. What's your take on the current setup?"
        : "Looking at this chart, I see some interesting price action. What's your thoughts on where this might be heading?",
      ...(requestAnalysis && {
        confluences: [
          "Strong uptrend structure with higher highs and lows",
          "Price testing new highs around 24,113",
          "Consistent bullish momentum since March reversal"
        ],
        risks: [
          "Low volume on recent push higher",
          "Potential double top formation at these levels",
          "Overbought conditions in short term"
        ],
        scenarios: {
          bull: "Break above 24,113 with volume could target 24,300-24,500 zone",
          bear: "Rejection here could see pullback to 23,800 support",
          invalidation: "Daily close below 23,700 would shift bias bearish"
        },
        checklist: [
          "Watch for volume on any breakout attempt",
          "Set alerts above/below key levels",
          "Monitor broader market sentiment",
          "Keep risk tight given extended move"
        ],
        psychology_hint: "Don't chase breakouts without confirmation - patience pays in these extended moves."
      })
    };

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