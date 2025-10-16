/**
 * Translation API Endpoint Tests
 * Tests for app/api/translate/route.ts
 */

import { describe, it, expect } from '@jest/globals';

describe('Translation API Endpoint', () => {
  const API_URL = 'http://localhost:3000/api/translate';

  /**
   * Test Suite 1: GET Endpoint
   */
  describe('GET /api/translate', () => {
    it('should return API documentation', async () => {
      const response = await fetch(API_URL, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('endpoint');
      expect(data).toHaveProperty('method');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('supportedLanguages');
    });

    it('should include supported languages in documentation', async () => {
      const response = await fetch(API_URL, {
        method: 'GET',
      });

      const data = await response.json();
      expect(Array.isArray(data.supportedLanguages)).toBe(true);
      expect(data.supportedLanguages.length).toBeGreaterThanOrEqual(23);
    });

    it('should include example request and response', async () => {
      const response = await fetch(API_URL, {
        method: 'GET',
      });

      const data = await response.json();
      expect(data).toHaveProperty('example');
      expect(data.example).toHaveProperty('request');
      expect(data.example).toHaveProperty('response');
    });
  });

  /**
   * Test Suite 2: POST Endpoint - Valid Requests
   */
  describe('POST /api/translate - Valid Requests', () => {
    it('should translate English to Hindi', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello, how are you?',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('translatedText');
      expect(data.data.translatedText).toBeTruthy();
      expect(data.data.sourceLang).toBe('en');
      expect(data.data.targetLang).toBe('hi');
      expect(data.data.duration).toBeGreaterThanOrEqual(0);
    });

    it('should translate between different language pairs', async () => {
      const pairs = [
        { source: 'en', target: 'ta' },
        { source: 'en', target: 'te' },
        { source: 'hi', target: 'en' },
      ];

      for (const pair of pairs) {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'Hello',
            sourceLang: pair.source,
            targetLang: pair.target,
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    it('should handle single word translation', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle text with punctuation', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello! How are you? I am fine, thank you.',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return duration in milliseconds', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      const data = await response.json();
      expect(typeof data.data.duration).toBe('number');
      expect(data.data.duration).toBeGreaterThanOrEqual(0);
    });
  });

  /**
   * Test Suite 3: POST Endpoint - Invalid Requests
   */
  describe('POST /api/translate - Invalid Requests', () => {
    it('should reject empty text', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });

    it('should reject missing text field', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should reject missing sourceLang field', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should reject missing targetLang field', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'en',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should reject unsupported source language', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'xx',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNSUPPORTED_LANGUAGE');
    });

    it('should reject unsupported target language', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'xx',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNSUPPORTED_LANGUAGE');
    });

    it('should reject text exceeding maximum length', async () => {
      const longText = 'word '.repeat(501);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: longText,
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should reject same source and target language', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'en',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  /**
   * Test Suite 4: POST Endpoint - Invalid JSON
   */
  describe('POST /api/translate - Invalid JSON', () => {
    it('should reject invalid JSON', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_JSON');
    });

    it('should reject non-JSON content type', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'Hello',
      });

      expect(response.status).toBe(400);
    });
  });

  /**
   * Test Suite 5: HTTP Status Codes
   */
  describe('HTTP Status Codes', () => {
    it('should return 200 for successful translation', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(200);
    });

    it('should return 400 for validation errors', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for unsupported language', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'xx',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid',
      });

      expect(response.status).toBe(400);
    });
  });

  /**
   * Test Suite 6: Response Format
   */
  describe('Response Format', () => {
    it('should return success response with correct structure', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('translatedText');
      expect(data.data).toHaveProperty('sourceLang');
      expect(data.data).toHaveProperty('targetLang');
      expect(data.data).toHaveProperty('duration');
    });

    it('should return error response with correct structure', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });

    it('should return JSON content type', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  /**
   * Test Suite 7: OPTIONS Endpoint (CORS)
   */
  describe('OPTIONS /api/translate', () => {
    it('should handle CORS preflight request', async () => {
      const response = await fetch(API_URL, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should include CORS headers', async () => {
      const response = await fetch(API_URL, {
        method: 'OPTIONS',
      });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeDefined();
    });
  });

  /**
   * Test Suite 8: Edge Cases
   */
  describe('Edge Cases', () => {
    it('should handle very long text (but under 500 words)', async () => {
      const text = 'word '.repeat(499);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(200);
    });

    it('should handle text with special characters', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello! @#$% World?',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(200);
    });

    it('should handle text with numbers', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'I have 123 apples',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(200);
    });

    it('should handle text with newlines', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello\nHow are you?',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
      });

      expect(response.status).toBe(200);
    });
  });
});
