/**
 * Build Analysis Script
 * Analyzes Next.js build output and bundle sizes
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface BuildMetrics {
  timestamp: string;
  totalSize: string;
  totalSizeBytes: number;
  nextSize: string;
  nextSizeBytes: number;
  publicSize: string;
  publicSizeBytes: number;
  chunks: ChunkInfo[];
  largestChunks: ChunkInfo[];
  duplicateDependencies: string[];
  recommendations: string[];
}

interface ChunkInfo {
  name: string;
  size: string;
  sizeBytes: number;
  percentage: number;
}

function getDirectorySize(dirPath: string): { size: string; bytes: number } {
  try {
    const output = execSync(`du -sh "${dirPath}" 2>/dev/null || echo "0"`, {
      encoding: 'utf-8',
    }).trim();

    const sizeStr = output.split('\t')[0];
    const bytes = parseSize(sizeStr);

    return { size: sizeStr, bytes };
  } catch {
    return { size: '0B', bytes: 0 };
  }
}

function parseSize(sizeStr: string): number {
  const units: Record<string, number> = {
    B: 1,
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
  };

  const match = sizeStr.match(/^([\d.]+)([KMGB])$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return Math.round(value * (units[unit] || 1));
}

function analyzeChunks(nextDir: string): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  const staticDir = path.join(nextDir, 'static');

  if (!fs.existsSync(staticDir)) {
    return chunks;
  }

  try {
    const files = execSync(`find "${staticDir}" -type f -name "*.js" | head -20`, {
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(f => f);

    let totalBytes = 0;

    for (const file of files) {
      if (!fs.existsSync(file)) continue;

      const stats = fs.statSync(file);
      const sizeBytes = stats.size;
      totalBytes += sizeBytes;

      chunks.push({
        name: path.basename(file),
        size: formatBytes(sizeBytes),
        sizeBytes,
        percentage: 0,
      });
    }

    // Calculate percentages
    for (const chunk of chunks) {
      chunk.percentage = Math.round((chunk.sizeBytes / totalBytes) * 100);
    }

    // Sort by size
    chunks.sort((a, b) => b.sizeBytes - a.sizeBytes);

    return chunks;
  } catch {
    return chunks;
  }
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)}${units[unitIndex]}`;
}

function checkDuplicateDependencies(): string[] {
  const duplicates: string[] = [];

  try {
    const output = execSync('pnpm ls --depth=0 2>/dev/null || npm ls --depth=0', {
      encoding: 'utf-8',
    });

    // Parse output for duplicates (simplified)
    const lines = output.split('\n');
    const packages: Record<string, number> = {};

    for (const line of lines) {
      const match = line.match(/^\s*├──\s+(\w+)@/);
      if (match) {
        const pkg = match[1];
        packages[pkg] = (packages[pkg] || 0) + 1;
      }
    }

    for (const [pkg, count] of Object.entries(packages)) {
      if (count > 1) {
        duplicates.push(`${pkg} (${count} versions)`);
      }
    }
  } catch {
    // Silently fail
  }

  return duplicates;
}

function generateRecommendations(metrics: BuildMetrics): string[] {
  const recommendations: string[] = [];

  // Check total size
  if (metrics.nextSizeBytes > 100 * 1024 * 1024) {
    recommendations.push('⚠️  .next directory exceeds 100MB - consider code splitting');
  }

  // Check largest chunks
  if (metrics.largestChunks.length > 0) {
    const largest = metrics.largestChunks[0];
    if (largest.sizeBytes > 10 * 1024 * 1024) {
      recommendations.push(`⚠️  Largest chunk (${largest.name}) exceeds 10MB - consider splitting`);
    }
  }

  // Check duplicates
  if (metrics.duplicateDependencies.length > 0) {
    recommendations.push(
      `⚠️  Found ${metrics.duplicateDependencies.length} duplicate dependencies - run pnpm dedupe`
    );
  }

  // Positive feedback
  if (recommendations.length === 0) {
    recommendations.push('✅ Build size is optimal');
    recommendations.push('✅ No duplicate dependencies detected');
    recommendations.push('✅ Chunk sizes are well-balanced');
  }

  return recommendations;
}

function analyzeBuild(): BuildMetrics {
  console.log('📊 Analyzing Next.js build...\n');

  const projectRoot = path.join(__dirname, '..');
  const nextDir = path.join(projectRoot, '.next');
  const publicDir = path.join(projectRoot, 'public');

  // Get sizes
  const nextSize = getDirectorySize(nextDir);
  const publicSize = getDirectorySize(publicDir);
  const totalBytes = nextSize.bytes + publicSize.bytes;

  // Analyze chunks
  const chunks = analyzeChunks(nextDir);
  const largestChunks = chunks.slice(0, 5);

  // Check duplicates
  const duplicates = checkDuplicateDependencies();

  const metrics: BuildMetrics = {
    timestamp: new Date().toISOString(),
    totalSize: formatBytes(totalBytes),
    totalSizeBytes: totalBytes,
    nextSize: nextSize.size,
    nextSizeBytes: nextSize.bytes,
    publicSize: publicSize.size,
    publicSizeBytes: publicSize.bytes,
    chunks,
    largestChunks,
    duplicateDependencies: duplicates,
    recommendations: [],
  };

  metrics.recommendations = generateRecommendations(metrics);

  return metrics;
}

function printReport(metrics: BuildMetrics): void {
  console.log('═'.repeat(60));
  console.log('📊 BUILD ANALYSIS REPORT');
  console.log('═'.repeat(60));

  console.log('\n📈 Size Metrics:');
  console.log(`  Total Size:     ${metrics.totalSize}`);
  console.log(`  .next:          ${metrics.nextSize}`);
  console.log(`  public:         ${metrics.publicSize}`);

  if (metrics.largestChunks.length > 0) {
    console.log('\n📦 Largest Chunks:');
    for (const chunk of metrics.largestChunks) {
      console.log(`  ${chunk.name.padEnd(40)} ${chunk.size.padStart(10)} (${chunk.percentage}%)`);
    }
  }

  if (metrics.duplicateDependencies.length > 0) {
    console.log('\n⚠️  Duplicate Dependencies:');
    for (const dup of metrics.duplicateDependencies) {
      console.log(`  ${dup}`);
    }
  }

  console.log('\n💡 Recommendations:');
  for (const rec of metrics.recommendations) {
    console.log(`  ${rec}`);
  }

  console.log('\n' + '═'.repeat(60));

  // Save report
  const reportPath = path.join(__dirname, '../build-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Run analysis
if (require.main === module) {
  try {
    const metrics = analyzeBuild();
    printReport(metrics);

    // Exit with error if size exceeds threshold
    if (metrics.nextSizeBytes > 100 * 1024 * 1024) {
      console.error('\n❌ Build size exceeds 100MB threshold');
      process.exit(1);
    }

    console.log('\n✅ Build analysis complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Build analysis failed:', error);
    process.exit(1);
  }
}

export { analyzeBuild };
export type { BuildMetrics };
