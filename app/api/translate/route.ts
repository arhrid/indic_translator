/**
 * Translation API Endpoint
 * POST /api/translate
 * 
 * Accepts translation requests and returns translated text
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  translationService,
  TranslationRequest,
  LanguageCode,
} from '@/lib/translation/translator';

// Request body interface
interface TranslateRequestBody {
  text: string;
  sourceLang: string;
  targetLang: string;
}

// Response interface
interface TranslateResponseBody {
  success: boolean;
  data?: {
    translatedText: string;
    sourceLang: LanguageCode;
    targetLang: LanguageCode;
    duration: number;
    confidence?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Rate limiting helper (placeholder for future implementation)
 * TODO: Implement proper rate limiting using Redis or similar
 */
function checkRateLimit(ip: string): boolean {
  // Placeholder: In production, implement rate limiting
  // Example: 100 requests per minute per IP
  return true;
}

/**
 * Validate request body
 */
function validateRequestBody(body: unknown): {
  valid: boolean;
  data?: TranslateRequestBody;
  error?: string;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const { text, sourceLang, targetLang } = body as Record<string, unknown>;

  // Validate text
  if (typeof text !== 'string') {
    return { valid: false, error: 'Field "text" must be a string' };
  }

  if (text.trim().length === 0) {
    return { valid: false, error: 'Field "text" cannot be empty' };
  }

  // Validate sourceLang
  if (typeof sourceLang !== 'string') {
    return { valid: false, error: 'Field "sourceLang" must be a string' };
  }

  // Validate targetLang
  if (typeof targetLang !== 'string') {
    return { valid: false, error: 'Field "targetLang" must be a string' };
  }

  return {
    valid: true,
    data: { text, sourceLang, targetLang },
  };
}

/**
 * POST handler for translation requests
 */
export async function POST(request: NextRequest): Promise<NextResponse<TranslateResponseBody>> {
  try {
    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
        },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error || 'Invalid request',
          },
        },
        { status: 400 }
      );
    }

    const { text, sourceLang, targetLang } = validation.data!;

    // Validate language codes
    if (!translationService.isLanguageSupported(sourceLang)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNSUPPORTED_LANGUAGE',
            message: `Source language not supported: ${sourceLang}`,
            details: {
              supportedLanguages: translationService.getSupportedLanguageCodes(),
            },
          },
        },
        { status: 400 }
      );
    }

    if (!translationService.isLanguageSupported(targetLang)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNSUPPORTED_LANGUAGE',
            message: `Target language not supported: ${targetLang}`,
            details: {
              supportedLanguages: translationService.getSupportedLanguageCodes(),
            },
          },
        },
        { status: 400 }
      );
    }

    // Create translation request
    const translationRequest: TranslationRequest = {
      text: text.trim(),
      sourceLang: sourceLang as LanguageCode,
      targetLang: targetLang as LanguageCode,
    };

    // Perform translation
    const result = await translationService.translate(translationRequest);

    // Handle translation errors
    if ('code' in result && result.code) {
      const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.code,
            message: result.message,
            details: result.details,
          },
        },
        { status: statusCode }
      );
    }

    // Return successful translation
    const successResult = result as any;
    return NextResponse.json(
      {
        success: true,
        data: {
          translatedText: successResult.translatedText,
          sourceLang: successResult.sourceLang,
          targetLang: successResult.targetLang,
          duration: successResult.duration,
          confidence: successResult.confidence,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[/api/translate] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for API documentation and language list
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      endpoint: '/api/translate',
      method: 'POST',
      description: 'Translate text between Indic languages',
      requestBody: {
        text: 'string (required, max 500 words)',
        sourceLang: 'string (required, language code)',
        targetLang: 'string (required, language code)',
      },
      responseBody: {
        success: 'boolean',
        data: {
          translatedText: 'string',
          sourceLang: 'string',
          targetLang: 'string',
          duration: 'number (milliseconds)',
          confidence: 'number (optional)',
        },
        error: {
          code: 'string',
          message: 'string',
          details: 'object (optional)',
        },
      },
      supportedLanguages: translationService.getSupportedLanguages(),
      example: {
        request: {
          text: 'Hello, how are you?',
          sourceLang: 'en',
          targetLang: 'hi',
        },
        response: {
          success: true,
          data: {
            translatedText: 'नमस्ते, आप कैसे हैं?',
            sourceLang: 'en',
            targetLang: 'hi',
            duration: 2500,
          },
        },
      },
    },
    { status: 200 }
  );
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
