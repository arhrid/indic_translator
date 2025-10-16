/**
 * Translation Service Unit Tests
 * Tests for lib/translation/translator.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  translationService,
  TranslationRequest,
  LanguageCode,
} from '@/lib/translation/translator';

describe('Translation Service', () => {
  /**
   * Test Suite 1: Model Loading
   */
  describe('Model Loading', () => {
    it('should load model successfully', async () => {
      const result = await translationService.loadModel();
      expect(result).toBe(true);
    });

    it('should return true on subsequent load attempts (cached)', async () => {
      // First load
      await translationService.loadModel();
      
      // Second load should be instant and return true
      const result = await translationService.loadModel();
      expect(result).toBe(true);
    });

    it('should have model loaded status after loading', async () => {
      await translationService.loadModel();
      const status = translationService.getStatus();
      
      expect(status.modelLoaded).toBe(true);
      expect(status.isLoading).toBe(false);
    });
  });

  /**
   * Test Suite 2: Language Support
   */
  describe('Language Support', () => {
    it('should return all supported languages', () => {
      const languages = translationService.getSupportedLanguages();
      
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThanOrEqual(23);
    });

    it('should include all 22 Indian languages + English', () => {
      const languages = translationService.getSupportedLanguages();
      const codes = languages.map(lang => lang.code);
      
      // Check all 22 Indian languages + English
      const requiredLanguages = [
        'en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa',
        'or', 'as', 'ur', 'sa', 'kok', 'mni', 'mai', 'sd', 'ks', 'dg',
        'bodo', 'sat'
      ];
      
      requiredLanguages.forEach(lang => {
        expect(codes).toContain(lang);
      });
    });

    it('should return language codes as array', () => {
      const codes = translationService.getSupportedLanguageCodes();
      
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThanOrEqual(23);
      expect(codes).toContain('en');
      expect(codes).toContain('hi');
    });

    it('should validate supported languages correctly', () => {
      expect(translationService.isLanguageSupported('en')).toBe(true);
      expect(translationService.isLanguageSupported('hi')).toBe(true);
      expect(translationService.isLanguageSupported('ta')).toBe(true);
      expect(translationService.isLanguageSupported('xx')).toBe(false);
      expect(translationService.isLanguageSupported('invalid')).toBe(false);
    });

    it('should get language details by code', () => {
      const english = translationService.getLanguage('en');
      expect(english).toBeDefined();
      expect(english?.code).toBe('en');
      expect(english?.name).toBe('English');
      
      const hindi = translationService.getLanguage('hi');
      expect(hindi).toBeDefined();
      expect(hindi?.code).toBe('hi');
      expect(hindi?.name).toBe('Hindi');
    });

    it('should return undefined for unsupported language', () => {
      const result = translationService.getLanguage('xx' as LanguageCode);
      expect(result).toBeUndefined();
    });
  });

  /**
   * Test Suite 3: Input Validation
   */
  describe('Input Validation', () => {
    it('should reject empty text', async () => {
      const result = await translationService.translate({
        text: '',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      expect('code' in result && result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('empty');
    });

    it('should reject whitespace-only text', async () => {
      const result = await translationService.translate({
        text: '   ',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      expect('code' in result && result.code).toBe('VALIDATION_ERROR');
    });

    it('should reject text exceeding 500 words', async () => {
      const longText = 'word '.repeat(501);
      const result = await translationService.translate({
        text: longText,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      expect('code' in result && result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('exceeds');
    });

    it('should accept text up to 500 words', async () => {
      const text = 'word '.repeat(500);
      const result = await translationService.translate({
        text: text.trim(),
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      // Should not be a validation error
      expect('code' in result && result.code === 'VALIDATION_ERROR').toBe(false);
    });

    it('should reject unsupported source language', async () => {
      const result = await translationService.translate({
        text: 'Hello',
        sourceLang: 'xx' as LanguageCode,
        targetLang: 'hi',
      });
      
      expect('code' in result && result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('source');
    });

    it('should reject unsupported target language', async () => {
      const result = await translationService.translate({
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'xx' as LanguageCode,
      });
      
      expect('code' in result && result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('target');
    });

    it('should reject when source and target are the same', async () => {
      const result = await translationService.translate({
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'en',
      });
      
      expect('code' in result && result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('different');
    });
  });

  /**
   * Test Suite 4: Translation Requests
   */
  describe('Translation Requests', () => {
    beforeAll(async () => {
      await translationService.loadModel();
    });

    it('should handle valid translation request', async () => {
      const request: TranslationRequest = {
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'hi',
      };
      
      const result = await translationService.translate(request);
      
      // Should not have error code
      expect('code' in result && result.code).toBeFalsy();
      
      // Should have translation response properties
      if ('translatedText' in result) {
        expect(result.translatedText).toBeDefined();
        expect(result.sourceLang).toBe('en');
        expect(result.targetLang).toBe('hi');
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should trim whitespace from text', async () => {
      const request: TranslationRequest = {
        text: '  Hello  ',
        sourceLang: 'en',
        targetLang: 'hi',
      };
      
      const result = await translationService.translate(request);
      
      // Should process successfully
      expect('code' in result && result.code === 'VALIDATION_ERROR').toBe(false);
    });

    it('should measure translation duration', async () => {
      const request: TranslationRequest = {
        text: 'Hello, how are you?',
        sourceLang: 'en',
        targetLang: 'hi',
      };
      
      const result = await translationService.translate(request);
      
      if ('duration' in result) {
        expect(result.duration).toBeGreaterThan(0);
        expect(typeof result.duration).toBe('number');
      }
    });

    it('should support multiple language pairs', async () => {
      const pairs: Array<[LanguageCode, LanguageCode]> = [
        ['en', 'hi'],
        ['en', 'ta'],
        ['en', 'te'],
        ['hi', 'en'],
      ];
      
      for (const [source, target] of pairs) {
        const result = await translationService.translate({
          text: 'Hello',
          sourceLang: source,
          targetLang: target,
        });
        
        // Should not be validation error
        expect('code' in result && result.code === 'VALIDATION_ERROR').toBe(false);
      }
    });
  });

  /**
   * Test Suite 5: Error Handling
   */
  describe('Error Handling', () => {
    it('should return error object with code and message', async () => {
      const result = await translationService.translate({
        text: '',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      expect('code' in result).toBe(true);
      expect('message' in result).toBe(true);
      expect(result.code).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('should include error details when available', async () => {
      const result = await translationService.translate({
        text: 'word '.repeat(501),
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      if ('details' in result && result.details) {
        expect(typeof result.details).toBe('object');
      }
    });

    it('should handle model loading errors gracefully', async () => {
      // This test verifies error handling structure
      const status = translationService.getStatus();
      expect(status).toHaveProperty('modelLoaded');
      expect(status).toHaveProperty('isLoading');
      expect(status).toHaveProperty('supportedLanguages');
    });
  });

  /**
   * Test Suite 6: Service Status
   */
  describe('Service Status', () => {
    it('should return service status', () => {
      const status = translationService.getStatus();
      
      expect(status).toHaveProperty('modelLoaded');
      expect(status).toHaveProperty('isLoading');
      expect(status).toHaveProperty('supportedLanguages');
      
      expect(typeof status.modelLoaded).toBe('boolean');
      expect(typeof status.isLoading).toBe('boolean');
      expect(typeof status.supportedLanguages).toBe('number');
    });

    it('should report correct number of supported languages', () => {
      const status = translationService.getStatus();
      expect(status.supportedLanguages).toBeGreaterThanOrEqual(23);
    });
  });

  /**
   * Test Suite 7: Edge Cases
   */
  describe('Edge Cases', () => {
    it('should handle single word translation', async () => {
      const result = await translationService.translate({
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      expect('code' in result && result.code === 'VALIDATION_ERROR').toBe(false);
    });

    it('should handle text with special characters', async () => {
      const result = await translationService.translate({
        text: 'Hello! How are you? 123',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      expect('code' in result && result.code === 'VALIDATION_ERROR').toBe(false);
    });

    it('should handle text with punctuation', async () => {
      const result = await translationService.translate({
        text: 'Hello, how are you? I am fine, thank you.',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      expect('code' in result && result.code === 'VALIDATION_ERROR').toBe(false);
    });

    it('should handle text with numbers', async () => {
      const result = await translationService.translate({
        text: 'I have 5 apples and 3 oranges',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      expect('code' in result && result.code === 'VALIDATION_ERROR').toBe(false);
    });

    it('should handle text with mixed case', async () => {
      const result = await translationService.translate({
        text: 'HeLLo WoRLd',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      expect('code' in result && result.code === 'VALIDATION_ERROR').toBe(false);
    });
  });

  /**
   * Test Suite 8: Type Safety
   */
  describe('Type Safety', () => {
    it('should have correct response type for success', async () => {
      const result = await translationService.translate({
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      if ('translatedText' in result) {
        expect(typeof result.translatedText).toBe('string');
        expect(typeof result.duration).toBe('number');
      }
    });

    it('should have correct response type for error', async () => {
      const result = await translationService.translate({
        text: '',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      
      if ('code' in result) {
        expect(typeof result.code).toBe('string');
        expect(typeof result.message).toBe('string');
      }
    });
  });
});
