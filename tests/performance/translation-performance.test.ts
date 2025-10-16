/**
 * Translation Performance Tests
 * Tests for translation speed and efficiency
 */

import { translationService } from '@/lib/translation/translator';

describe('Translation Performance', () => {
  beforeAll(async () => {
    await translationService.loadModel();
  });

  /**
   * Test Suite 1: Single Translation Performance
   */
  describe('Single Translation Performance', () => {
    it('should translate short text in < 3000ms', async () => {
      const start = performance.now();
      await translator.translate('Hello, how are you?', 'en', 'hi');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(3000);
    });

    it('should translate medium text in < 3000ms', async () => {
      const text =
        'The quick brown fox jumps over the lazy dog. This is a test sentence for translation performance measurement.';
      const start = performance.now();
      await translator.translate(text, 'en', 'hi');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(3000);
    });

    it('should translate long text in < 5000ms', async () => {
      const text = `Artificial intelligence is transforming the way we work and live. Machine learning algorithms can now process vast amounts of data and identify patterns that would be impossible for humans to detect manually. Natural language processing has made it possible for computers to understand and generate human language with remarkable accuracy.`;
      const start = performance.now();
      await translator.translate(text, 'en', 'hi');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000);
    });

    it('should maintain consistent performance across multiple calls', async () => {
      const durations: number[] = [];
      const text = 'Test sentence for performance measurement.';

      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await translator.translate(text, 'en', 'hi');
        const duration = performance.now() - start;
        durations.push(duration);
      }

      const average = durations.reduce((a, b) => a + b) / durations.length;
      const maxDuration = Math.max(...durations);

      expect(average).toBeLessThan(3000);
      expect(maxDuration).toBeLessThan(4000);
    });
  });

  /**
   * Test Suite 2: Batch Translation Performance
   */
  describe('Batch Translation Performance', () => {
    it('should translate batch of 5 texts efficiently', async () => {
      const texts = [
        'Hello, how are you?',
        'What is your name?',
        'Where do you live?',
        'What do you do?',
        'How can I help you?',
      ];

      const start = performance.now();
      const results = await Promise.all(
        texts.map(text => translator.translate(text, 'en', 'hi'))
      );
      const duration = performance.now() - start;

      expect(results.length).toBe(5);
      expect(results.every(r => r.length > 0)).toBe(true);
      expect(duration).toBeLessThan(15000); // 5 * 3000ms
    });

    it('should handle concurrent translations', async () => {
      const start = performance.now();

      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          translator.translate('Test sentence for concurrent translation.', 'en', 'hi')
        );
      }

      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      expect(results.length).toBe(3);
      expect(results.every(r => r.length > 0)).toBe(true);
      expect(duration).toBeLessThan(10000);
    });
  });

  /**
   * Test Suite 3: Caching Performance
   */
  describe('Caching Performance', () => {
    it('should return cached translation faster', async () => {
      const text = 'Caching test sentence for performance measurement.';

      // First call (not cached)
      const start1 = performance.now();
      await translator.translate(text, 'en', 'hi');
      const duration1 = performance.now() - start1;

      // Second call (should be cached)
      const start2 = performance.now();
      await translator.translate(text, 'en', 'hi');
      const duration2 = performance.now() - start2;

      expect(duration2).toBeLessThan(duration1);
    });

    it('should cache different language pairs separately', async () => {
      const text = 'Test sentence for caching.';

      // Translate to Hindi
      await translator.translate(text, 'en', 'hi');

      // Translate same text to Tamil (different cache entry)
      const start = performance.now();
      await translator.translate(text, 'en', 'ta');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(3000);
    });
  });

  /**
   * Test Suite 4: Language Pair Performance
   */
  describe('Language Pair Performance', () => {
    const testText = 'This is a test sentence for performance measurement.';
    const languagePairs = [
      ['en', 'hi'],
      ['en', 'ta'],
      ['en', 'te'],
      ['en', 'kn'],
      ['en', 'ml'],
    ];

    languagePairs.forEach(([source, target]) => {
      it(`should translate ${source} → ${target} in < 3000ms`, async () => {
        const start = performance.now();
        await translator.translate(testText, source as any, target as any);
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(3000);
      });
    });
  });

  /**
   * Test Suite 5: Text Length Impact
   */
  describe('Text Length Impact', () => {
    it('should scale linearly with text length', async () => {
      const shortText = 'Hello world.'; // ~2 words
      const mediumText = 'Hello world. This is a test sentence.'; // ~7 words
      const longText =
        'Hello world. This is a test sentence. The quick brown fox jumps over the lazy dog.'; // ~15 words

      const start1 = performance.now();
      await translator.translate(shortText, 'en', 'hi');
      const duration1 = performance.now() - start1;

      const start2 = performance.now();
      await translator.translate(mediumText, 'en', 'hi');
      const duration2 = performance.now() - start2;

      const start3 = performance.now();
      await translator.translate(longText, 'en', 'hi');
      const duration3 = performance.now() - start3;

      // Longer texts should take longer, but not exponentially
      expect(duration2).toBeGreaterThan(duration1);
      expect(duration3).toBeGreaterThan(duration2);
      expect(duration3).toBeLessThan(duration1 * 5); // Should not be 5x longer
    });

    it('should handle very long texts', async () => {
      const longText = Array(10)
        .fill(
          'The quick brown fox jumps over the lazy dog. This is a test sentence for translation performance measurement.'
        )
        .join(' ');

      const start = performance.now();
      await translator.translate(longText, 'en', 'hi');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10000); // Allow more time for very long texts
    });
  });

  /**
   * Test Suite 6: Memory Efficiency
   */
  describe('Memory Efficiency', () => {
    it('should not leak memory with repeated translations', async () => {
      const text = 'Test sentence for memory efficiency.';
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 100; i++) {
        await translator.translate(text, 'en', 'hi');
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should cache efficiently without excessive memory use', async () => {
      const texts = Array(50)
        .fill(0)
        .map((_, i) => `Test sentence number ${i} for caching.`);

      const initialMemory = process.memoryUsage().heapUsed;

      for (const text of texts) {
        await translator.translate(text, 'en', 'hi');
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Cache should not grow excessively
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  /**
   * Test Suite 7: Error Handling Performance
   */
  describe('Error Handling Performance', () => {
    it('should handle invalid language codes quickly', async () => {
      const start = performance.now();
      try {
        await translator.translate('Test', 'invalid', 'hi');
      } catch (error) {
        // Expected to fail
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should fail fast
    });

    it('should handle empty text quickly', async () => {
      const start = performance.now();
      try {
        await translator.translate('', 'en', 'hi');
      } catch (error) {
        // Expected to fail
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should fail fast
    });
  });

  /**
   * Test Suite 8: Throughput
   */
  describe('Throughput', () => {
    it('should achieve minimum throughput of 20 words/second', async () => {
      const text = 'The quick brown fox jumps over the lazy dog.'; // ~9 words
      const wordCount = text.split(/\s+/).length;

      const start = performance.now();
      await translator.translate(text, 'en', 'hi');
      const duration = performance.now() - start;

      const wordsPerSecond = (wordCount / duration) * 1000;

      expect(wordsPerSecond).toBeGreaterThan(20);
    });

    it('should maintain throughput across multiple translations', async () => {
      const text = 'Test sentence for throughput measurement.'; // ~6 words
      const wordCount = text.split(/\s+/).length;
      const totalWords = wordCount * 5;

      const start = performance.now();
      for (let i = 0; i < 5; i++) {
        await translator.translate(text, 'en', 'hi');
      }
      const duration = performance.now() - start;

      const wordsPerSecond = (totalWords / duration) * 1000;

      expect(wordsPerSecond).toBeGreaterThan(15);
    });
  });

  /**
   * Test Suite 9: Optimization Verification
   */
  describe('Optimization Verification', () => {
    it('should use lazy loading for model', async () => {
      // Model should be loaded only once
      const translator2 = new Translator();
      const start = performance.now();
      await translator2.initialize();
      const duration = performance.now() - start;

      // Should be fast if already loaded
      expect(duration).toBeLessThan(1000);
    });

    it('should benefit from caching after first translation', async () => {
      const text = 'Caching optimization test.';

      // First translation (no cache)
      const start1 = performance.now();
      await translator.translate(text, 'en', 'hi');
      const duration1 = performance.now() - start1;

      // Second translation (cached)
      const start2 = performance.now();
      await translator.translate(text, 'en', 'hi');
      const duration2 = performance.now() - start2;

      // Cached should be significantly faster
      expect(duration2).toBeLessThan(duration1 / 2);
    });
  });

  /**
   * Test Suite 10: Stress Testing
   */
  describe('Stress Testing', () => {
    it('should handle rapid sequential requests', async () => {
      const start = performance.now();

      for (let i = 0; i < 10; i++) {
        await translator.translate(`Test sentence ${i}.`, 'en', 'hi');
      }

      const duration = performance.now() - start;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(30000);
    });

    it('should handle mixed language pairs', async () => {
      const pairs = [
        ['en', 'hi'],
        ['en', 'ta'],
        ['en', 'te'],
        ['en', 'kn'],
        ['en', 'ml'],
      ];

      const start = performance.now();

      for (const [source, target] of pairs) {
        await translator.translate('Test sentence.', source as any, target as any);
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(15000);
    });
  });
});
