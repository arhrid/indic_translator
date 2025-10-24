import { NextResponse } from 'next/server';
import OpenAI from 'openai';

type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'gu' | 'mr' | 'pa' | 'or' | 'as' | 'sa';

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageNames: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  gu: 'Gujarati',
  mr: 'Marathi',
  pa: 'Punjabi',
  or: 'Odia',
  as: 'Assamese',
  sa: 'Sanskrit'
};

export async function POST(request: Request) {
  try {
    const { text, sourceLang = 'en', targetLang = 'hi' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text to translate is required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create a prompt for translation
    const prompt = `Translate the following ${languageNames[sourceLang as LanguageCode] || sourceLang} text to ${languageNames[targetLang as LanguageCode] || targetLang}. Only output the translation, nothing else.\n\n${text}`;

    // Call OpenAI's API for translation
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Using GPT-3.5 for cost-effectiveness
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the text accurately while preserving the original meaning, tone, and style.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: 1000,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim() || text;
    
    // Format the response to match what the frontend expects
    return NextResponse.json({
      data: {
        translatedText,
      }
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { 
        error: 'Error processing your translation request',
        details: error instanceof Error ? error.message : 'Unknown error',
        ...(process.env.NODE_ENV === 'development' ? { stack: (error as Error).stack } : {})
      },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
