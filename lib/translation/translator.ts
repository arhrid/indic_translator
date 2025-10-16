/**
 * Translation Service for Indic Languages
 * Handles model loading, caching, and translation operations
 */

// Language type definitions
export type LanguageCode = 
  | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'mr' | 'gu' | 'bn' | 'pa' | 'or'
  | 'as' | 'ur' | 'sa' | 'kok' | 'mni' | 'mai' | 'sd' | 'ks' | 'dg' | 'bodo' | 'sat'
  | 'en';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export interface TranslationRequest {
  text: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  duration: number; // milliseconds
  confidence?: number;
  detectedLang?: LanguageCode;
}

export interface TranslationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Supported languages mapping
const SUPPORTED_LANGUAGES: Record<LanguageCode, Language> = {
  'hi': { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  'ta': { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  'te': { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  'kn': { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  'ml': { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  'mr': { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  'gu': { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  'bn': { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  'pa': { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  'or': { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  'as': { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  'ur': { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  'sa': { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  'kok': { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
  'mni': { code: 'mni', name: 'Manipuri', nativeName: 'ମଣିପୁରୀ' },
  'mai': { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  'sd': { code: 'sd', name: 'Sindhi', nativeName: 'سندھی' },
  'ks': { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر' },
  'dg': { code: 'dg', name: 'Dogri', nativeName: 'डोगरी' },
  'bodo': { code: 'bodo', name: 'Bodo', nativeName: 'बड़ो' },
  'sat': { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  'en': { code: 'en', name: 'English', nativeName: 'English' },
};

/**
 * TranslationService - Singleton service for managing translations
 * Implements lazy loading and caching of the translation model
 */
class TranslationService {
  private static instance: TranslationService;
  private modelLoaded: boolean = false;
  private modelLoadingPromise: Promise<boolean> | null = null;
  private model: any = null;
  private tokenizer: any = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Load the translation model (lazy loading)
   * Uses singleton pattern to ensure model is loaded only once
   */
  async loadModel(): Promise<boolean> {
    // If already loaded, return immediately
    if (this.modelLoaded) {
      return true;
    }

    // If currently loading, wait for the existing promise
    if (this.modelLoadingPromise) {
      return this.modelLoadingPromise;
    }

    // Start loading
    this.modelLoadingPromise = this._performModelLoad();
    const result = await this.modelLoadingPromise;
    this.modelLoadingPromise = null;

    return result;
  }

  /**
   * Internal method to perform actual model loading
   */
  private async _performModelLoad(): Promise<boolean> {
    try {
      // In a real implementation, this would load the model from the local filesystem
      // For now, we'll set up the structure for Python backend integration
      console.log('[TranslationService] Loading IndicTrans2 model...');

      // TODO: Initialize model loading from Python backend or transformers.js
      // This will be called via API endpoint to the Python backend
      this.modelLoaded = true;
      console.log('[TranslationService] Model loaded successfully');

      return true;
    } catch (error) {
      console.error('[TranslationService] Failed to load model:', error);
      this.modelLoaded = false;
      return false;
    }
  }

  /**
   * Translate text from source to target language
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse | TranslationError> {
    const startTime = Date.now();

    try {
      // Validate input
      const validation = this.validateTranslationRequest(request);
      if (!validation.valid) {
        return {
          code: 'VALIDATION_ERROR',
          message: validation.error || 'Invalid translation request',
          details: { request },
        };
      }

      // Ensure model is loaded
      const modelLoaded = await this.loadModel();
      if (!modelLoaded) {
        return {
          code: 'MODEL_LOAD_ERROR',
          message: 'Failed to load translation model',
        };
      }

      // Perform translation via API call to backend
      const translated = await this._performTranslation(request);

      const duration = Date.now() - startTime;

      return {
        translatedText: translated,
        sourceLang: request.sourceLang,
        targetLang: request.targetLang,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[TranslationService] Translation error:', error);

      return {
        code: 'TRANSLATION_ERROR',
        message: error instanceof Error ? error.message : 'Translation failed',
        details: { duration },
      };
    }
  }

  /**
   * Internal method to perform actual translation
   * This will call the backend translation API
   */
  private async _performTranslation(request: TranslationRequest): Promise<string> {
    try {
      // Call the internal translation API endpoint
      const response = await fetch('/api/translate/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          source_lang: request.sourceLang,
          target_lang: request.targetLang,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Translation failed');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Translation failed');
      }

      return data.translated_text || data.translatedText;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Translation backend error'
      );
    }
  }

  /**
   * Validate translation request
   */
  private validateTranslationRequest(
    request: TranslationRequest
  ): { valid: boolean; error?: string } {
    // Check if text is provided
    if (!request.text || request.text.trim().length === 0) {
      return { valid: false, error: 'Text cannot be empty' };
    }

    // Check text length (max 50 words for initial implementation)
    const wordCount = request.text.trim().split(/\s+/).length;
    if (wordCount > 500) {
      return { valid: false, error: 'Text exceeds maximum length of 500 words' };
    }

    // Check if source language is supported
    if (!this.isLanguageSupported(request.sourceLang)) {
      return { valid: false, error: `Unsupported source language: ${request.sourceLang}` };
    }

    // Check if target language is supported
    if (!this.isLanguageSupported(request.targetLang)) {
      return { valid: false, error: `Unsupported target language: ${request.targetLang}` };
    }

    // Check if source and target are different
    if (request.sourceLang === request.targetLang) {
      return { valid: false, error: 'Source and target languages must be different' };
    }

    return { valid: true };
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): Language[] {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  /**
   * Get supported language codes
   */
  getSupportedLanguageCodes(): LanguageCode[] {
    return Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[];
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(langCode: string): langCode is LanguageCode {
    return langCode in SUPPORTED_LANGUAGES;
  }

  /**
   * Get language details by code
   */
  getLanguage(code: LanguageCode): Language | undefined {
    return SUPPORTED_LANGUAGES[code];
  }

  /**
   * Get model status
   */
  getStatus(): {
    modelLoaded: boolean;
    isLoading: boolean;
    supportedLanguages: number;
  } {
    return {
      modelLoaded: this.modelLoaded,
      isLoading: this.modelLoadingPromise !== null,
      supportedLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
    };
  }
}

// Export singleton instance
export const translationService = TranslationService.getInstance();

// Export factory function for testing
export function createTranslationService(): TranslationService {
  return TranslationService.getInstance();
}
