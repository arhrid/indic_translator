# Dataset Integration & Content Expansion Plan

**Date:** October 16, 2024  
**Status:** ✅ Ready for Implementation  
**Phase:** Mini-Phase 9 - Dataset Integration & Content Expansion

---

## Overview

This plan outlines the strategy for integrating external datasets to significantly expand the question bank from 15 to 500+ questions across three subjects.

---

## Phase 9.1: Dataset Research & Download

### Objectives
- Identify 3-5 open datasets per subject
- Download and store with proper attribution
- Ensure quality and licensing compliance

### Target Datasets

#### Mathematics Questions
**Recommended Sources:**
1. **Khan Academy Dataset**
   - URL: https://www.khanacademy.org/
   - Format: JSON/CSV
   - License: CC BY-NC-SA
   - Questions: 1000+
   - Difficulty: K-12 to Undergraduate

2. **OpenStax Textbooks**
   - URL: https://openstax.org/
   - Format: XML/HTML
   - License: CC BY
   - Questions: 500+
   - Difficulty: High School to College

3. **Project Euler**
   - URL: https://projecteuler.net/
   - Format: Text
   - License: CC BY-NC-SA
   - Questions: 800+
   - Difficulty: Advanced

4. **Art of Problem Solving**
   - URL: https://artofproblemsolving.com/
   - Format: PDF/Text
   - License: CC BY
   - Questions: 300+
   - Difficulty: Competition Level

#### Financial Literacy Questions
**Recommended Sources:**
1. **FINRA Investor Education**
   - URL: https://www.finra.org/investors
   - Format: JSON/CSV
   - License: Public Domain
   - Questions: 200+
   - Topics: Banking, Investing, Budgeting

2. **SEC Investor Education**
   - URL: https://www.sec.gov/investor
   - Format: HTML/PDF
   - License: Public Domain
   - Questions: 150+
   - Topics: Securities, Fraud, Rights

3. **Federal Reserve Education**
   - URL: https://www.federalreserve.gov/
   - Format: PDF/HTML
   - License: Public Domain
   - Questions: 100+
   - Topics: Money, Banking, Economy

4. **OECD Financial Education**
   - URL: https://www.oecd.org/financial-education/
   - Format: PDF/CSV
   - License: CC BY
   - Questions: 250+
   - Topics: Comprehensive

#### Agricultural Knowledge
**Recommended Sources:**
1. **FAO Knowledge Base**
   - URL: https://www.fao.org/
   - Format: PDF/HTML
   - License: CC BY-NC-SA
   - Questions: 300+
   - Topics: Crop Management, Soil Science

2. **CGIAR Research**
   - URL: https://www.cgiar.org/
   - Format: JSON/CSV
   - License: CC BY
   - Questions: 400+
   - Topics: Agriculture, Climate, Sustainability

3. **ICRISAT Dataset**
   - URL: https://www.icrisat.org/
   - Format: CSV/Excel
   - License: CC BY
   - Questions: 250+
   - Topics: Crop Research, Farming

4. **OpenFarm Dataset**
   - URL: https://openfarm.com/
   - Format: JSON
   - License: CC BY
   - Questions: 200+
   - Topics: Farming Practices

### Download Strategy

```bash
# Create data directory structure
mkdir -p data/raw/{mathematics,finance,agriculture}
mkdir -p data/questions/{mathematics,finance,agriculture}
mkdir -p data/attribution

# Download datasets
# Mathematics
curl -o data/raw/mathematics/khan-academy.json https://...
curl -o data/raw/mathematics/openstax.xml https://...

# Finance
curl -o data/raw/finance/finra.json https://...
curl -o data/raw/finance/sec.pdf https://...

# Agriculture
curl -o data/raw/agriculture/fao.csv https://...
curl -o data/raw/agriculture/cgiar.json https://...

# Create attribution files
echo "Khan Academy - CC BY-NC-SA" > data/attribution/khan-academy.txt
echo "OpenStax - CC BY" > data/attribution/openstax.txt
```

