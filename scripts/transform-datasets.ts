/**
 * Dataset Transformation Pipeline
 * Converts raw datasets to standardized question schema
 * Supports multiple formats: JSON, CSV, TXT
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Question Schema
 */
interface RawQuestion {
  [key: string]: any;
  question?: string;
  questionText?: string;
  answer?: string;
  correctAnswer?: string;
  correctOption?: string;
  options?: string[] | Record<string, string>;
  explanation?: string;
  difficulty?: string;
  type?: string;
}

interface TransformedQuestion {
  id: string;
  subject: 'mathematics' | 'finance' | 'agriculture';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'mcq' | 'conceptual' | 'numerical';
  questionText: string;
  questionTextHindi?: string;
  options?: Record<string, string>;
  optionsHindi?: Record<string, string>;
  correctOptionId?: string;
  explanation: string;
  explanationHindi?: string;
  hints?: string[];
  hintsHindi?: string[];
  source: string;
  sourceUrl?: string;
  license: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface TransformationResult {
  subject: string;
  totalProcessed: number;
  totalValid: number;
  totalDuplicate: number;
  totalTransformed: number;
  errors: string[];
}

/**
 * Load raw dataset from file
 */
function loadRawDataset(subject: string, filename: string): RawQuestion[] {
  const filePath = path.join(__dirname, `../data/raw/${subject}/${filename}`);

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }

  const ext = path.extname(filename);
  const content = fs.readFileSync(filePath, 'utf-8');

  if (ext === '.json') {
    return JSON.parse(content);
  } else if (ext === '.csv') {
    return parse(content, { columns: true });
  } else if (ext === '.txt') {
    return content
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => ({
        question: line.trim(),
        id: `${subject}-txt-${index}`,
      }));
  }

  return [];
}

/**
 * Transform single question to standardized schema
 */
