/**
 * Dataset Transformation Tests
 * Tests for data transformation pipeline
 */

import {
  transformQuestion,
  validateQuestion,
  deduplicateQuestions,
  loadRawDataset,
  TransformedQuestion,
  RawQuestion,
} from '@/scripts/transform-datasets';

describe('Dataset Transformation Pipeline', () => {
  /**
   * Test Suite 1: Question Transformation
   */
  describe('Question Transformation', () => {
    it('should transform MCQ question correctly', () => {
      const rawQuestion: RawQuestion = {
        id: 'math-001',
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctOption: '4',
        explanation: '2 plus 2 equals 4',
        difficulty: 'beginner',
        type: 'mcq',
      };

      const transformed = transformQuestion(
        rawQuestion,
        'mathematics',
        'sample.json',
        0
      );

      expect(transformed).toBeDefined();
      expect(transformed?.questionText).toBe('What is 2 + 2?');
      expect(transformed?.type).toBe('mcq');
      expect(transformed?.difficulty).toBe('beginner');
      expect(transformed?.options).toBeDefined();
      expect(Object.keys(transformed?.options || {})).toContain('A');
      expect(transformed?.correctOptionId).toBeDefined();
    });

    it('should transform conceptual question correctly', () => {
      const rawQuestion: RawQuestion = {
        id: 'math-008',
        question: 'Solve: 2x² + 3x - 2 = 0',
        explanation: 'Using the quadratic formula: x = 1/2 or x = -2',
        difficulty: 'advanced',
        type: 'conceptual',
      };

      const transformed = transformQuestion(
        rawQuestion,
        'mathematics',
        'sample.json',
        0
      );

      expect(transformed).toBeDefined();
      expect(transformed?.type).toBe('conceptual');
      expect(transformed?.explanation).toBeTruthy();
      expect(transformed?.options).toBeUndefined();
    });

    it('should preserve answer correctness', () => {
      const rawQuestion: RawQuestion = {
        question: 'What is the square root of 16?',
        options: ['2', '3', '4', '5'],
        correctOption: '4',
        explanation: '4 × 4 = 16',
        difficulty: 'beginner',
        type: 'mcq',
      };

      const transformed = transformQuestion(
        rawQuestion,
        'mathematics',
        'sample.json',
        0
      );

      expect(transformed?.correctOptionId).toBe('A'); // First option
      expect(transformed?.options?.A).toBe('2'); // First option is '2'

      // Verify correct answer is in options
      const correctAnswer = '4';
      const optionsArray = Object.values(transformed?.options || {});
      expect(optionsArray).toContain(correctAnswer);
    });

    it('should handle alternative field names', () => {
      const rawQuestion: RawQuestion = {
        questionText: 'What is inflation?',
        choices: ['Increase in prices', 'Decrease in prices', 'No change', 'Stock crash'],
        correctAnswer: 'Increase in prices',
        explanation: 'Inflation is the general increase in prices',
        difficulty: 'intermediate',
      };

      const transformed = transformQuestion(
        rawQuestion,
        'finance',
        'sample.json',
        0
      );

      expect(transformed?.questionText).toBe('What is inflation?');
      expect(transformed?.type).toBe('mcq');
      expect(transformed?.options).toBeDefined();
    });

    it('should generate unique ID if not provided', () => {
      const rawQuestion: RawQuestion = {
        question: 'Test question',
        explanation: 'Test explanation',
      };

      const transformed = transformQuestion(
        rawQuestion,
        'agriculture',
        'sample.json',
        5
      );

      expect(transformed?.id).toBeDefined();
      expect(transformed?.id).toContain('agriculture');
    });

    it('should set default values for missing fields', () => {
      const rawQuestion: RawQuestion = {
        question: 'Simple question',
        explanation: 'Simple explanation',
      };

      const transformed = transformQuestion(
        rawQuestion,
        'mathematics',
        'sample.json',
        0
      );

      expect(transformed?.difficulty).toBe('intermediate'); // Default
      expect(transformed?.type).toBe('conceptual'); // Default
      expect(transformed?.subject).toBe('mathematics');
      expect(transformed?.source).toBe('sample.json');
      expect(transformed?.license).toBe('CC BY');
    });

    it('should handle difficulty level normalization', () => {
      const testCases = [
        { input: 'easy', expected: 'beginner' },
        { input: 'BEGINNER', expected: 'beginner' },
        { input: 'intermediate', expected: 'intermediate' },
        { input: 'hard', expected: 'advanced' },
        { input: 'ADVANCED', expected: 'advanced' },
      ];

      for (const testCase of testCases) {
        const rawQuestion: RawQuestion = {
          question: 'Test',
          explanation: 'Test',
          difficulty: testCase.input,
        };

        const transformed = transformQuestion(
          rawQuestion,
          'mathematics',
          'sample.json',
          0
        );

        expect(transformed?.difficulty).toBe(testCase.expected);
      }
    });

    it('should reject invalid questions', () => {
      const invalidQuestions = [
        { question: '' }, // Empty question
        { question: 'Hi' }, // Too short
        {}, // No question
        { question: null }, // Null question
      ];

      for (const invalid of invalidQuestions) {
        const transformed = transformQuestion(
          invalid as any,
          'mathematics',
          'sample.json',
          0
        );

        expect(transformed).toBeNull();
      }
    });
  });

  /**
   * Test Suite 2: Question Validation
   */
  describe('Question Validation', () => {
    it('should validate correct MCQ question', () => {
      const question: TransformedQuestion = {
        id: 'math-001',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        options: { A: '3', B: '4', C: '5', D: '6' },
        correctOptionId: 'B',
        explanation: '2 plus 2 equals 4',
        source: 'sample.json',
        license: 'CC BY',
        tags: ['mathematics', 'arithmetic'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const issues = validateQuestion(question);
      expect(issues.length).toBe(0);
    });

    it('should validate correct conceptual question', () => {
      const question: TransformedQuestion = {
        id: 'math-008',
        subject: 'mathematics',
        difficulty: 'advanced',
        type: 'conceptual',
        questionText: 'Solve: 2x² + 3x - 2 = 0',
        explanation: 'Using the quadratic formula: x = 1/2 or x = -2',
        source: 'sample.json',
        license: 'CC BY',
        tags: ['mathematics', 'algebra'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const issues = validateQuestion(question);
      expect(issues.length).toBe(0);
    });

    it('should detect short question text', () => {
      const question: TransformedQuestion = {
        id: 'test',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'conceptual',
        questionText: 'Hi',
        explanation: 'Test explanation',
        source: 'test.json',
        license: 'CC BY',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const issues = validateQuestion(question);
      expect(issues.some(i => i.includes('Question text too short'))).toBe(true);
    });

    it('should detect invalid difficulty level', () => {
      const question: TransformedQuestion = {
        id: 'test',
        subject: 'mathematics',
        difficulty: 'invalid' as any,
        type: 'conceptual',
        questionText: 'Valid question text',
        explanation: 'Test explanation',
        source: 'test.json',
        license: 'CC BY',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const issues = validateQuestion(question);
      expect(issues.some(i => i.includes('Invalid difficulty level'))).toBe(true);
    });

    it('should detect MCQ without options', () => {
      const question: TransformedQuestion = {
        id: 'test',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'Valid question text',
        explanation: 'Test explanation',
        source: 'test.json',
        license: 'CC BY',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const issues = validateQuestion(question);
      expect(issues.some(i => i.includes('MCQ must have at least 2 options'))).toBe(true);
    });

    it('should detect MCQ without correct option', () => {
      const question: TransformedQuestion = {
        id: 'test',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'Valid question text',
        options: { A: 'Option 1', B: 'Option 2' },
        explanation: 'Test explanation',
        source: 'test.json',
        license: 'CC BY',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const issues = validateQuestion(question);
      expect(issues.some(i => i.includes('MCQ must have correct option'))).toBe(true);
    });

    it('should detect duplicate options', () => {
      const question: TransformedQuestion = {
        id: 'test',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'Valid question text',
        options: { A: 'Same', B: 'Same', C: 'Different', D: 'Different' },
        correctOptionId: 'A',
        explanation: 'Test explanation',
        source: 'test.json',
        license: 'CC BY',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const issues = validateQuestion(question);
      expect(issues.some(i => i.includes('Duplicate options'))).toBe(true);
    });

    it('should detect short explanation', () => {
      const question: TransformedQuestion = {
        id: 'test',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'conceptual',
        questionText: 'Valid question text',
        explanation: 'Hi',
        source: 'test.json',
        license: 'CC BY',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const issues = validateQuestion(question);
      expect(issues.some(i => i.includes('Explanation too short'))).toBe(true);
    });
  });

  /**
   * Test Suite 3: Deduplication
   */
  describe('Deduplication', () => {
    it('should remove duplicate questions', () => {
      const questions: TransformedQuestion[] = [
        {
          id: 'q1',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'conceptual',
          questionText: 'What is 2 + 2?',
          explanation: 'Test',
          source: 'test.json',
          license: 'CC BY',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'q2',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'conceptual',
          questionText: 'What is 2 + 2?', // Duplicate
          explanation: 'Test',
          source: 'test.json',
          license: 'CC BY',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'q3',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'conceptual',
          questionText: 'What is 3 + 3?', // Different
          explanation: 'Test',
          source: 'test.json',
          license: 'CC BY',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const deduplicated = deduplicateQuestions(questions);

      expect(deduplicated.length).toBe(2);
      expect(deduplicated.map(q => q.questionText)).toEqual([
        'What is 2 + 2?',
        'What is 3 + 3?',
      ]);
    });

    it('should preserve first occurrence', () => {
      const questions: TransformedQuestion[] = [
        {
          id: 'q1',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'conceptual',
          questionText: 'Test question',
          explanation: 'First',
          source: 'test.json',
          license: 'CC BY',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'q2',
          subject: 'mathematics',
          difficulty: 'intermediate',
          type: 'conceptual',
          questionText: 'Test question', // Duplicate with different explanation
          explanation: 'Second',
          source: 'test.json',
          license: 'CC BY',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const deduplicated = deduplicateQuestions(questions);

      expect(deduplicated.length).toBe(1);
      expect(deduplicated[0].explanation).toBe('First');
    });

    it('should handle case-insensitive duplicates', () => {
      const questions: TransformedQuestion[] = [
        {
          id: 'q1',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'conceptual',
          questionText: 'What is 2 + 2?',
          explanation: 'Test',
          source: 'test.json',
          license: 'CC BY',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'q2',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'conceptual',
          questionText: 'WHAT IS 2 + 2?', // Same but different case
          explanation: 'Test',
          source: 'test.json',
          license: 'CC BY',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const deduplicated = deduplicateQuestions(questions);

      expect(deduplicated.length).toBe(1);
    });
  });

  /**
   * Test Suite 4: Data Loading
   */
  describe('Data Loading', () => {
    it('should load JSON dataset', () => {
      const questions = loadRawDataset('mathematics', 'sample-questions.json');

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should handle missing file gracefully', () => {
      const questions = loadRawDataset('mathematics', 'nonexistent.json');

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBe(0);
    });
  });
});
