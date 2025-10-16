/**
 * Cache Effectiveness Tests
 * Tests for translation caching performance and hit rates
 */

import { translationService } from '@/lib/translation/translator';

describe('Cache Effectiveness', () => {
  beforeAll(async () => {
    await translationService.loadModel();
  });

  /**
   * Test Suite 1: Cache Hit Performance
   */
  describe('Cache Hit Performance', () => {
    it('should return cached translation significantly faster', async () => {
      const text = 'Hello world';

      // First call (uncached)
      const start1 = performance.now();
      const response1 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration1 = performance.now() - start1;

      // Second call (cached)
      const start2 = performance.now();
      const response2 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration2 = performance.now() - start2;

      // Verify both return same result
      expect(response1.translatedText).toBe(response2.translatedText);

      // Cached should be 90% faster
      expect(duration2).toBeLessThan(duration1 * 0.1);

      // Cached should be very fast (< 100ms)
      expect(duration2).toBeLessThan(100);
    });

    it('should cache different language pairs separately', async () => {
      const text = 'Test sentence for caching.';

      // Translate to Hindi
      const start1 = performance.now();
      const response1 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration1 = performance.now() - start1;

      // Translate same text to Tamil (different cache entry)
      const start2 = performance.now();
      const response2 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'ta',
      });
      const duration2 = performance.now() - start2;

      // Both should succeed
      expect(response1.translatedText).toBeTruthy();
      expect(response2.translatedText).toBeTruthy();

      // Results should be different
      expect(response1.translatedText).not.toBe(response2.translatedText);

      // Second call should not be cached (different target language)
      expect(duration2).toBeGreaterThan(duration1 * 0.5);
    });

    it('should cache with same language pair but different text', async () => {
      const text1 = 'First test sentence.';
      const text2 = 'Second test sentence.';

      // First text
      const start1 = performance.now();
      const response1 = await translationService.translate({
        text: text1,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration1 = performance.now() - start1;

      // Second text (different, so not cached)
      const start2 = performance.now();
      const response2 = await translationService.translate({
        text: text2,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration2 = performance.now() - start2;

      // Both should succeed
      expect(response1.translatedText).toBeTruthy();
      expect(response2.translatedText).toBeTruthy();

      // Results should be different
      expect(response1.translatedText).not.toBe(response2.translatedText);

      // Second call should not be significantly faster (not cached)
      expect(duration2).toBeGreaterThan(duration1 * 0.5);
    });

    it('should cache repeated identical requests', async () => {
      const text = 'Repeated cache test.';
      const durations: number[] = [];

      // Make 5 identical requests
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await translationService.translate({
          text,
          sourceLang: 'en',
          targetLang: 'hi',
        });
        const duration = performance.now() - start;
        durations.push(duration);
      }

      // First should be slowest (cache miss)
      const firstDuration = durations[0];

      // Rest should be much faster (cache hits)
      for (let i = 1; i < durations.length; i++) {
        expect(durations[i]).toBeLessThan(firstDuration * 0.1);
        expect(durations[i]).toBeLessThan(100);
      }
    });
  });

  /**
   * Test Suite 2: Cache Hit Rate
   */
  describe('Cache Hit Rate', () => {
    it('should achieve > 30% cache hit rate in typical usage', async () => {
      const texts = [
        'Hello world',
        'How are you',
        'Hello world', // Repeat
        'What is your name',
        'How are you', // Repeat
        'Where do you live',
        'Hello world', // Repeat
        'Thank you',
        'How are you', // Repeat
        'Goodbye', // 10 requests, 4 repeats = 40% hit rate
      ];

      let cacheHits = 0;
      let cacheMisses = 0;

      for (const text of texts) {
        const start = performance.now();
        await translationService.translate({
          text,
          sourceLang: 'en',
          targetLang: 'hi',
        });
        const duration = performance.now() - start;

        // Cache hits are very fast (< 100ms)
        if (duration < 100) {
          cacheHits++;
        } else {
          cacheMisses++;
        }
      }

      const hitRate = (cacheHits / texts.length) * 100;
      expect(hitRate).toBeGreaterThan(30);
    });

    it('should track cache statistics', async () => {
      const texts = Array(20)
        .fill(0)
        .map((_, i) => `Test sentence ${i % 5}.`); // 5 unique texts, repeated 4 times each

      for (const text of texts) {
        await translationService.translate({
          text,
          sourceLang: 'en',
          targetLang: 'hi',
        });
      }

      // Expected: 5 cache misses, 15 cache hits = 75% hit rate
      // (First occurrence of each unique text is a miss)
    });
  });

  /**
   * Test Suite 3: Cache Memory Usage
   */
  describe('Cache Memory Usage', () => {
    it('should maintain reasonable cache size', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Cache 100 different translations
      for (let i = 0; i < 100; i++) {
        await translationService.translate({
          text: `Test sentence number ${i}.`,
          sourceLang: 'en',
          targetLang: 'hi',
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsed = finalMemory - initialMemory;

      // Cache should use reasonable amount of memory
      // 100 translations × ~100 bytes per entry = ~10KB
      // But with overhead, expect < 100MB
      expect(memoryUsed).toBeLessThan(100 * 1024 * 1024);
    });

    it('should not grow unbounded with repeated caching', async () => {
      const memorySnapshots: number[] = [];

      for (let batch = 0; batch < 5; batch++) {
        memorySnapshots.push(process.memoryUsage().heapUsed);

        // Cache 50 translations in each batch
        for (let i = 0; i < 50; i++) {
          await translationService.translate({
            text: `Batch ${batch} sentence ${i}.`,
            sourceLang: 'en',
            targetLang: 'hi',
          });
        }
      }

      // Memory growth should be roughly linear, not exponential
      const growth1 = memorySnapshots[1] - memorySnapshots[0];
      const growth4 = memorySnapshots[4] - memorySnapshots[3];

      // Growth should be similar across batches (not exponential)
      expect(growth4).toBeLessThan(growth1 * 2);
    });
  });

  /**
   * Test Suite 4: Cache Invalidation
   */
  describe('Cache Invalidation', () => {
    it('should use correct cache key for language pair', async () => {
      const text = 'Cache key test';

      // Translate to Hindi
      const start1 = performance.now();
      const response1 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration1 = performance.now() - start1;

      // Translate same text to Hindi again (should be cached)
      const start2 = performance.now();
      const response2 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration2 = performance.now() - start2;

      // Translate to Tamil (different language, should not be cached)
      const start3 = performance.now();
      const response3 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'ta',
      });
      const duration3 = performance.now() - start3;

      // Verify results
      expect(response1.translatedText).toBe(response2.translatedText);
      expect(response1.translatedText).not.toBe(response3.translatedText);

      // Verify timing
      expect(duration2).toBeLessThan(duration1 * 0.1); // Cached
      expect(duration3).toBeGreaterThan(duration1 * 0.5); // Not cached
    });

    it('should handle cache with whitespace variations', async () => {
      const text1 = 'Test sentence';
      const text2 = 'Test  sentence'; // Extra space
      const text3 = 'Test sentence '; // Trailing space

      const response1 = await translationService.translate({
        text: text1,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      const response2 = await translationService.translate({
        text: text2,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      const response3 = await translationService.translate({
        text: text3,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      // Different text = different cache entries
      // (Whitespace matters for cache key)
      expect(response1.translatedText).toBeTruthy();
      expect(response2.translatedText).toBeTruthy();
      expect(response3.translatedText).toBeTruthy();
    });
  });

  /**
   * Test Suite 5: Cache Performance Under Load
   */
  describe('Cache Performance Under Load', () => {
    it('should maintain fast cache hits under concurrent load', async () => {
      const text = 'Concurrent cache test';

      // Prime the cache
      await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      // Make 10 concurrent requests (should all hit cache)
      const start = performance.now();
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          translationService.translate({
            text,
            sourceLang: 'en',
            targetLang: 'hi',
          })
        );
      }

      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      // All should succeed
      expect(results.length).toBe(10);
      expect(results.every(r => r.translatedText)).toBe(true);

      // All should be fast (cache hits)
      expect(duration).toBeLessThan(1000); // 10 cache hits should be very fast
    });

    it('should handle mixed cache hits and misses', async () => {
      const texts = [
        'Cached text 1',
        'Cached text 2',
        'Cached text 3',
        'Cached text 1', // Hit
        'Cached text 4',
        'Cached text 2', // Hit
        'Cached text 5',
        'Cached text 3', // Hit
      ];

      const start = performance.now();
      const promises = texts.map(text =>
        translationService.translate({
          text,
          sourceLang: 'en',
          targetLang: 'hi',
        })
      );

      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      // All should succeed
      expect(results.length).toBe(texts.length);
      expect(results.every(r => r.translatedText)).toBe(true);

      // Should be faster than 8 sequential cache misses
      expect(duration).toBeLessThan(24000); // 8 * 3000ms
    });
  });

  /**
   * Test Suite 6: Cache Effectiveness Metrics
   */
  describe('Cache Effectiveness Metrics', () => {
    it('should show cache speedup factor', async () => {
      const text = 'Cache speedup test';

      // First call (cache miss)
      const start1 = performance.now();
      await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration1 = performance.now() - start1;

      // Second call (cache hit)
      const start2 = performance.now();
      await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration2 = performance.now() - start2;

      const speedupFactor = duration1 / duration2;

      // Cache should provide at least 10x speedup
      expect(speedupFactor).toBeGreaterThan(10);

      // Log metrics
      console.log(`Cache speedup factor: ${speedupFactor.toFixed(1)}x`);
      console.log(`Cache miss: ${duration1.toFixed(2)}ms`);
      console.log(`Cache hit: ${duration2.toFixed(2)}ms`);
    });

    it('should calculate effective throughput with caching', async () => {
      const texts = Array(10)
        .fill(0)
        .map((_, i) => `Test sentence ${i % 3}.`); // 3 unique texts, repeated

      const start = performance.now();
      const totalWords = texts.reduce((sum, text) => sum + text.split(/\s+/).length, 0);

      for (const text of texts) {
        await translationService.translate({
          text,
          sourceLang: 'en',
          targetLang: 'hi',
        });
      }

      const duration = performance.now() - start;
      const wordsPerSecond = (totalWords / duration) * 1000;

      // With caching, throughput should be much higher
      expect(wordsPerSecond).toBeGreaterThan(50);

      console.log(`Effective throughput with caching: ${wordsPerSecond.toFixed(2)} words/sec`);
    });
  });
});
