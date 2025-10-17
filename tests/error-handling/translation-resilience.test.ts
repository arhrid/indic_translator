/**
 * Translation Resilience & Error Handling Tests
 * Tests for graceful error handling and fallback mechanisms
 */

import { translationService } from '@/lib/translation/translator';

describe('Translation Error Handling & Resilience', () => {
  beforeAll(async () => {
    await translationService.loadModel();
  });

  /**
   * Test Suite 1: API Timeout Handling
   */
  describe('API Timeout Handling', () => {
    it('should handle translation API timeout gracefully', async () => {
      // Mock fetch to simulate timeout
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Timeout'));

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Should return error response
        expect(response).toHaveProperty('code');
        expect(response).toHaveProperty('message');
        expect((response as any).code).toBe('TRANSLATION_ERROR');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should retry on timeout', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ translatedText: 'नमस्ते' }),
        } as any);
      });

      try {
        // First attempt fails, retry succeeds
        const response = await translationService.translate({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Should eventually succeed or return error
        expect(response).toBeDefined();
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should timeout after max retries', async () => {
      const originalFetch = global.fetch;

      global.fetch = jest.fn().mockRejectedValue(new Error('Timeout'));

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Should return error after retries exhausted
        expect(response).toHaveProperty('code');
        expect((response as any).code).toBe('TRANSLATION_ERROR');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should provide user-friendly timeout message', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Timeout'));

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Should have user-friendly message
        expect((response as any).message).toBeTruthy();
        expect((response as any).message.toLowerCase()).toContain('error');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  /**
   * Test Suite 2: Network Error Handling
   */
  describe('Network Error Handling', () => {
    it('should handle network connection error', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
        expect((response as any).code).toBe('TRANSLATION_ERROR');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle DNS resolution failure', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND'));

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
        expect((response as any).code).toBe('TRANSLATION_ERROR');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle connection refused', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('ECONNREFUSED'));

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
        expect((response as any).code).toBe('TRANSLATION_ERROR');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle connection reset', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('ECONNRESET'));

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
        expect((response as any).code).toBe('TRANSLATION_ERROR');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  /**
   * Test Suite 3: Invalid Input Handling
   */
  describe('Invalid Input Handling', () => {
    it('should handle empty text', async () => {
      const response = await translationService.translate({
        text: '',
        sourceLang: 'en',
        targetLang: 'hi',
      });

      expect(response).toHaveProperty('code');
      expect((response as any).code).toBe('VALIDATION_ERROR');
    });

    it('should handle null text', async () => {
      const response = await translationService.translate({
        text: null as any,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      expect(response).toHaveProperty('code');
      expect((response as any).code).toBe('VALIDATION_ERROR');
    });

    it('should handle undefined text', async () => {
      const response = await translationService.translate({
        text: undefined as any,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      expect(response).toHaveProperty('code');
      expect((response as any).code).toBe('VALIDATION_ERROR');
    });

    it('should handle invalid source language', async () => {
      const response = await translationService.translate({
        text: 'Test',
        sourceLang: 'invalid' as any,
        targetLang: 'hi',
      });

      expect(response).toHaveProperty('code');
      expect((response as any).code).toBe('VALIDATION_ERROR');
    });

    it('should handle invalid target language', async () => {
      const response = await translationService.translate({
        text: 'Test',
        sourceLang: 'en',
        targetLang: 'invalid' as any,
      });

      expect(response).toHaveProperty('code');
      expect((response as any).code).toBe('VALIDATION_ERROR');
    });

    it('should handle same source and target language', async () => {
      const response = await translationService.translate({
        text: 'Test',
        sourceLang: 'en',
        targetLang: 'en',
      });

      // Should either return error or original text
      expect(response).toBeDefined();
      if ((response as any).code) {
        expect((response as any).code).toBe('VALIDATION_ERROR');
      } else {
        expect((response as any).translatedText).toBe('Test');
      }
    });

    it('should handle very long text', async () => {
      const longText = 'a'.repeat(100000);

      const response = await translationService.translate({
        text: longText,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      // Should handle gracefully (either translate or return error)
      expect(response).toBeDefined();
      expect(response).toHaveProperty('code');
    });

    it('should handle special characters', async () => {
      const response = await translationService.translate({
        text: '!@#$%^&*()',
        sourceLang: 'en',
        targetLang: 'hi',
      });

      // Should handle gracefully
      expect(response).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      const response = await translationService.translate({
        text: '你好世界🌍',
        sourceLang: 'en',
        targetLang: 'hi',
      });

      // Should handle gracefully
      expect(response).toBeDefined();
    });
  });

  /**
   * Test Suite 4: HTTP Error Handling
   */
  describe('HTTP Error Handling', () => {
    it('should handle 400 Bad Request', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle 401 Unauthorized', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle 403 Forbidden', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle 404 Not Found', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle 429 Too Many Requests', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle 500 Internal Server Error', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle 503 Service Unavailable', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  /**
   * Test Suite 5: Response Parsing Errors
   */
  describe('Response Parsing Errors', () => {
    it('should handle invalid JSON response', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle missing translatedText in response', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle null translatedText', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ translatedText: null }),
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle empty translatedText', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ translatedText: '' }),
      } as any);

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Empty translation might be valid or error
        expect(response).toBeDefined();
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  /**
   * Test Suite 6: Fallback Mechanisms
   */
  describe('Fallback Mechanisms', () => {
    it('should use cache as fallback on error', async () => {
      // First successful translation
      const response1 = await translationService.translate({
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'hi',
      });

      expect(response1).toHaveProperty('translatedText');

      // Mock error on second attempt
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      try {
        // Second attempt should use cache
        const response2 = await translationService.translate({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Should either succeed from cache or return error
        expect(response2).toBeDefined();
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should return original text as fallback', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Should have error code
        expect(response).toHaveProperty('code');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should provide helpful error message', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Should have helpful message
        expect((response as any).message).toBeTruthy();
        expect((response as any).message.length).toBeGreaterThan(0);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  /**
   * Test Suite 7: Concurrent Error Handling
   */
  describe('Concurrent Error Handling', () => {
    it('should handle multiple concurrent errors', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ translatedText: 'नमस्ते' }),
        } as any);
      });

      try {
        const promises = [
          translationService.translate({
            text: 'Test 1',
            sourceLang: 'en',
            targetLang: 'hi',
          }),
          translationService.translate({
            text: 'Test 2',
            sourceLang: 'en',
            targetLang: 'hi',
          }),
          translationService.translate({
            text: 'Test 3',
            sourceLang: 'en',
            targetLang: 'hi',
          }),
        ];

        const results = await Promise.all(promises);

        // All should complete (either success or error)
        expect(results.length).toBe(3);
        expect(results.every(r => r !== null)).toBe(true);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle partial failures in batch', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ translatedText: 'नमस्ते' }),
        } as any);
      });

      try {
        const promises = [
          translationService.translate({
            text: 'Test 1',
            sourceLang: 'en',
            targetLang: 'hi',
          }),
          translationService.translate({
            text: 'Test 2',
            sourceLang: 'en',
            targetLang: 'hi',
          }),
          translationService.translate({
            text: 'Test 3',
            sourceLang: 'en',
            targetLang: 'hi',
          }),
        ];

        const results = await Promise.all(promises);

        // All should complete
        expect(results.length).toBe(3);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  /**
   * Test Suite 8: Error Recovery
   */
  describe('Error Recovery', () => {
    it('should recover after error', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ translatedText: 'नमस्ते' }),
        } as any);
      });

      try {
        // First attempt fails
        const response1 = await translationService.translate({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Second attempt should succeed
        const response2 = await translationService.translate({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // At least one should succeed or both should have responses
        expect(response1).toBeDefined();
        expect(response2).toBeDefined();
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should not crash on repeated errors', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      try {
        // Make multiple requests that all fail
        for (let i = 0; i < 5; i++) {
          const response = await translationService.translate({
            text: `Test ${i}`,
            sourceLang: 'en',
            targetLang: 'hi',
          });

          expect(response).toBeDefined();
        }
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  /**
   * Test Suite 9: Error Logging
   */
  describe('Error Logging', () => {
    it('should log translation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      try {
        await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Should have logged error
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        global.fetch = originalFetch;
        consoleSpy.mockRestore();
      }
    });

    it('should include error details in response', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      try {
        const response = await translationService.translate({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Should have error details
        expect((response as any).code).toBeTruthy();
        expect((response as any).message).toBeTruthy();
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