function transformQuestion(
  raw: RawQuestion,
  subject: string,
  source: string,
  index: number
): TransformedQuestion | null {
  try {
    // Extract question text
    const questionText =
      raw.question || raw.questionText || raw.q || raw.text || '';

    if (!questionText || questionText.length < 5) {
      console.warn(`Invalid question text: ${questionText}`);
      return null;
    }

    // Determine question type
    let type: 'mcq' | 'conceptual' | 'numerical' = 'conceptual';
    if (raw.type) {
      type = raw.type.toLowerCase() as any;
    } else if (raw.options || raw.choices) {
      type = 'mcq';
    }

    // Extract options for MCQ
    let options: Record<string, string> | undefined;
    let correctOptionId: string | undefined;

    if (type === 'mcq') {
      const rawOptions = raw.options || raw.choices || [];

      if (Array.isArray(rawOptions)) {
        options = {};
        const optionKeys = ['A', 'B', 'C', 'D'];

        for (let i = 0; i < Math.min(rawOptions.length, 4); i++) {
          options[optionKeys[i]] = rawOptions[i];
        }
      } else if (typeof rawOptions === 'object') {
        options = rawOptions;
      }

      // Extract correct answer
      const correctAnswer =
        raw.correctAnswer ||
        raw.answer ||
        raw.correctOption ||
        raw.correct ||
        raw.solution;

      if (correctAnswer) {
        // Find which option matches the correct answer
        if (options) {
          for (const [key, value] of Object.entries(options)) {
            if (value === correctAnswer || value.includes(correctAnswer)) {
              correctOptionId = key;
              break;
            }
          }
        }

        // If not found, set as text
        if (!correctOptionId) {
          correctOptionId = correctAnswer.toString();
        }
      }
    }

    // Extract difficulty
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    if (raw.difficulty) {
      const diff = raw.difficulty.toLowerCase();
      if (diff.includes('beginner') || diff.includes('easy')) {
        difficulty = 'beginner';
      } else if (diff.includes('advanced') || diff.includes('hard')) {
        difficulty = 'advanced';
      }
    }

    // Extract explanation
    const explanation =
      raw.explanation ||
      raw.explain ||
      raw.solution ||
      raw.answer_explanation ||
      '';

    // Extract hints
    const hints = raw.hints || raw.tips || [];

    // Extract tags
    const tags = raw.tags || raw.keywords || [];
    if (!tags.includes(subject)) {
      tags.push(subject);
    }

    // Generate ID
    const id = raw.id || `${subject}-${source}-${index}`;

    return {
      id,
      subject: subject as any,
      difficulty,
      type,
      questionText,
      options,
      correctOptionId,
      explanation,
      hints: Array.isArray(hints) ? hints : [],
      source,
      license: 'CC BY',
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error(`Error transforming question:`, error);
    return null;
  }
}

/**
 * Validate question
 */
function validateQuestion(question: TransformedQuestion): string[] {
  const issues: string[] = [];

  // Check required fields
  if (!question.questionText || question.questionText.length < 5) {
    issues.push('Question text too short');
  }

  if (!question.subject) {
    issues.push('Subject missing');
  }

  if (!['beginner', 'intermediate', 'advanced'].includes(question.difficulty)) {
    issues.push('Invalid difficulty level');
  }

  if (!['mcq', 'conceptual', 'numerical'].includes(question.type)) {
    issues.push('Invalid question type');
  }

  // Check MCQ questions
  if (question.type === 'mcq') {
    if (!question.options || Object.keys(question.options).length < 2) {
      issues.push('MCQ must have at least 2 options');
    }

    if (!question.correctOptionId) {
      issues.push('MCQ must have correct option specified');
    }

    // Check for duplicate options
    if (question.options) {
      const optionValues = Object.values(question.options);
      if (new Set(optionValues).size !== optionValues.length) {
        issues.push('Duplicate options detected');
      }
    }
  }

  // Check explanation
  if (!question.explanation || question.explanation.length < 5) {
    issues.push('Explanation too short or missing');
  }

  return issues;
}

/**
 * Deduplicate questions
 */
function deduplicateQuestions(
  questions: TransformedQuestion[]
): TransformedQuestion[] {
  const seen = new Set<string>();
  const deduplicated: TransformedQuestion[] = [];
  let duplicateCount = 0;

  for (const question of questions) {
    const key = question.questionText.toLowerCase().trim();

    if (seen.has(key)) {
      duplicateCount++;
      console.warn(`Duplicate question detected: ${question.questionText}`);
    } else {
      seen.add(key);
      deduplicated.push(question);
    }
  }

  console.log(`Removed ${duplicateCount} duplicate questions`);
  return deduplicated;
}

/**
 * Transform dataset for a subject
 */
async function transformSubjectDataset(
  subject: 'mathematics' | 'finance' | 'agriculture'
): Promise<TransformationResult> {
  console.log(`\n📚 Processing ${subject}...`);

  const result: TransformationResult = {
    subject,
    totalProcessed: 0,
    totalValid: 0,
    totalDuplicate: 0,
    totalTransformed: 0,
    errors: [],
  };

  const rawDir = path.join(__dirname, `../data/raw/${subject}`);

  if (!fs.existsSync(rawDir)) {
    result.errors.push(`Directory not found: ${rawDir}`);
    return result;
  }

  const files = fs.readdirSync(rawDir);
  const allQuestions: TransformedQuestion[] = [];

  for (const file of files) {
    const ext = path.extname(file);
    if (!['.json', '.csv', '.txt'].includes(ext)) {
      continue;
    }

    console.log(`  Processing ${file}...`);

    try {
      const rawQuestions = loadRawDataset(subject, file);
      result.totalProcessed += rawQuestions.length;

      for (let i = 0; i < rawQuestions.length; i++) {
        const transformed = transformQuestion(
          rawQuestions[i],
          subject,
          file,
          i
        );

        if (!transformed) {
          continue;
        }

        // Validate
        const validationIssues = validateQuestion(transformed);

        if (validationIssues.length > 0) {
          console.warn(
            `  ⚠️  Question ${transformed.id} has issues:`,
            validationIssues
          );
          result.errors.push(
            `${transformed.id}: ${validationIssues.join(', ')}`
          );
          continue;
        }

        allQuestions.push(transformed);
        result.totalValid++;
      }
    } catch (error) {
      const errorMsg = `Error processing ${file}: ${error}`;
      console.error(`  ❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }
  }

  // Deduplicate
  const deduplicated = deduplicateQuestions(allQuestions);
  result.totalDuplicate = allQuestions.length - deduplicated.length;
  result.totalTransformed = deduplicated.length;

  // Save transformed data
  const outputPath = path.join(
    __dirname,
    `../data/questions/${subject}.json`
  );
  fs.writeFileSync(outputPath, JSON.stringify(deduplicated, null, 2));

  console.log(`  ✅ Saved ${deduplicated.length} questions to ${outputPath}`);

  return result;
}

/**
 * Main transformation pipeline
 */
async function transformDatasets() {
  console.log('🚀 Starting dataset transformation pipeline...\n');

  const subjects: Array<'mathematics' | 'finance' | 'agriculture'> = [
    'mathematics',
    'finance',
    'agriculture',
  ];

  const results: TransformationResult[] = [];
  let totalQuestions = 0;
  let totalErrors = 0;

  for (const subject of subjects) {
    const result = await transformSubjectDataset(subject);
    results.push(result);
    totalQuestions += result.totalTransformed;
    totalErrors += result.errors.length;
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TRANSFORMATION SUMMARY');
  console.log('='.repeat(60));

  for (const result of results) {
    console.log(`\n${result.subject.toUpperCase()}`);
    console.log(`  Processed: ${result.totalProcessed}`);
    console.log(`  Valid: ${result.totalValid}`);
    console.log(`  Duplicates Removed: ${result.totalDuplicate}`);
    console.log(`  Transformed: ${result.totalTransformed}`);

    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
      result.errors.slice(0, 3).forEach(error => {
        console.log(`    - ${error}`);
      });
      if (result.errors.length > 3) {
        console.log(`    ... and ${result.errors.length - 3} more`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ TOTAL QUESTIONS TRANSFORMED: ${totalQuestions}`);
  console.log(`⚠️  TOTAL ERRORS: ${totalErrors}`);
  console.log('='.repeat(60));

  // Create summary report
  const report = {
    timestamp: new Date().toISOString(),
    totalQuestions,
    totalErrors,
    results,
  };

  const reportPath = path.join(__dirname, '../data/transformation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to ${reportPath}`);

  return report;
}

/**
 * Export for testing
 */
export {
  transformQuestion,
  validateQuestion,
  deduplicateQuestions,
  loadRawDataset,
  transformSubjectDataset,
  TransformedQuestion,
  RawQuestion,
};

// Run if executed directly
if (require.main === module) {
  transformDatasets()
    .then(() => {
      console.log('\n✨ Transformation complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Transformation failed:', error);
      process.exit(1);
    });
}
