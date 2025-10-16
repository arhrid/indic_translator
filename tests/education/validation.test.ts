/**
 * Question Validation Tests
 * Tests for lib/education/validation.ts
 */

import {
  validateQuestionSchema,
  validateQuestionSchemaDetailed,
  validateQuestionsArray,
  validateAnswer,
  validateUserProgress,
  formatValidationErrors,
} from '@/lib/education/validation';
import {
  MCQQuestion,
  ConceptualQuestion,
  NumericalQuestion,
} from '@/lib/education/question-types';

describe('Question Schema Validation', () => {
  /**
   * Test Suite 1: MCQ Validation
   */
  describe('MCQ Question Validation', () => {
    const validMCQ: MCQQuestion = {
      id: 'mcq-001',
      type: 'mcq',
      subject: 'mathematics',
      difficulty: 'beginner',
      questionText: 'What is 2 + 2?',
      options: [
        { id: 'opt-1', text: '3', isCorrect: false },
        { id: 'opt-2', text: '4', isCorrect: true },
        { id: 'opt-3', text: '5', isCorrect: false },
      ],
      correctOptionId: 'opt-2',
      explanation: 'The sum of 2 and 2 is 4.',
      tags: ['addition', 'basic'],
      prerequisites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate correct MCQ question', () => {
      expect(validateQuestionSchema(validMCQ)).toBe(true);
    });

    it('should reject MCQ with missing options', () => {
      const invalid = { ...validMCQ, options: [] };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject MCQ with invalid option ID', () => {
      const invalid = {
        ...validMCQ,
        correctOptionId: 'invalid-id',
      };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject MCQ with no correct answer', () => {
      const invalid = {
        ...validMCQ,
        options: [
          { id: 'opt-1', text: '3', isCorrect: false },
          { id: 'opt-2', text: '4', isCorrect: false },
        ],
      };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject MCQ with multiple correct answers', () => {
      const invalid = {
        ...validMCQ,
        options: [
          { id: 'opt-1', text: '3', isCorrect: true },
          { id: 'opt-2', text: '4', isCorrect: true },
        ],
      };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should provide detailed error messages', () => {
      const invalid = { ...validMCQ, options: [] };
      const result = validateQuestionSchemaDetailed(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBeTruthy();
      expect(result.errors[0].message).toBeTruthy();
    });
  });

  /**
   * Test Suite 2: Conceptual Validation
   */
  describe('Conceptual Question Validation', () => {
    const validConceptual: ConceptualQuestion = {
      id: 'con-001',
      type: 'conceptual',
      subject: 'mathematics',
      difficulty: 'intermediate',
      questionText: 'Explain prime numbers',
      hints: [
        { level: 1, text: 'Divisible by 1 and itself' },
        { level: 2, text: 'Examples: 2, 3, 5, 7' },
        { level: 3, text: '2 is the only even prime' },
      ],
      acceptableAnswers: [
        'A number divisible only by 1 and itself',
        'Numbers like 2, 3, 5, 7, 11',
      ],
      keyPoints: [
        'Greater than 1',
        'Exactly two divisors',
        'Examples: 2, 3, 5, 7, 11',
      ],
      explanation: 'Prime numbers are natural numbers greater than 1...',
      tags: ['primes', 'number-theory'],
      prerequisites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate correct conceptual question', () => {
      expect(validateQuestionSchema(validConceptual)).toBe(true);
    });

    it('should reject conceptual without hints', () => {
      const invalid = { ...validConceptual, hints: [] };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject conceptual without acceptable answers', () => {
      const invalid = { ...validConceptual, acceptableAnswers: [] };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject conceptual without key points', () => {
      const invalid = { ...validConceptual, keyPoints: [] };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should validate all hint levels', () => {
      const result = validateQuestionSchemaDetailed(validConceptual);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid hint levels', () => {
      const invalid = {
        ...validConceptual,
        hints: [{ level: 4, text: 'Invalid level' }],
      };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });
  });

  /**
   * Test Suite 3: Numerical Validation
   */
  describe('Numerical Question Validation', () => {
    const validNumerical: NumericalQuestion = {
      id: 'num-001',
      type: 'numerical',
      subject: 'mathematics',
      difficulty: 'intermediate',
      questionText: 'What is 8 × 5?',
      correctAnswer: 40,
      tolerance: 0,
      unit: 'units',
      formula: 'length × width',
      explanation: 'Multiplication of 8 and 5 equals 40.',
      tags: ['multiplication'],
      prerequisites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate correct numerical question', () => {
      expect(validateQuestionSchema(validNumerical)).toBe(true);
    });

    it('should reject numerical with non-numeric answer', () => {
      const invalid = { ...validNumerical, correctAnswer: 'forty' };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject numerical with negative tolerance', () => {
      const invalid = { ...validNumerical, tolerance: -1 };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should accept zero tolerance', () => {
      const question = { ...validNumerical, tolerance: 0 };
      expect(validateQuestionSchema(question)).toBe(true);
    });

    it('should accept positive tolerance', () => {
      const question = { ...validNumerical, tolerance: 0.5 };
      expect(validateQuestionSchema(question)).toBe(true);
    });
  });

  /**
   * Test Suite 4: Base Question Validation
   */
  describe('Base Question Validation', () => {
    const validMCQ: MCQQuestion = {
      id: 'mcq-001',
      type: 'mcq',
      subject: 'mathematics',
      difficulty: 'beginner',
      questionText: 'What is 2 + 2?',
      options: [
        { id: 'opt-1', text: '3', isCorrect: false },
        { id: 'opt-2', text: '4', isCorrect: true },
      ],
      correctOptionId: 'opt-2',
      explanation: 'The answer is 4.',
      tags: ['addition'],
      prerequisites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should reject question without ID', () => {
      const invalid = { ...validMCQ, id: '' };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject question with invalid type', () => {
      const invalid = { ...validMCQ, type: 'invalid' };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject question with invalid subject', () => {
      const invalid = { ...validMCQ, subject: 'physics' };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject question with invalid difficulty', () => {
      const invalid = { ...validMCQ, difficulty: 'expert' };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject question without text', () => {
      const invalid = { ...validMCQ, questionText: '' };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject question without explanation', () => {
      const invalid = { ...validMCQ, explanation: '' };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should reject question without tags', () => {
      const invalid = { ...validMCQ, tags: [] };
      expect(validateQuestionSchema(invalid)).toBe(false);
    });

    it('should accept optional Hindi fields', () => {
      const question = {
        ...validMCQ,
        questionTextHindi: 'क्या है 2 + 2?',
        explanationHindi: 'उत्तर 4 है।',
      };
      expect(validateQuestionSchema(question)).toBe(true);
    });

    it('should accept optional prerequisites', () => {
      const question = {
        ...validMCQ,
        prerequisites: ['basic-math'],
      };
      expect(validateQuestionSchema(question)).toBe(true);
    });
  });

  /**
   * Test Suite 5: Array Validation
   */
  describe('Questions Array Validation', () => {
    const validQuestions = [
      {
        id: 'mcq-001',
        type: 'mcq',
        subject: 'mathematics',
        difficulty: 'beginner',
        questionText: 'What is 2 + 2?',
        options: [
          { id: 'opt-1', text: '3', isCorrect: false },
          { id: 'opt-2', text: '4', isCorrect: true },
        ],
        correctOptionId: 'opt-2',
        explanation: 'The answer is 4.',
        tags: ['addition'],
        prerequisites: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'mcq-002',
        type: 'mcq',
        subject: 'mathematics',
        difficulty: 'beginner',
        questionText: 'What is 3 + 3?',
        options: [
          { id: 'opt-1', text: '5', isCorrect: false },
          { id: 'opt-2', text: '6', isCorrect: true },
        ],
        correctOptionId: 'opt-2',
        explanation: 'The answer is 6.',
        tags: ['addition'],
        prerequisites: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should validate array of valid questions', () => {
      const result = validateQuestionsArray(validQuestions);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject non-array input', () => {
      const result = validateQuestionsArray({} as any);
      expect(result.valid).toBe(false);
    });

    it('should report errors for invalid questions in array', () => {
      const invalid = [
        validQuestions[0],
        { ...validQuestions[1], options: [] },
      ];
      const result = validateQuestionsArray(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should identify which question has errors', () => {
      const invalid = [
        validQuestions[0],
        { ...validQuestions[1], id: '' },
      ];
      const result = validateQuestionsArray(invalid);
      expect(result.errors.some(e => e.field.includes('questions[1]'))).toBe(true);
    });
  });

  /**
   * Test Suite 6: Answer Validation
   */
  describe('Answer Validation', () => {
    const mcqQuestion: MCQQuestion = {
      id: 'mcq-001',
      type: 'mcq',
      subject: 'mathematics',
      difficulty: 'beginner',
      questionText: 'What is 2 + 2?',
      options: [
        { id: 'opt-1', text: '3', isCorrect: false },
        { id: 'opt-2', text: '4', isCorrect: true },
      ],
      correctOptionId: 'opt-2',
      explanation: 'The answer is 4.',
      tags: ['addition'],
      prerequisites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const numericalQuestion: NumericalQuestion = {
      id: 'num-001',
      type: 'numerical',
      subject: 'mathematics',
      difficulty: 'beginner',
      questionText: 'What is 2 + 2?',
      correctAnswer: 4,
      tolerance: 0,
      explanation: 'The answer is 4.',
      tags: ['addition'],
      prerequisites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const conceptualQuestion: ConceptualQuestion = {
      id: 'con-001',
      type: 'conceptual',
      subject: 'mathematics',
      difficulty: 'beginner',
      questionText: 'What is addition?',
      hints: [{ level: 1, text: 'Combining numbers' }],
      acceptableAnswers: ['Combining numbers', 'Putting together'],
      keyPoints: ['Combining', 'Sum'],
      explanation: 'Addition is combining numbers.',
      tags: ['addition'],
      prerequisites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate MCQ answer with valid option ID', () => {
      const result = validateAnswer(mcqQuestion, 'opt-2');
      expect(result.valid).toBe(true);
    });

    it('should reject MCQ answer with invalid option ID', () => {
      const result = validateAnswer(mcqQuestion, 'invalid-id');
      expect(result.valid).toBe(false);
    });

    it('should reject MCQ answer with non-string value', () => {
      const result = validateAnswer(mcqQuestion, 123 as any);
      expect(result.valid).toBe(false);
    });

    it('should validate numerical answer with number', () => {
      const result = validateAnswer(numericalQuestion, 4);
      expect(result.valid).toBe(true);
    });

    it('should reject numerical answer with non-number', () => {
      const result = validateAnswer(numericalQuestion, 'four' as any);
      expect(result.valid).toBe(false);
    });

    it('should validate conceptual answer with string', () => {
      const result = validateAnswer(conceptualQuestion, 'Combining numbers');
      expect(result.valid).toBe(true);
    });

    it('should reject conceptual answer with empty string', () => {
      const result = validateAnswer(conceptualQuestion, '');
      expect(result.valid).toBe(false);
    });
  });

  /**
   * Test Suite 7: User Progress Validation
   */
  describe('User Progress Validation', () => {
    const validProgress = {
      userId: 'user-123',
      subject: 'mathematics',
      totalAttempts: 10,
      correctAttempts: 8,
      successRate: 80,
      averageTimeTaken: 45000,
      difficulty: 'beginner',
      lastAttemptedAt: new Date(),
      questionsAttempted: ['q1', 'q2'],
    };

    it('should validate correct progress data', () => {
      const result = validateUserProgress(validProgress);
      expect(result.valid).toBe(true);
    });

    it('should reject progress without user ID', () => {
      const invalid = { ...validProgress, userId: '' };
      const result = validateUserProgress(invalid);
      expect(result.valid).toBe(false);
    });

    it('should reject progress with invalid subject', () => {
      const invalid = { ...validProgress, subject: 'physics' };
      const result = validateUserProgress(invalid);
      expect(result.valid).toBe(false);
    });

    it('should reject progress with negative attempts', () => {
      const invalid = { ...validProgress, totalAttempts: -1 };
      const result = validateUserProgress(invalid);
      expect(result.valid).toBe(false);
    });

    it('should reject progress with correct > total attempts', () => {
      const invalid = {
        ...validProgress,
        totalAttempts: 5,
        correctAttempts: 10,
      };
      const result = validateUserProgress(invalid);
      expect(result.valid).toBe(false);
    });

    it('should reject progress with invalid success rate', () => {
      const invalid = { ...validProgress, successRate: 150 };
      const result = validateUserProgress(invalid);
      expect(result.valid).toBe(false);
    });
  });

  /**
   * Test Suite 8: Error Formatting
   */
  describe('Error Formatting', () => {
    it('should format validation errors', () => {
      const errors = [
        { field: 'id', message: 'ID is required', value: '' },
        { field: 'type', message: 'Invalid type', value: 'invalid' },
      ];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('id: ID is required');
      expect(formatted).toContain('type: Invalid type');
    });

    it('should handle empty error array', () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toBe('');
    });
  });

  /**
   * Test Suite 9: Edge Cases
   */
  describe('Edge Cases', () => {
    it('should reject null question', () => {
      const result = validateQuestionSchemaDetailed(null);
      expect(result.valid).toBe(false);
    });

    it('should reject undefined question', () => {
      const result = validateQuestionSchemaDetailed(undefined);
      expect(result.valid).toBe(false);
    });

    it('should reject non-object question', () => {
      const result = validateQuestionSchemaDetailed('not an object');
      expect(result.valid).toBe(false);
    });

    it('should handle questions with extra fields', () => {
      const validMCQ: any = {
        id: 'mcq-001',
        type: 'mcq',
        subject: 'mathematics',
        difficulty: 'beginner',
        questionText: 'What is 2 + 2?',
        options: [
          { id: 'opt-1', text: '3', isCorrect: false },
          { id: 'opt-2', text: '4', isCorrect: true },
        ],
        correctOptionId: 'opt-2',
        explanation: 'The answer is 4.',
        tags: ['addition'],
        prerequisites: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        extraField: 'should be ignored',
      };
      expect(validateQuestionSchema(validMCQ)).toBe(true);
    });
  });
});
