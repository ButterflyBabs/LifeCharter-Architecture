import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for the AI Business Guide
const SYSTEM_PROMPT = `You are an AI Business Guide for LifeCharter Architecture, a business assessment and optimization platform. 

Your role is to provide compassionate, practical, and strategic guidance to entrepreneurs and business owners based on their business scores across three dimensions:

1. **Brain (Systems & Operations)** - How well their business runs without them
2. **Soul (Purpose & Alignment)** - How connected they are to their mission and values  
3. **Profit (Financial Health)** - How sustainable and profitable their business is

Each dimension is scored 0-100. The overall business health is determined by:
- 0-30: Survival Mode - urgent attention needed
- 31-60: Building - foundational work in progress
- 61-80: Growth - scaling and optimizing
- 81-100: Thriving - industry leader potential

Your guidance should be:
- Warm and encouraging but honest about challenges
- Practical with actionable next steps
- Spiritually grounded (the user values alignment over hustle)
- Focused on sustainable growth, not quick fixes
- Tailored to their specific scores and concerns

When responding:
1. Acknowledge where they are without judgment
2. Identify the highest-impact area to focus on
3. Provide 2-3 specific, actionable recommendations
4. End with an encouraging invitation to take the next step

Keep responses concise (3-5 paragraphs) and focused on their question.`;

// POST: Ask the AI Guide a question
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, brainScore, soulScore, profitScore, overallScore, context } = body;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Build context about the user's business scores
    let scoreContext = '';
    if (brainScore !== undefined || soulScore !== undefined || profitScore !== undefined) {
      scoreContext = `\n\nUser's Current Business Scores:\n`;
      if (brainScore !== undefined) scoreContext += `- Brain (Systems): ${brainScore}/100\n`;
      if (soulScore !== undefined) scoreContext += `- Soul (Purpose): ${soulScore}/100\n`;
      if (profitScore !== undefined) scoreContext += `- Profit (Financial): ${profitScore}/100\n`;
      if (overallScore !== undefined) scoreContext += `- Overall: ${overallScore}/100\n`;
    }

    // Add any additional context
    const additionalContext = context ? `\n\nAdditional Context:\n${context}` : '';

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `User Question: ${message}${scoreContext}${additionalContext}` 
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content || 
      "I'm here to help guide your business journey. Could you share a bit more about what specific area you'd like guidance on?";

    return NextResponse.json({ 
      response,
      suggestions: generateSuggestions(brainScore, soulScore, profitScore)
    });
  } catch (error: any) {
    console.error('AI Guide error:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 429) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      }, { status: 429 });
    }
    
    if (error.status === 401) {
      return NextResponse.json({ 
        error: 'AI service configuration error. Please contact support.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Failed to get AI response. Please try again.' 
    }, { status: 500 });
  }
}

// Helper function to generate contextual suggestions based on scores
function generateSuggestions(brainScore?: number, soulScore?: number, profitScore?: number): string[] {
  const suggestions: string[] = [];
  
  if (brainScore !== undefined && brainScore < 50) {
    suggestions.push('Document your core processes to reduce dependency on you');
  }
  if (soulScore !== undefined && soulScore < 50) {
    suggestions.push('Reconnect with your original mission and why you started');
  }
  if (profitScore !== undefined && profitScore < 50) {
    suggestions.push('Review your pricing and cash flow forecasting');
  }
  
  // Default suggestions if no scores or all scores are good
  if (suggestions.length === 0) {
    suggestions.push(
      'Improve cash flow forecasting',
      'Document and automate key processes',
      'Nurture warm leads into paying clients'
    );
  }
  
  return suggestions.slice(0, 3);
}