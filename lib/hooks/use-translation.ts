/**
 * useTranslation Hook
 * Provides translation functionality with caching and error handling
 */

'use client';

import { useState, useCallback } from 'react';
import { LanguageCode } from '@/components/language-selector';

export interface TranslationResult {
  text: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  duration: number;
}

export interface UseTranslationOptions {
  onSuccess?: (result: TranslationResult) => void;
  onError?: (error: Error) => void;
  cacheResults?: boolean;
}

/**
 * useTranslation Hook
 * 
 * Provides translation functionality with:
 * - Automatic caching
 * - Error handling
 * - Loading state
 * - Callbacks
 */
export function useTranslation(options: UseTranslationOptions = {}) {
  const { onSuccess, onError, cacheResults = true } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cache, setCache] = useState<Map<string, TranslationResult>>(new Map());

  // Create cache key
  const getCacheKey = useCallback(
    (text: string, sourceLang: LanguageCode, targetLang: LanguageCode): string => {
      return `${text}|${sourceLang}|${targetLang}`;
    },
    []
  );

  // Translate text
  const translate = useCallback(
    async (
      text: string,
      sourceLang: LanguageCode,
      targetLang: LanguageCode
    ): Promise<TranslationResult> => {
      const cacheKey = getCacheKey(text, sourceLang, targetLang);

      // Check cache
      if (cacheResults && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        onSuccess?.(cached);
        return cached;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            sourceLang,
            targetLang,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Translation failed');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Translation failed');
        }

        const result: TranslationResult = {
          text: data.data.translatedText,
          sourceLang,
          targetLang,
          duration: data.data.duration,
        };

        // Cache result
        if (cacheResults) {
          setCache(prev => new Map(prev).set(cacheKey, result));
        }

        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [cache, cacheResults, getCacheKey, onSuccess, onError]
  );

  // Translate multiple texts
  const translateBatch = useCallback(
    async (
      texts: string[],
      sourceLang: LanguageCode,
      targetLang: LanguageCode
    ): Promise<TranslationResult[]> => {
      return Promise.all(
        texts.map(text => translate(text, sourceLang, targetLang))
      );
    },
    [translate]
  );

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  // Get cached result
  const getCached = useCallback(
    (text: string, sourceLang: LanguageCode, targetLang: LanguageCode): TranslationResult | undefined => {
      const cacheKey = getCacheKey(text, sourceLang, targetLang);
      return cache.get(cacheKey);
    },
    [cache, getCacheKey]
  );

  return {
    translate,
    translateBatch,
    isLoading,
    error,
    clearCache,
    getCached,
    cacheSize: cache.size,
  };
}

export default useTranslation;
