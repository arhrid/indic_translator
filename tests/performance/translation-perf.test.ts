/**
 * Translation Performance Tests
 * Tests for translation speed and efficiency
 */

import { translationService } from '@/lib/translation/translator';

describe('Translation Performance', () => {
  beforeAll(async () => {
    await translationService.loadModel();
  });

  describe('Single Translation Performance', () => {
    it('should translate short text in < 3000ms', async () => {
      const start = performance.now();
      await translationService.translate({
        text: 'Hello, how are you?',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(3000);
    });

    it('should translate medium text in < 3000ms', async () => {
      const text =
        'The quick brown fox jumps over the lazy dog. This is a test sentence for translation performance measurement.';
      const start = performance.now();
      await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(3000);
    });

    it('should maintain consistent performance across multiple calls', async () => {
      const durations: number[] = [];
      const text = 'Test sentence for performance measurement.';

      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await translationService.translate({
          text,
          sourceLang: 'en',
          targetLang: 'hi',
        });
        const duration = performance.now() - start;
        durations.push(duration);
      }

      const average = durations.reduce((a, b) => a + b) / durations.length;
      const maxDuration = Math.max(...durations);

      expect(average).toBeLessThan(3000);
      expect(maxDuration).toBeLessThan(4000);
    });
  });

  describe('Caching Performance', () => {
    it('should return cached translation faster', async () => {
      const text = 'Caching test sentence for performance measurement.';

      // First call (not cached)
      const start1 = performance.now();
      await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration1 = performance.now() - start1;

      // Second call (should be cached)
      const start2 = performance.now();
      await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration2 = performance.now() - start2;

      expect(duration2).toBeLessThan(duration1);
    });
  });

  describe('Language Pair Performance', () => {
    const testText = 'This is a test sentence for performance measurement.';
    const languagePairs: Array<[string, string]> = [
      ['en', 'hi'],
      ['en', 'ta'],
      ['en', 'te'],
    ];

    languagePairs.forEach(([source, target]) => {
      it(`should translate ${source} → ${target} in < 3000ms`, async () => {
        const start = performance.now();
        await translationService.translate({
          text: testText,
          sourceLang: source as any,
          targetLang: target as any,
        });
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(3000);
      });
    });
  });

  describe('Throughput', () => {
    it('should achieve minimum throughput of 20 words/second', async () => {
      const text = 'The quick brown fox jumps over the lazy dog.'; // ~9 words
      const wordCount = text.split(/\s+/).length;

      const start = performance.now();
      await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration = performance.now() - start;

      const wordsPerSecond = (wordCount / duration) * 1000;

      expect(wordsPerSecond).toBeGreaterThan(20);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle invalid language codes quickly', async () => {
      const start = performance.now();
      await translationService.translate({
        text: 'Test',
        sourceLang: 'invalid' as any,
        targetLang: 'hi',
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should fail fast
    });

    it('should handle empty text quickly', async () => {
      const start = performance.now();
      await translationService.translate({
        text: '',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should fail fast
    });
  });
});
