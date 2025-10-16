/**
 * Test Data and Fixtures
 * Common test data used across test suites
 */

import { LanguageCode, TranslationRequest } from '@/lib/translation/translator';

/**
 * Supported Languages
 */
export const SUPPORTED_LANGUAGES: LanguageCode[] = [
  'en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa',
  'or', 'as', 'ur', 'sa', 'kok', 'mni', 'mai', 'sd', 'ks', 'dg',
  'bodo', 'sat'
];

/**
 * Language Pairs for Testing
 */
export const LANGUAGE_PAIRS: Array<[LanguageCode, LanguageCode]> = [
  ['en', 'hi'],
  ['en', 'ta'],
  ['en', 'te'],
  ['en', 'kn'],
  ['en', 'ml'],
  ['hi', 'en'],
  ['ta', 'en'],
  ['te', 'en'],
];

/**
 * Sample Translations
 */
export const SAMPLE_TRANSLATIONS = {
  english_to_hindi: {
    text: 'Hello, how are you?',
    sourceLang: 'en' as LanguageCode,
    targetLang: 'hi' as LanguageCode,
  },
  english_to_tamil: {
    text: 'Good morning',
    sourceLang: 'en' as LanguageCode,
    targetLang: 'ta' as LanguageCode,
  },
  hindi_to_english: {
    text: 'नमस्ते',
    sourceLang: 'hi' as LanguageCode,
    targetLang: 'en' as LanguageCode,
  },
  single_word: {
    text: 'Hello',
    sourceLang: 'en' as LanguageCode,
    targetLang: 'hi' as LanguageCode,
  },
  with_punctuation: {
    text: 'Hello! How are you? I am fine, thank you.',
    sourceLang: 'en' as LanguageCode,
    targetLang: 'hi' as LanguageCode,
  },
  with_numbers: {
    text: 'I have 5 apples and 3 oranges',
    sourceLang: 'en' as LanguageCode,
    targetLang: 'hi' as LanguageCode,
  },
  with_special_chars: {
    text: 'Hello! @#$% World?',
    sourceLang: 'en' as LanguageCode,
    targetLang: 'hi' as LanguageCode,
  },
};

/**
 * Invalid Inputs
 */
export const INVALID_INPUTS = {
  empty_text: {
    text: '',
    sourceLang: 'en' as LanguageCode,
    targetLang: 'hi' as LanguageCode,
  },
  whitespace_only: {
    text: '   ',
    sourceLang: 'en' as LanguageCode,
    targetLang: 'hi' as LanguageCode,
  },
  text_too_long: {
    text: 'word '.repeat(501),
    sourceLang: 'en' as LanguageCode,
    targetLang: 'hi' as LanguageCode,
  },
  unsupported_source_lang: {
    text: 'Hello',
    sourceLang: 'xx' as LanguageCode,
    targetLang: 'hi' as LanguageCode,
  },
  unsupported_target_lang: {
    text: 'Hello',
    sourceLang: 'en' as LanguageCode,
    targetLang: 'xx' as LanguageCode,
  },
  same_source_target: {
    text: 'Hello',
    sourceLang: 'en' as LanguageCode,
    targetLang: 'en' as LanguageCode,
  },
};

/**
 * API Request Payloads
 */
export const API_PAYLOADS = {
  valid_translation: {
    text: 'Hello, how are you?',
    sourceLang: 'en',
    targetLang: 'hi',
  },
  missing_text: {
    sourceLang: 'en',
    targetLang: 'hi',
  },
  missing_source_lang: {
    text: 'Hello',
    targetLang: 'hi',
  },
  missing_target_lang: {
    text: 'Hello',
    sourceLang: 'en',
  },
  invalid_source_lang: {
    text: 'Hello',
    sourceLang: 'xx',
    targetLang: 'hi',
  },
  invalid_target_lang: {
    text: 'Hello',
    sourceLang: 'en',
    targetLang: 'xx',
  },
  empty_text: {
    text: '',
    sourceLang: 'en',
    targetLang: 'hi',
  },
  text_too_long: {
    text: 'word '.repeat(501),
    sourceLang: 'en',
    targetLang: 'hi',
  },
  same_language: {
    text: 'Hello',
    sourceLang: 'en',
    targetLang: 'en',
  },
};

/**
 * Expected Error Codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNSUPPORTED_LANGUAGE: 'UNSUPPORTED_LANGUAGE',
  MODEL_LOAD_ERROR: 'MODEL_LOAD_ERROR',
  TRANSLATION_ERROR: 'TRANSLATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_JSON: 'INVALID_JSON',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
};

/**
 * Expected HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Helper Functions
 */

/**
 * Generate long text for testing
 */
export function generateLongText(wordCount: number): string {
  return 'word '.repeat(wordCount).trim();
}

/**
 * Generate valid translation request
 */
export function createTranslationRequest(
  text: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode
): TranslationRequest {
  return { text, sourceLang, targetLang };
}

/**
 * Generate random language pair
 */
export function getRandomLanguagePair(): [LanguageCode, LanguageCode] {
  const randomIndex = Math.floor(Math.random() * LANGUAGE_PAIRS.length);
  return LANGUAGE_PAIRS[randomIndex];
}

/**
 * Check if language code is valid
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.includes(code as LanguageCode);
}

/**
 * Get all language pair combinations
 */
export function getAllLanguagePairs(): Array<[LanguageCode, LanguageCode]> {
  const pairs: Array<[LanguageCode, LanguageCode]> = [];
  
  for (const source of SUPPORTED_LANGUAGES) {
    for (const target of SUPPORTED_LANGUAGES) {
      if (source !== target) {
        pairs.push([source, target]);
      }
    }
  }
  
  return pairs;
}

/**
 * Mock API Response
 */
export const MOCK_RESPONSES = {
  success: {
    success: true,
    data: {
      translatedText: 'नमस्ते, आप कैसे हैं?',
      sourceLang: 'en',
      targetLang: 'hi',
      duration: 2500,
    },
  },
  validation_error: {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Text cannot be empty',
    },
  },
  unsupported_language: {
    success: false,
    error: {
      code: 'UNSUPPORTED_LANGUAGE',
      message: 'Source language not supported: xx',
      details: {
        supportedLanguages: SUPPORTED_LANGUAGES,
      },
    },
  },
  invalid_json: {
    success: false,
    error: {
      code: 'INVALID_JSON',
      message: 'Request body must be valid JSON',
    },
  },
};

/**
 * Test Timeouts
 */
export const TIMEOUTS = {
  SHORT: 1000,      // 1 second
  MEDIUM: 5000,     // 5 seconds
  LONG: 10000,      // 10 seconds
  VERY_LONG: 30000, // 30 seconds
};

/**
 * Performance Benchmarks
 */
export const PERFORMANCE_BENCHMARKS = {
  single_word_translation: 1000,      // 1 second
  short_text_translation: 3000,       // 3 seconds
  medium_text_translation: 5000,      // 5 seconds
  long_text_translation: 10000,       // 10 seconds
  batch_translation_3_items: 10000,   // 10 seconds
};