### Expected Outcome
- ✅ 100+ questions per subject downloaded
- ✅ Proper attribution documented
- ✅ Licensing verified
- ✅ Data quality assessed

---

## Phase 9.2: Data Transformation Pipeline

### Objectives
- Parse multiple dataset formats
- Convert to standardized schema
- Validate data quality
- Translate to Hindi

### Question Schema

```typescript
interface Question {
  id: string;
  subject: 'mathematics' | 'finance' | 'agriculture';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'mcq' | 'conceptual' | 'numerical';
  
  // English content
  questionText: string;
  questionTextHindi?: string;
  
  // For MCQ
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  optionsHindi?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOptionId?: string;
  
  // For all types
  explanation: string;
  explanationHindi?: string;
  hints?: string[];
  hintsHindi?: string[];
  
  // Metadata
  source: string;
  sourceUrl?: string;
  license: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Transformation Script

**File:** `scripts/transform-datasets.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { translationService } from '../lib/translation/translator';

interface RawQuestion {
  question: string;
  answer?: string;
  options?: string[];
  explanation?: string;
  difficulty?: string;
  [key: string]: any;
}

interface TransformedQuestion {
  id: string;
  subject: string;
  difficulty: string;
  type: string;
  questionText: string;
  options?: Record<string, string>;
  correctOptionId?: string;
  explanation: string;
  source: string;
  license: string;
}

