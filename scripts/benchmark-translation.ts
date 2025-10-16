/**
 * Translation Benchmark Script
 * Measures translation performance across all language pairs
 */

import { translationService } from '../lib/translation/translator';
import * as fs from 'fs';
import * as path from 'path';

interface BenchmarkResult {
  sourceLang: string;
  targetLang: string;
  textLength: number;
  duration: number;
  wordsPerSecond: number;
  success: boolean;
  error?: string;
}

interface BenchmarkSummary {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  averageWordsPerSecond: number;
  languagePairs: number;
  timestamp: string;
}

// Test texts of different lengths
const testTexts = {
  short: 'Hello, how are you today?', // ~5 words
  medium: 'The quick brown fox jumps over the lazy dog. This is a test sentence for translation performance measurement.', // ~20 words
  long: `Artificial intelligence is transforming the way we work and live. Machine learning algorithms can now process vast amounts of data and identify patterns that would be impossible for humans to detect manually. Natural language processing has made it possible for computers to understand and generate human language with remarkable accuracy. These technologies are being applied across industries, from healthcare to finance, from education to entertainment. As AI continues to advance, it is crucial that we develop ethical frameworks to ensure these powerful tools are used responsibly and for the benefit of all humanity.`, // ~100 words
};

// Supported languages
const languages = [
  'en', // English
  'hi', // Hindi
  'ta', // Tamil
  'te', // Telugu
  'kn', // Kannada
  'ml', // Malayalam
  'mr', // Marathi
  'gu', // Gujarati
  'bn', // Bengali
  'pa', // Punjabi
  'or', // Odia
  'as', // Assamese
  'ur', // Urdu
  'sa', // Sanskrit
];

async function runBenchmark(): Promise<void> {
  console.log('🚀 Starting Translation Benchmark...\n');

  // Initialize translation service
  await translationService.loadModel();

  const results: BenchmarkResult[] = [];
  const startTime = Date.now();

  // Test all language pairs
  for (const sourceLang of languages) {
    for (const targetLang of languages) {
      if (sourceLang === targetLang) continue;

      // Test with medium-length text
      const text = testTexts.medium;
      const wordCount = text.split(/\s+/).length;

      try {
        console.log(`Testing ${sourceLang} → ${targetLang}...`);

        const benchmarkStart = performance.now();
        const response = await translationService.translate({
          text,
          sourceLang: sourceLang as any,
          targetLang: targetLang as any,
        });
        const benchmarkEnd = performance.now();

        const duration = benchmarkEnd - benchmarkStart;
        const wordsPerSecond = (wordCount / duration) * 1000;

        results.push({
          sourceLang,
          targetLang,
          textLength: text.length,
          duration,
          wordsPerSecond,
          success: true,
        });

        console.log(
          `  ✓ ${duration.toFixed(2)}ms (${wordsPerSecond.toFixed(2)} words/sec)`
        );
      } catch (error) {
        console.log(`  ✗ Failed: ${error}`);
        results.push({
          sourceLang,
          targetLang,
          textLength: text.length,
          duration: 0,
          wordsPerSecond: 0,
          success: false,
          error: String(error),
        });
      }
    }
  }

  // Generate summary
  const successfulResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);

  const summary: BenchmarkSummary = {
    totalTests: results.length,
    successfulTests: successfulResults.length,
    failedTests: failedResults.length,
    averageDuration:
      successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + r.duration, 0) /
          successfulResults.length
        : 0,
    minDuration:
      successfulResults.length > 0
        ? Math.min(...successfulResults.map(r => r.duration))
        : 0,
    maxDuration:
      successfulResults.length > 0
        ? Math.max(...successfulResults.map(r => r.duration))
        : 0,
    averageWordsPerSecond:
      successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + r.wordsPerSecond, 0) /
          successfulResults.length
        : 0,
    languagePairs: new Set(results.map(r => `${r.sourceLang}-${r.targetLang}`))
      .size,
    timestamp: new Date().toISOString(),
  };

  // Print summary
  console.log('\n📊 Benchmark Summary\n');
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Successful: ${summary.successfulTests}`);
  console.log(`Failed: ${summary.failedTests}`);
  console.log(`Language Pairs: ${summary.languagePairs}`);
  console.log(`\nPerformance Metrics:`);
  console.log(`  Average Duration: ${summary.averageDuration.toFixed(2)}ms`);
  console.log(`  Min Duration: ${summary.minDuration.toFixed(2)}ms`);
  console.log(`  Max Duration: ${summary.maxDuration.toFixed(2)}ms`);
  console.log(
    `  Average Speed: ${summary.averageWordsPerSecond.toFixed(2)} words/sec`
  );

  // Save results to CSV
  const csvPath = path.join(__dirname, '../benchmark-results.csv');
  const csvContent = generateCSV(results, summary);
  fs.writeFileSync(csvPath, csvContent);
  console.log(`\n✅ Results saved to: ${csvPath}`);

  // Save summary to JSON
  const jsonPath = path.join(__dirname, '../benchmark-summary.json');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Summary saved to: ${jsonPath}`);

  // Performance check
  console.log('\n🎯 Performance Check:');
  if (summary.averageDuration < 3000) {
    console.log('✅ Average duration < 3000ms: PASS');
  } else {
    console.log('❌ Average duration < 3000ms: FAIL');
  }

  if (summary.failedTests === 0) {
    console.log('✅ All tests successful: PASS');
  } else {
    console.log(`❌ ${summary.failedTests} tests failed: FAIL`);
  }

  const endTime = Date.now();
  console.log(`\n⏱️  Total benchmark time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
}

function generateCSV(results: BenchmarkResult[], summary: BenchmarkSummary): string {
  let csv = 'Source Language,Target Language,Text Length,Duration (ms),Words/Second,Success,Error\n';

  for (const result of results) {
    csv += `${result.sourceLang},${result.targetLang},${result.textLength},${result.duration.toFixed(2)},${result.wordsPerSecond.toFixed(2)},${result.success},${result.error || ''}\n`;
  }

  csv += '\n\nSummary\n';
  csv += `Total Tests,${summary.totalTests}\n`;
  csv += `Successful,${summary.successfulTests}\n`;
  csv += `Failed,${summary.failedTests}\n`;
  csv += `Average Duration (ms),${summary.averageDuration.toFixed(2)}\n`;
  csv += `Min Duration (ms),${summary.minDuration.toFixed(2)}\n`;
  csv += `Max Duration (ms),${summary.maxDuration.toFixed(2)}\n`;
  csv += `Average Speed (words/sec),${summary.averageWordsPerSecond.toFixed(2)}\n`;
  csv += `Language Pairs,${summary.languagePairs}\n`;
  csv += `Timestamp,${summary.timestamp}\n`;

  return csv;
}

// Run benchmark
runBenchmark().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
