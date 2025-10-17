/**
 * Content Quality Validation Tests
 * Tests for question quality validation
 */

import ContentValidator from '@/lib/education/content-validator';

describe('Content Quality Validation', () => {
  const validator = new ContentValidator();

  /**
   * Test Suite 1: Clarity Validation
   */
  describe('Clarity Validation', () => {
    it('should validate clear question', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        explanation: 'Basic arithmetic addition',
      };

      const issues = validator.validateClarity(question);
      expect(issues.length).toBe(0);
    });

    it('should detect short question', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'Hi?',
        explanation: 'Test',
      };

      const issues = validator.validateClarity(question);
      expect(issues.some(i => i.message.includes('too short'))).toBe(true);
    });

    it('should detect ambiguous language', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What might 2 + 2 perhaps be?',
        explanation: 'Test',
      };

      const issues = validator.validateClarity(question);
      expect(issues.some(i => i.message.includes('ambiguous'))).toBe(true);
    });

    it('should detect missing punctuation', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2',
        explanation: 'Test',
      };

      const issues = validator.validateClarity(question);
      expect(issues.some(i => i.message.includes('punctuation'))).toBe(true);
    });
  });

  /**
   * Test Suite 2: Correctness Validation
   */
  describe('Correctness Validation', () => {
    it('should validate correct MCQ', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        options: { A: '3', B: '4', C: '5', D: '6' },
        correctOptionId: 'B',
        explanation: '2 plus 2 equals 4',
      };

      const issues = validator.validateCorrectness(question);
      expect(issues.length).toBe(0);
    });

    it('should detect MCQ without options', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        explanation: 'Test',
      };

      const issues = validator.validateCorrectness(question);
      expect(issues.some(i => i.message.includes('options'))).toBe(true);
    });

    it('should detect duplicate options', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        options: { A: '4', B: '4', C: '5', D: '6' },
        correctOptionId: 'A',
        explanation: 'Test',
      };

      const issues = validator.validateCorrectness(question);
      expect(issues.some(i => i.message.includes('Duplicate'))).toBe(true);
    });

    it('should detect short explanation', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        options: { A: '3', B: '4', C: '5', D: '6' },
        correctOptionId: 'B',
        explanation: 'Hi',
      };

      const issues = validator.validateCorrectness(question);
      expect(issues.some(i => i.message.includes('Explanation'))).toBe(true);
    });
  });

  /**
   * Test Suite 3: Educational Validation
   */
  describe('Educational Validation', () => {
    it('should validate educational question', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        options: { A: '3', B: '4', C: '5', D: '6' },
        correctOptionId: 'B',
        explanation: 'Basic arithmetic addition',
        tags: ['arithmetic', 'addition'],
        hints: ['Count on your fingers'],
      };

      const issues = validator.validateEducational(question);
      expect(issues.length).toBe(0);
    });

    it('should detect missing tags', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        explanation: 'Test',
      };

      const issues = validator.validateEducational(question);
      expect(issues.some(i => i.message.includes('tags'))).toBe(true);
    });

    it('should detect invalid difficulty', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'invalid',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        explanation: 'Test',
      };

      const issues = validator.validateEducational(question);
      expect(issues.some(i => i.message.includes('difficulty'))).toBe(true);
    });

    it('should detect missing hints', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        explanation: 'Test',
        tags: ['math'],
      };

      const issues = validator.validateEducational(question);
      expect(issues.some(i => i.message.includes('hints'))).toBe(true);
    });
  });

  /**
   * Test Suite 4: Cultural Validation
   */
  describe('Cultural Validation', () => {
    it('should validate culturally appropriate question', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        explanation: 'Basic arithmetic',
      };

      const issues = validator.validateCultural(question);
      expect(issues.length).toBe(0);
    });

    it('should detect offensive content', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is offensive content?',
        explanation: 'This is offensive',
      };

      const issues = validator.validateCultural(question);
      expect(issues.some(i => i.severity === 'error')).toBe(true);
    });

    it('should detect insensitive terms', () => {
      const question = {
        id: 'test-1',
        subject: 'history',
        difficulty: 'intermediate',
        type: 'conceptual',
        questionText: 'Describe primitive societies',
        explanation: 'Test',
      };

      const issues = validator.validateCultural(question);
      expect(issues.some(i => i.message.includes('insensitive'))).toBe(true);
    });
  });

  /**
   * Test Suite 5: Translation Validation
   */
  describe('Translation Validation', () => {
    it('should validate good Hindi translation', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        questionTextHindi: '2 + 2 क्या है?',
        explanation: 'Basic arithmetic',
      };

      const issues = validator.validateTranslation(question);
      const hasErrors = issues.some(i => i.severity === 'error');
      expect(hasErrors).toBe(false);
    });

    it('should flag poor translation quality', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        questionTextHindi: 'What is 2 + 2?', // Not translated
        explanation: 'Test',
      };

      const issues = validator.validateTranslation(question);
      expect(issues.some(i => i.type === 'translation')).toBe(true);
    });

    it('should detect unusual length ratio', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        questionTextHindi: 'क्या', // Too short
        explanation: 'Test',
      };

      const issues = validator.validateTranslation(question);
      expect(issues.some(i => i.message.includes('ratio'))).toBe(true);
    });

    it('should detect untranslated English words', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        questionTextHindi: 'What is 2 + 2 क्या है?', // Mixed
        explanation: 'Test',
      };

      const issues = validator.validateTranslation(question);
      expect(issues.some(i => i.message.includes('untranslated'))).toBe(true);
    });
  });

  /**
   * Test Suite 6: Comprehensive Validation
   */
  describe('Comprehensive Validation', () => {
    it('should validate perfect question', () => {
      const question = {
        id: 'math-001',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        questionTextHindi: '2 + 2 क्या है?',
        options: { A: '3', B: '4', C: '5', D: '6' },
        optionsHindi: { A: '3', B: '4', C: '5', D: '6' },
        correctOptionId: 'B',
        explanation: 'Two plus two equals four',
        explanationHindi: 'दो जमा दो चार के बराबर है',
        hints: ['Count on your fingers', 'Think of pairs'],
        hintsHindi: ['अपनी उंगलियों पर गिनें', 'जोड़ी के बारे में सोचें'],
        tags: ['arithmetic', 'addition', 'basic'],
      };

      const result = validator.validate(question);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.issues.length).toBe(0);
    });

    it('should flag poor quality question', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'invalid',
        type: 'mcq',
        questionText: 'Hi',
        explanation: 'X',
      };

      const result = validator.validate(question);

      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(50);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should calculate correct score', () => {
      const question = {
        id: 'test-1',
        subject: 'mathematics',
        difficulty: 'beginner',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        options: { A: '3', B: '4', C: '5', D: '6' },
        correctOptionId: 'B',
        explanation: 'Test explanation',
        tags: ['math'],
      };

      const result = validator.validate(question);

      // Should have some warnings but no errors
      expect(result.score).toBeGreaterThan(60);
      expect(result.score).toBeLessThan(100);
    });
  });

  /**
   * Test Suite 7: Batch Validation
   */
  describe('Batch Validation', () => {
    it('should validate batch of questions', () => {
      const questions = [
        {
          id: 'q1',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'mcq',
          questionText: 'What is 2 + 2?',
          options: { A: '3', B: '4', C: '5', D: '6' },
          correctOptionId: 'B',
          explanation: 'Test',
          tags: ['math'],
        },
        {
          id: 'q2',
          subject: 'mathematics',
          difficulty: 'intermediate',
          type: 'mcq',
          questionText: 'What is 5 × 3?',
          options: { A: '10', B: '15', C: '20', D: '25' },
          correctOptionId: 'B',
          explanation: 'Test',
          tags: ['math'],
        },
      ];

      const results = validator.validateBatch(questions);

      expect(results.length).toBe(2);
      expect(results.every(r => typeof r.score === 'number')).toBe(true);
    });
  });

  /**
   * Test Suite 8: Report Generation
   */
  describe('Report Generation', () => {
    it('should generate quality report', () => {
      const questions = [
        {
          id: 'q1',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'mcq',
          questionText: 'What is 2 + 2?',
          options: { A: '3', B: '4', C: '5', D: '6' },
          correctOptionId: 'B',
          explanation: 'Test explanation',
          tags: ['math'],
        },
        {
          id: 'q2',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'mcq',
          questionText: 'Hi',
          explanation: 'X',
        },
      ];

      const results = validator.validateBatch(questions);
      const report = validator.generateReport(results);

      expect(report.totalQuestions).toBe(2);
      expect(report.validQuestions).toBe(1);
      expect(report.validPercentage).toBe(50);
      expect(report.averageScore).toBeGreaterThan(0);
      expect(report.issuesBySeverity.error).toBeGreaterThan(0);
    });

    it('should flag questions with poor translation', () => {
      const questions = [
        {
          id: 'q1',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'mcq',
          questionText: 'What is 2 + 2?',
          questionTextHindi: '2 + 2 क्या है?',
          options: { A: '3', B: '4', C: '5', D: '6' },
          correctOptionId: 'B',
          explanation: 'Test',
          tags: ['math'],
        },
        {
          id: 'q2',
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'mcq',
          questionText: 'What is 5 × 3?',
          questionTextHindi: 'What is 5 × 3?', // Poor translation
          options: { A: '10', B: '15', C: '20', D: '25' },
          correctOptionId: 'B',
          explanation: 'Test',
          tags: ['math'],
        },
      ];

      const results = validator.validateBatch(questions);
      const flagged = results.filter(r => r.flags.length > 0);

      expect(flagged.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 9: Real-world Scenarios
   */
  describe('Real-world Scenarios', () => {
    it('should flag questions with poor translation quality (< 5%)', () => {
      // Generate 100 questions with 95% good and 5% poor translations
      const questions = [];

      for (let i = 0; i < 95; i++) {
        questions.push({
          id: `q${i}`,
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'mcq',
          questionText: `Question ${i}?`,
          questionTextHindi: `प्रश्न ${i}?`,
          options: { A: '1', B: '2', C: '3', D: '4' },
          correctOptionId: 'B',
          explanation: 'Test explanation',
          tags: ['math'],
        });
      }

      for (let i = 95; i < 100; i++) {
        questions.push({
          id: `q${i}`,
          subject: 'mathematics',
          difficulty: 'beginner',
          type: 'mcq',
          questionText: `Question ${i}?`,
          questionTextHindi: `Question ${i}?`, // Poor translation
          options: { A: '1', B: '2', C: '3', D: '4' },
          correctOptionId: 'B',
          explanation: 'Test explanation',
          tags: ['math'],
        });
      }

      const results = validator.validateBatch(questions);
      const flagged = results.filter(r => r.flags.some(f => f.includes('translation')));

      expect(flagged.length).toBeLessThan(questions.length * 0.1); // < 10% flagged
    });

    it('should validate 100+ questions per subject', () => {
      const questions = [];

      for (let i = 0; i < 100; i++) {
        questions.push({
          id: `math-${i}`,
          subject: 'mathematics',
          difficulty: ['beginner', 'intermediate', 'advanced'][i % 3],
          type: 'mcq',
          questionText: `Math question ${i}?`,
          options: { A: '1', B: '2', C: '3', D: '4' },
          correctOptionId: 'B',
          explanation: 'Test explanation',
          tags: ['mathematics'],
        });
      }

      const results = validator.validateBatch(questions);
      const report = validator.generateReport(results);

      expect(results.length).toBe(100);
      expect(report.totalQuestions).toBe(100);
      expect(report.validPercentage).toBeGreaterThan(80);
    });
  });
});