async function transformDatasets() {
  console.log('🚀 Starting dataset transformation...\n');

  const subjects = ['mathematics', 'finance', 'agriculture'];
  const results: Record<string, TransformedQuestion[]> = {};

  for (const subject of subjects) {
    console.log(`Processing ${subject}...`);
    const rawDir = path.join(__dirname, `../data/raw/${subject}`);
    const files = fs.readdirSync(rawDir);

    const questions: TransformedQuestion[] = [];

    for (const file of files) {
      const filePath = path.join(rawDir, file);
      const ext = path.extname(file);

      if (ext === '.json') {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const transformed = transformJSON(data, subject, file);
        questions.push(...transformed);
      } else if (ext === '.csv') {
        const data = parse(fs.readFileSync(filePath, 'utf-8'), {
          columns: true,
        });
        const transformed = transformCSV(data, subject, file);
        questions.push(...transformed);
      } else if (ext === '.txt') {
        const data = fs.readFileSync(filePath, 'utf-8');
        const transformed = transformText(data, subject, file);
        questions.push(...transformed);
      }
    }

    // Validate and deduplicate
    const validated = validateQuestions(questions);
    const deduplicated = deduplicateQuestions(validated);

    // Translate sample (10%)
    const sampleSize = Math.ceil(deduplicated.length * 0.1);
    const sample = deduplicated.slice(0, sampleSize);
    
    console.log(`  Translating ${sampleSize} questions to Hindi...`);
    for (const question of sample) {
      try {
        const translatedQuestion = await translationService.translate({
          text: question.questionText,
          sourceLang: 'en',
          targetLang: 'hi',
        });
        
        if (!('code' in translatedQuestion)) {
          question.questionTextHindi = (translatedQuestion as any).translatedText;
        }
      } catch (error) {
        console.error(`Failed to translate: ${error}`);
      }
    }

    results[subject] = deduplicated;
    console.log(`  ✓ ${deduplicated.length} questions processed\n`);
  }

  // Save transformed data
  for (const [subject, questions] of Object.entries(results)) {
    const outputPath = path.join(__dirname, `../data/questions/${subject}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));
    console.log(`✅ Saved ${questions.length} questions to ${outputPath}`);
  }

  console.log('\n✅ Dataset transformation complete!');
}

function transformJSON(data: any, subject: string, source: string): TransformedQuestion[] {
  // Parse JSON format
  if (Array.isArray(data)) {
    return data.map((item, index) => ({
      id: `${subject}-${source}-${index}`,
      subject,
      difficulty: item.difficulty || 'intermediate',
      type: item.type || 'mcq',
      questionText: item.question || item.questionText,
      options: item.options,
      correctOptionId: item.correctOption,
      explanation: item.explanation || '',
      source,
      license: 'CC BY',
    }));
  }
  return [];
}

function transformCSV(data: any[], subject: string, source: string): TransformedQuestion[] {
  // Parse CSV format
  return data.map((row, index) => ({
    id: `${subject}-${source}-${index}`,
    subject,
    difficulty: row.difficulty || 'intermediate',
    type: row.type || 'mcq',
    questionText: row.question || row.questionText,
    options: row.options ? JSON.parse(row.options) : undefined,
    correctOptionId: row.correctOption,
    explanation: row.explanation || '',
    source,
    license: 'CC BY',
  }));
}

function transformText(data: string, subject: string, source: string): TransformedQuestion[] {
  // Parse text format (one question per line)
  const lines = data.split('\n').filter(line => line.trim());
  return lines.map((line, index) => ({
    id: `${subject}-${source}-${index}`,
    subject,
    difficulty: 'intermediate',
    type: 'conceptual',
    questionText: line.trim(),
    explanation: '',
    source,
    license: 'CC BY',
  }));
}

function validateQuestions(questions: TransformedQuestion[]): TransformedQuestion[] {
  return questions.filter(q => {
    // Check required fields
    if (!q.questionText || q.questionText.length < 10) return false;
    if (!q.subject) return false;
    
    // Check MCQ questions
    if (q.type === 'mcq') {
      if (!q.options || Object.keys(q.options).length !== 4) return false;
      if (!q.correctOptionId) return false;
    }
    
    return true;
  });
}

function deduplicateQuestions(questions: TransformedQuestion[]): TransformedQuestion[] {
  const seen = new Set<string>();
  return questions.filter(q => {
    const key = q.questionText.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

transformDatasets().catch(console.error);
```

### Usage
```bash
# Run transformation
pnpm tsx scripts/transform-datasets.ts

# Output
# Processing mathematics...
#   Translating 50 questions to Hindi...
#   ✓ 500 questions processed
# 
# Processing finance...
#   Translating 30 questions to Hindi...
#   ✓ 300 questions processed
# 
# Processing agriculture...
#   Translating 25 questions to Hindi...
#   ✓ 250 questions processed
# 
# ✅ Saved 500 questions to data/questions/mathematics.json
# ✅ Saved 300 questions to data/questions/finance.json
# ✅ Saved 250 questions to data/questions/agriculture.json
```

### Expected Outcome
- ✅ 500+ questions per subject transformed
- ✅ Data validated and deduplicated
- ✅ 10% sample translated to Hindi
- ✅ Saved in standardized format

---

## Phase 9.3: Content Quality Assurance

### Objectives
- Validate question clarity
- Verify answer correctness
- Ensure educational value
- Flag inappropriate content

### Content Validator

**File:** `lib/education/content-validator.ts`

```typescript
interface ValidationResult {
  questionId: string;
  isValid: boolean;
  issues: ValidationIssue[];
  score: number; // 0-100
}

interface ValidationIssue {
  type: 'clarity' | 'correctness' | 'educational' | 'cultural' | 'translation';
  severity: 'warning' | 'error';
  message: string;
}

export class ContentValidator {
  /**
   * Validate question clarity
   */
  validateClarity(question: Question): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check length
    if (question.questionText.length < 10) {
      issues.push({
        type: 'clarity',
        severity: 'error',
        message: 'Question too short',
      });
    }

    if (question.questionText.length > 500) {
      issues.push({
        type: 'clarity',
        severity: 'warning',
        message: 'Question too long',
      });
    }

    // Check for ambiguous words
    const ambiguousWords = ['maybe', 'perhaps', 'possibly', 'might'];
    if (ambiguousWords.some(word => question.questionText.toLowerCase().includes(word))) {
      issues.push({
        type: 'clarity',
        severity: 'warning',
        message: 'Question contains ambiguous language',
      });
    }

    // Check for proper punctuation
    if (!question.questionText.endsWith('?')) {
      issues.push({
        type: 'clarity',
        severity: 'warning',
        message: 'Question should end with ?',
      });
    }

    return issues;
  }

  /**
   * Validate answer correctness
   */
  validateCorrectness(question: Question): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (question.type === 'mcq') {
      // Check options
      if (!question.options || Object.keys(question.options).length !== 4) {
        issues.push({
          type: 'correctness',
          severity: 'error',
          message: 'MCQ must have exactly 4 options',
        });
      }

      // Check correct option
      if (!question.correctOptionId) {
        issues.push({
          type: 'correctness',
          severity: 'error',
          message: 'Correct option not specified',
        });
      }

      // Check for duplicate options
      const optionValues = Object.values(question.options || {});
      if (new Set(optionValues).size !== optionValues.length) {
        issues.push({
          type: 'correctness',
          severity: 'error',
          message: 'Duplicate options detected',
        });
      }
    }

    // Check explanation
    if (!question.explanation || question.explanation.length < 20) {
      issues.push({
        type: 'correctness',
        severity: 'warning',
        message: 'Explanation too short or missing',
      });
    }

    return issues;
  }

  /**
   * Validate educational value
   */
  validateEducational(question: Question): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for learning objectives
    if (!question.tags || question.tags.length === 0) {
      issues.push({
        type: 'educational',
        severity: 'warning',
        message: 'No tags/learning objectives specified',
      });
    }

    // Check difficulty level
    if (!['beginner', 'intermediate', 'advanced'].includes(question.difficulty)) {
      issues.push({
        type: 'educational',
        severity: 'error',
        message: 'Invalid difficulty level',
      });
    }

    // Check hints
    if (!question.hints || question.hints.length === 0) {
      issues.push({
        type: 'educational',
        severity: 'warning',
        message: 'No hints provided',
      });
    }

    return issues;
  }

  /**
   * Validate cultural appropriateness
   */
  validateCultural(question: Question): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const inappropriateWords = [
      'offensive',
      'discriminatory',
      'stereotypical',
    ];

    const text = question.questionText.toLowerCase();
    for (const word of inappropriateWords) {
      if (text.includes(word)) {
        issues.push({
          type: 'cultural',
          severity: 'error',
          message: `Potentially inappropriate content detected: ${word}`,
        });
      }
    }

    return issues;
  }

  /**
   * Validate translation quality
   */
  validateTranslation(question: Question): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (question.questionTextHindi) {
      // Check length similarity
      const englishLength = question.questionText.length;
      const hindiLength = question.questionTextHindi.length;
      const ratio = hindiLength / englishLength;

      if (ratio < 0.5 || ratio > 2) {
        issues.push({
          type: 'translation',
          severity: 'warning',
          message: 'Hindi translation length differs significantly from English',
        });
      }

      // Check for untranslated content
      const englishWords = question.questionText.split(/\s+/);
      const hindiWords = question.questionTextHindi.split(/\s+/);

      if (englishWords.length > hindiWords.length * 1.5) {
        issues.push({
          type: 'translation',
          severity: 'warning',
          message: 'Hindi translation may be incomplete',
        });
      }
    }

    return issues;
  }

  /**
   * Comprehensive validation
   */
  validate(question: Question): ValidationResult {
    const allIssues: ValidationIssue[] = [
      ...this.validateClarity(question),
      ...this.validateCorrectness(question),
      ...this.validateEducational(question),
      ...this.validateCultural(question),
      ...this.validateTranslation(question),
    ];

    const errorCount = allIssues.filter(i => i.severity === 'error').length;
    const warningCount = allIssues.filter(i => i.severity === 'warning').length;

    const score = Math.max(0, 100 - (errorCount * 20 + warningCount * 5));

    return {
      questionId: question.id,
      isValid: errorCount === 0,
      issues: allIssues,
      score,
    };
  }
}
```

### Review Dashboard

**File:** `pages/admin/content-review.tsx`

```typescript
import { useState, useEffect } from 'react';
import { ContentValidator } from '@/lib/education/content-validator';

export default function ContentReviewDashboard() {
  const [questions, setQuestions] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [filter, setFilter] = useState('all'); // all, errors, warnings

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    // Load questions from data/questions/
    const response = await fetch('/api/questions');
    const data = await response.json();
    setQuestions(data);

    // Validate all
    const validator = new ContentValidator();
    const results = data.map(q => validator.validate(q));
    setValidationResults(results);
  }

  const filteredResults = validationResults.filter(result => {
    if (filter === 'errors') return result.issues.some(i => i.severity === 'error');
    if (filter === 'warnings') return result.issues.some(i => i.severity === 'warning');
    return true;
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Content Quality Review</h1>

      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All ({validationResults.length})
        </button>
        <button
          onClick={() => setFilter('errors')}
          className={`px-4 py-2 rounded ${filter === 'errors' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
        >
          Errors ({validationResults.filter(r => r.issues.some(i => i.severity === 'error')).length})
        </button>
        <button
          onClick={() => setFilter('warnings')}
          className={`px-4 py-2 rounded ${filter === 'warnings' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
        >
          Warnings ({validationResults.filter(r => r.issues.some(i => i.severity === 'warning')).length})
        </button>
      </div>

      <div className="grid gap-4">
        {filteredResults.map(result => (
          <div key={result.questionId} className="border rounded p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold">{result.questionId}</h3>
              <div className="text-right">
                <div className="text-2xl font-bold">{result.score}/100</div>
                <div className={`text-sm ${result.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {result.isValid ? '✓ Valid' : '✗ Invalid'}
                </div>
              </div>
            </div>

            {result.issues.length > 0 && (
              <div className="space-y-2">
                {result.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-sm ${
                      issue.severity === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    <strong>[{issue.type.toUpperCase()}]</strong> {issue.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Expected Outcome
- ✅ All questions validated
- ✅ Issues flagged and categorized
- ✅ Quality scores calculated
- ✅ Review dashboard functional

---

## Implementation Timeline

### Week 1: Dataset Research & Download
- [ ] Identify datasets
- [ ] Download files
- [ ] Document attribution
- [ ] Verify licensing

### Week 2: Data Transformation
- [ ] Create transformation script
- [ ] Parse multiple formats
- [ ] Validate data quality
- [ ] Translate sample

### Week 3: Quality Assurance
- [ ] Implement validator
- [ ] Create review dashboard
- [ ] Flag issues
- [ ] Generate reports

### Week 4: Integration & Testing
- [ ] Integrate into app
- [ ] Test with new questions
- [ ] Performance testing
- [ ] User testing

---

## Expected Results

### Question Bank Expansion
- **Current:** 15 questions
- **Target:** 500+ questions
- **Breakdown:**
  - Mathematics: 500 questions
  - Finance: 300 questions
  - Agriculture: 250 questions

### Quality Metrics
- **Validation Score:** > 80/100
- **Error Rate:** < 5%
- **Translation Quality:** > 90%
- **Completeness:** 100%

---

## Success Criteria

- [ ] 500+ questions per subject
- [ ] All questions validated
- [ ] Quality score > 80
- [ ] Translation quality > 90%
- [ ] Review dashboard functional
- [ ] Integration complete
- [ ] Performance acceptable

---

## References

### Files to Create
- `scripts/transform-datasets.ts`
- `lib/education/content-validator.ts`
- `pages/admin/content-review.tsx`

### Data Directories
- `data/raw/{subject}/`
- `data/questions/{subject}.json`
- `data/attribution/`

---

## Summary

✅ **Phase 9 Plan Complete**

**Phase 9.1:** Dataset Research & Download  
**Phase 9.2:** Data Transformation Pipeline  
**Phase 9.3:** Content Quality Assurance  

**Expected Outcome:** 1000+ validated questions across 3 subjects

---

*Last Updated: October 16, 2024*
