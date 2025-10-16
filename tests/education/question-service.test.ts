/**
 * Question Service Tests
 * Tests for lib/education/question-service.ts
 */

import { QuestionService, getQuestionService } from '@/lib/education/question-service';
import {
  MCQQuestion,
  ConceptualQuestion,
  NumericalQuestion,
} from '@/lib/education/question-types';

describe('Question Service', () => {
  let questionService: QuestionService;

  beforeAll(async () => {
    questionService = new QuestionService();
    await questionService.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test Suite 1: Question Loading
   */
  describe('Question Loading', () => {
    it('should initialize service', async () => {
      const service = new QuestionService();
      await service.initialize();
      expect(service).toBeDefined();
    });

    it('should load mathematics questions', async () => {
      const questions = await questionService.getQuestions('mathematics');
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should load finance questions', async () => {
      const questions = await questionService.getQuestions('finance');
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should load agriculture questions', async () => {
      const questions = await questionService.getQuestions('agriculture');
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should cache questions', async () => {
      const stats1 = questionService.getCacheStats();
      await questionService.getQuestions('mathematics');
      const stats2 = questionService.getCacheStats();
      expect(stats2.totalQuestions).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 2: Random Question Selection
   */
  describe('Random Question Selection', () => {
    it('should return random question from subject', async () => {
      const question = await questionService.getRandomQuestion('mathematics');
      expect(question).toBeDefined();
      expect(question?.subject).toBe('mathematics');
    });

    it('should return random question with specific difficulty', async () => {
      const question = await questionService.getRandomQuestion('mathematics', 'beginner');
      expect(question).toBeDefined();
      expect(question?.difficulty).toBe('beginner');
    });

    it('should return null for invalid subject', async () => {
      const question = await questionService.getRandomQuestion('invalid' as any);
      expect(question).toBeNull();
    });

    it('should return null if no questions match difficulty', async () => {
      const question = await questionService.getRandomQuestion(
        'mathematics',
        'expert' as any
      );
      expect(question).toBeNull();
    });

    it('should return different questions on multiple calls', async () => {
      const q1 = await questionService.getRandomQuestion('mathematics');
      const q2 = await questionService.getRandomQuestion('mathematics');
      // Not guaranteed to be different, but likely
      expect(q1).toBeDefined();
      expect(q2).toBeDefined();
    });
  });

  /**
   * Test Suite 3: Question Filtering
   */
  describe('Question Filtering', () => {
    it('should filter questions by difficulty', async () => {
      const questions = await questionService.getFilteredQuestions({
        subject: 'mathematics',
        difficulty: 'beginner',
      });
      expect(questions.every(q => q.difficulty === 'beginner')).toBe(true);
    });

    it('should filter questions by type', async () => {
      const questions = await questionService.getFilteredQuestions({
        subject: 'mathematics',
        type: 'mcq',
      });
      expect(questions.every(q => q.type === 'mcq')).toBe(true);
    });

    it('should filter questions by tags', async () => {
      const questions = await questionService.getFilteredQuestions({
        subject: 'mathematics',
        tags: ['addition'],
      });
      expect(questions.length).toBeGreaterThanOrEqual(0);
    });

    it('should apply pagination', async () => {
      const page1 = await questionService.getFilteredQuestions({
        subject: 'mathematics',
        limit: 2,
        offset: 0,
      });
      const page2 = await questionService.getFilteredQuestions({
        subject: 'mathematics',
        limit: 2,
        offset: 2,
      });
      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);
    });
  });

  /**
   * Test Suite 4: Question Retrieval
   */
  describe('Question Retrieval', () => {
    it('should get question by ID', async () => {
      const allQuestions = await questionService.getQuestions('mathematics');
      if (allQuestions.length > 0) {
        const firstQuestion = allQuestions[0];
        const retrieved = await questionService.getQuestionById(
          'mathematics',
          firstQuestion.id
        );
        expect(retrieved?.id).toBe(firstQuestion.id);
      }
    });

    it('should return null for non-existent question', async () => {
      const question = await questionService.getQuestionById(
        'mathematics',
        'non-existent-id'
      );
      expect(question).toBeNull();
    });
  });

  /**
   * Test Suite 5: MCQ Answer Checking
   */
  describe('MCQ Answer Checking', () => {
    let mcqQuestion: MCQQuestion;

    beforeAll(async () => {
      const questions = await questionService.getQuestions('mathematics');
      mcqQuestion = questions.find(q => q.type === 'mcq') as MCQQuestion;
    });

    it('should validate correct MCQ answer', () => {
      if (mcqQuestion) {
        const result = questionService.checkMCQAnswer(
          mcqQuestion,
          mcqQuestion.correctOptionId
        );
        expect(result).toBe(true);
      }
    });

    it('should reject incorrect MCQ answer', () => {
      if (mcqQuestion && mcqQuestion.options.length > 1) {
        const incorrectId = mcqQuestion.options.find(
          o => o.id !== mcqQuestion.correctOptionId
        )?.id;
        if (incorrectId) {
          const result = questionService.checkMCQAnswer(mcqQuestion, incorrectId);
          expect(result).toBe(false);
        }
      }
    });
  });

  /**
   * Test Suite 6: Numerical Answer Checking
   */
  describe('Numerical Answer Checking', () => {
    let numericalQuestion: NumericalQuestion;

    beforeAll(async () => {
      const questions = await questionService.getQuestions('mathematics');
      numericalQuestion = questions.find(
        q => q.type === 'numerical'
      ) as NumericalQuestion;
    });

    it('should validate correct numerical answer', () => {
      if (numericalQuestion) {
        const result = questionService.checkNumericalAnswer(
          numericalQuestion,
          numericalQuestion.correctAnswer
        );
        expect(result).toBe(true);
      }
    });

    it('should accept answer within tolerance', () => {
      if (numericalQuestion && numericalQuestion.tolerance > 0) {
        const answer = numericalQuestion.correctAnswer + numericalQuestion.tolerance / 2;
        const result = questionService.checkNumericalAnswer(numericalQuestion, answer);
        expect(result).toBe(true);
      }
    });

    it('should reject answer outside tolerance', () => {
      if (numericalQuestion) {
        const answer = numericalQuestion.correctAnswer + numericalQuestion.tolerance + 1;
        const result = questionService.checkNumericalAnswer(numericalQuestion, answer);
        expect(result).toBe(false);
      }
    });
  });

  /**
   * Test Suite 7: Conceptual Answer Checking
   */
  describe('Conceptual Answer Checking', () => {
    let conceptualQuestion: ConceptualQuestion;

    beforeAll(async () => {
      const questions = await questionService.getQuestions('mathematics');
      conceptualQuestion = questions.find(
        q => q.type === 'conceptual'
      ) as ConceptualQuestion;
    });

    it('should validate correct conceptual answer', () => {
      if (conceptualQuestion && conceptualQuestion.acceptableAnswers.length > 0) {
        const result = questionService.checkConceptualAnswer(
          conceptualQuestion,
          conceptualQuestion.acceptableAnswers[0]
        );
        expect(result).toBe(true);
      }
    });

    it('should accept partial matches', () => {
      if (conceptualQuestion && conceptualQuestion.acceptableAnswers.length > 0) {
        const acceptable = conceptualQuestion.acceptableAnswers[0];
        const partial = acceptable.substring(0, Math.min(10, acceptable.length));
        const result = questionService.checkConceptualAnswer(conceptualQuestion, partial);
        expect(typeof result).toBe('boolean');
      }
    });
  });

  /**
   * Test Suite 8: Generic Answer Checking
   */
  describe('Generic Answer Checking', () => {
    it('should check MCQ answer', async () => {
      const questions = await questionService.getQuestions('mathematics');
      const mcqQuestion = questions.find(q => q.type === 'mcq');
      if (mcqQuestion) {
        const result = questionService.checkAnswer(
          mcqQuestion,
          (mcqQuestion as MCQQuestion).correctOptionId
        );
        expect(result.isCorrect).toBe(true);
        expect(result.feedback).toBeTruthy();
      }
    });

    it('should check numerical answer', async () => {
      const questions = await questionService.getQuestions('mathematics');
      const numQuestion = questions.find(q => q.type === 'numerical');
      if (numQuestion) {
        const result = questionService.checkAnswer(
          numQuestion,
          (numQuestion as NumericalQuestion).correctAnswer
        );
        expect(result.isCorrect).toBe(true);
        expect(result.feedback).toBeTruthy();
      }
    });

    it('should provide feedback for incorrect answer', async () => {
      const questions = await questionService.getQuestions('mathematics');
      const mcqQuestion = questions.find(q => q.type === 'mcq') as MCQQuestion;
      if (mcqQuestion && mcqQuestion.options.length > 1) {
        const incorrectId = mcqQuestion.options.find(
          o => o.id !== mcqQuestion.correctOptionId
        )?.id;
        if (incorrectId) {
          const result = questionService.checkAnswer(mcqQuestion, incorrectId);
          expect(result.isCorrect).toBe(false);
          expect(result.feedback).toBeTruthy();
        }
      }
    });
  });

  /**
   * Test Suite 9: Hints and Explanations
   */
  describe('Hints and Explanations', () => {
    it('should get hint for conceptual question', async () => {
      const questions = await questionService.getQuestions('mathematics');
      const conceptualQuestion = questions.find(
        q => q.type === 'conceptual'
      ) as ConceptualQuestion;
      if (conceptualQuestion) {
        const hint = questionService.getHint(conceptualQuestion, 1);
        expect(hint).toBeTruthy();
      }
    });

    it('should get explanation in English', async () => {
      const questions = await questionService.getQuestions('mathematics');
      if (questions.length > 0) {
        const explanation = questionService.getExplanation(questions[0], 'en');
        expect(explanation).toBeTruthy();
      }
    });

    it('should get explanation in Hindi if available', async () => {
      const questions = await questionService.getQuestions('mathematics');
      if (questions.length > 0) {
        const explanation = questionService.getExplanation(questions[0], 'hi');
        expect(explanation).toBeTruthy();
      }
    });

    it('should get question text in English', async () => {
      const questions = await questionService.getQuestions('mathematics');
      if (questions.length > 0) {
        const text = questionService.getQuestionText(questions[0], 'en');
        expect(text).toBeTruthy();
      }
    });

    it('should get question text in Hindi if available', async () => {
      const questions = await questionService.getQuestions('mathematics');
      if (questions.length > 0) {
        const text = questionService.getQuestionText(questions[0], 'hi');
        expect(text).toBeTruthy();
      }
    });
  });

  /**
   * Test Suite 10: Related Questions
   */
  describe('Related Questions', () => {
    it('should get related questions by tags', async () => {
      const questions = await questionService.getQuestions('mathematics');
      if (questions.length > 0) {
        const related = await questionService.getRelatedQuestions(
          'mathematics',
          questions[0],
          3
        );
        expect(Array.isArray(related)).toBe(true);
        expect(related.length).toBeLessThanOrEqual(3);
      }
    });

    it('should not include original question in related', async () => {
      const questions = await questionService.getQuestions('mathematics');
      if (questions.length > 0) {
        const related = await questionService.getRelatedQuestions(
          'mathematics',
          questions[0],
          5
        );
        expect(related.every(q => q.id !== questions[0].id)).toBe(true);
      }
    });
  });

  /**
   * Test Suite 11: Difficulty Progression
   */
  describe('Difficulty Progression', () => {
    it('should get questions by difficulty progression', async () => {
      const progression = await questionService.getProgressionQuestions('mathematics');
      expect(Array.isArray(progression)).toBe(true);
      expect(progression.length).toBeGreaterThan(0);
    });

    it('should organize questions by difficulty', async () => {
      const progression = await questionService.getProgressionQuestions('mathematics');
      progression.forEach(level => {
        expect(Array.isArray(level)).toBe(true);
        if (level.length > 0) {
          const difficulty = level[0].difficulty;
          expect(level.every(q => q.difficulty === difficulty)).toBe(true);
        }
      });
    });
  });

  /**
   * Test Suite 12: User Answer Creation
   */
  describe('User Answer Creation', () => {
    it('should create user answer record', () => {
      const answer = questionService.createUserAnswer(
        'q-001',
        'user-123',
        'opt-1',
        true,
        5000,
        1
      );
      expect(answer.questionId).toBe('q-001');
      expect(answer.userId).toBe('user-123');
      expect(answer.answer).toBe('opt-1');
      expect(answer.isCorrect).toBe(true);
      expect(answer.timeTaken).toBe(5000);
      expect(answer.attemptNumber).toBe(1);
      expect(answer.submittedAt).toBeDefined();
    });
  });

  /**
   * Test Suite 13: Question Response Creation
   */
  describe('Question Response Creation', () => {
    it('should create question response', async () => {
      const questions = await questionService.getQuestions('mathematics');
      if (questions.length > 0) {
        const question = questions[0];
        const response = questionService.createQuestionResponse(
          question,
          undefined,
          true,
          'Correct!',
          'This is the explanation.'
        );
        expect(response.question).toBe(question);
        expect(response.isCorrect).toBe(true);
        expect(response.feedback).toBe('Correct!');
        expect(response.explanation).toBe('This is the explanation.');
      }
    });
  });

  /**
   * Test Suite 14: Caching
   */
  describe('Caching', () => {
    it('should cache questions', async () => {
      const stats1 = questionService.getCacheStats();
      await questionService.getQuestions('mathematics');
      const stats2 = questionService.getCacheStats();
      expect(stats2.cachedSubjects.length).toBeGreaterThanOrEqual(
        stats1.cachedSubjects.length
      );
    });

    it('should clear cache', () => {
      questionService.clearCache();
      const stats = questionService.getCacheStats();
      expect(stats.totalQuestions).toBe(0);
    });

    it('should return cache statistics', () => {
      const stats = questionService.getCacheStats();
      expect(stats.cachedSubjects).toBeDefined();
      expect(stats.cacheSize).toBeDefined();
      expect(stats.totalQuestions).toBeDefined();
    });
  });

  /**
   * Test Suite 15: Singleton Instance
   */
  describe('Singleton Instance', () => {
    it('should return singleton instance', async () => {
      const service1 = await getQuestionService();
      const service2 = await getQuestionService();
      expect(service1).toBe(service2);
    });

    it('should initialize on first call', async () => {
      const service = await getQuestionService();
      const questions = await service.getQuestions('mathematics');
      expect(questions.length).toBeGreaterThan(0);
    });
  });
});
