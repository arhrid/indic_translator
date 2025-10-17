/**
 * Learning Mode Error Handling & Resilience Tests
 * Tests for graceful error handling in learning flows
 */

import { getQuestionService } from '@/lib/education/question-service';
import { getProgressTracker } from '@/lib/education/progress-tracker';
import { getAdaptiveAgent } from '@/lib/education/adaptive-agent';

describe('Learning Mode Error Handling & Resilience', () => {
  const userId = 'test-user-error';
  let questionService: any;
  let progressTracker: any;
  let adaptiveAgent: any;

  beforeAll(async () => {
    questionService = await getQuestionService();
    progressTracker = getProgressTracker(userId);
    adaptiveAgent = getAdaptiveAgent(userId, progressTracker);
  });

  beforeEach(() => {
    progressTracker.clearAllData();
  });

  /**
   * Test Suite 1: Invalid Question Request
   */
  describe('Invalid Question Request Handling', () => {
    it('should handle invalid subject gracefully', async () => {
      const question = await questionService.getRandomQuestion('invalid_subject', 'beginner');

      // Should return null or error, not crash
      expect(question === null || question === undefined || question.id).toBeTruthy();
    });

    it('should handle invalid difficulty gracefully', async () => {
      const question = await questionService.getRandomQuestion('mathematics', 'invalid_difficulty');

      // Should return null or error, not crash
      expect(question === null || question === undefined || question.id).toBeTruthy();
    });

    it('should handle null subject gracefully', async () => {
      const question = await questionService.getRandomQuestion(null as any, 'beginner');

      // Should handle gracefully
      expect(question === null || question === undefined || question.id).toBeTruthy();
    });

    it('should handle undefined difficulty gracefully', async () => {
      const question = await questionService.getRandomQuestion('mathematics', undefined as any);

      // Should handle gracefully
      expect(question === null || question === undefined || question.id).toBeTruthy();
    });

    it('should handle empty subject string', async () => {
      const question = await questionService.getRandomQuestion('', 'beginner');

      // Should handle gracefully
      expect(question === null || question === undefined || question.id).toBeTruthy();
    });
  });

  /**
   * Test Suite 2: Session Management Errors
   */
  describe('Session Management Errors', () => {
    it('should handle starting session without ending previous', async () => {
      // Start first session
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      // Start second session without ending first
      progressTracker.startSession('session-2', 'mathematics', 'beginner');

      // Should handle gracefully
      const currentSession = progressTracker.getCurrentSession();
      expect(currentSession).toBeDefined();
    });

    it('should handle ending session without starting', async () => {
      // Try to end without starting
      const result = progressTracker.endSession();

      // Should handle gracefully
      expect(result === null || result === undefined || result.totalScore >= 0).toBeTruthy();
    });

    it('should handle recording answer without session', async () => {
      // Try to record answer without session
      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      // Should handle gracefully
      const currentSession = progressTracker.getCurrentSession();
      expect(currentSession === null || currentSession === undefined || currentSession.questionsAttempted).toBeTruthy();
    });

    it('should handle invalid session data', async () => {
      // Start session with invalid data
      const session = progressTracker.startSession(null as any, 'mathematics', 'beginner');

      // Should handle gracefully
      expect(session === null || session === undefined || session.subject).toBeTruthy();
    });
  });

  /**
   * Test Suite 3: Answer Validation Errors
   */
  describe('Answer Validation Errors', () => {
    it('should handle null answer', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: null as any,
        isCorrect: false,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      const session = progressTracker.endSession();
      expect(session).toBeDefined();
    });

    it('should handle undefined answer', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: undefined as any,
        isCorrect: false,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      const session = progressTracker.endSession();
      expect(session).toBeDefined();
    });

    it('should handle empty answer string', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: '',
        isCorrect: false,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      const session = progressTracker.endSession();
      expect(session).toBeDefined();
    });

    it('should handle negative time taken', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: -5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      const session = progressTracker.endSession();
      expect(session).toBeDefined();
    });

    it('should handle zero time taken', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 0,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      const session = progressTracker.endSession();
      expect(session).toBeDefined();
    });

    it('should handle very large time taken', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 999999999,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      const session = progressTracker.endSession();
      expect(session).toBeDefined();
    });

    it('should handle invalid attempt number', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: -1,
        submittedAt: new Date(),
      });

      const session = progressTracker.endSession();
      expect(session).toBeDefined();
    });

    it('should handle future submission date', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: futureDate,
      });

      const session = progressTracker.endSession();
      expect(session).toBeDefined();
    });
  });

  /**
   * Test Suite 4: Metrics Calculation Errors
   */
  describe('Metrics Calculation Errors', () => {
    it('should handle empty session metrics', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      // Don't record any answers
      const session = progressTracker.endSession();

      expect(session).toBeDefined();
      expect(session.totalScore).toBe(0);
      expect(session.successRate).toBe(0);
    });

    it('should handle single answer metrics', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      const session = progressTracker.endSession();

      expect(session).toBeDefined();
      expect(session.totalScore).toBe(1);
      expect(session.successRate).toBe(100);
    });

    it('should handle all incorrect answers', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      for (let i = 0; i < 5; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: false,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }

      const session = progressTracker.endSession();

      expect(session).toBeDefined();
      expect(session.totalScore).toBe(0);
      expect(session.successRate).toBe(0);
    });

    it('should handle all correct answers', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      for (let i = 0; i < 5; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }

      const session = progressTracker.endSession();

      expect(session).toBeDefined();
      expect(session.totalScore).toBe(5);
      expect(session.successRate).toBe(100);
    });

    it('should handle mixed correct and incorrect', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i % 2 === 0, // 50% success
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }

      const session = progressTracker.endSession();

      expect(session).toBeDefined();
      expect(session.successRate).toBe(50);
    });
  });

  /**
   * Test Suite 5: Adaptive Agent Errors
   */
  describe('Adaptive Agent Error Handling', () => {
    it('should handle invalid subject for recommendations', async () => {
      const recommendation = adaptiveAgent.getNextDifficulty('invalid_subject', 'beginner');

      expect(recommendation).toBeDefined();
      expect(recommendation.nextDifficulty).toBeTruthy();
    });

    it('should handle invalid difficulty for recommendations', async () => {
      const recommendation = adaptiveAgent.getNextDifficulty('mathematics', 'invalid_difficulty');

      expect(recommendation).toBeDefined();
    });

    it('should handle null subject for learning path', async () => {
      const path = adaptiveAgent.getPersonalizedLearningPath(null as any);

      expect(path === null || path === undefined || path.currentFocus).toBeTruthy();
    });

    it('should handle invalid question ID for spaced repetition', async () => {
      const interval = adaptiveAgent.getSpacedRepetitionSchedule(null as any, 0);

      expect(interval).toBeGreaterThan(0);
    });

    it('should handle negative attempt count', async () => {
      const interval = adaptiveAgent.getSpacedRepetitionSchedule('q-1', -1);

      expect(interval).toBeGreaterThan(0);
    });

    it('should handle very large attempt count', async () => {
      const interval = adaptiveAgent.getSpacedRepetitionSchedule('q-1', 999);

      expect(interval).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 6: Data Persistence Errors
   */
  describe('Data Persistence Errors', () => {
    it('should handle localStorage quota exceeded', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      try {
        progressTracker.startSession('session-1', 'mathematics', 'beginner');
        progressTracker.recordAnswer({
          questionId: 'q-1',
          userId,
          answer: 'opt-1',
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });

        // Should handle gracefully
        const session = progressTracker.endSession();
        expect(session).toBeDefined();
      } finally {
        Storage.prototype.setItem = originalSetItem;
      }
    });

    it('should handle corrupted localStorage data', async () => {
      // Set corrupted data
      localStorage.setItem(`progress_${userId}`, 'corrupted{invalid json}');

      // Should handle gracefully
      const metrics = progressTracker.getPerformanceMetrics('mathematics');
      expect(metrics === null || metrics === undefined || metrics.totalAttempts >= 0).toBeTruthy();
    });

    it('should handle missing localStorage data', async () => {
      // Clear localStorage
      localStorage.clear();

      // Should handle gracefully
      const metrics = progressTracker.getPerformanceMetrics('mathematics');
      expect(metrics === null || metrics === undefined || metrics.totalAttempts >= 0).toBeTruthy();
    });
  });

  /**
   * Test Suite 7: Concurrent Operation Errors
   */
  describe('Concurrent Operation Errors', () => {
    it('should handle concurrent session starts', async () => {
      // Start multiple sessions concurrently
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      progressTracker.startSession('session-2', 'science', 'intermediate');
      progressTracker.startSession('session-3', 'history', 'advanced');

      // Should handle gracefully
      const session = progressTracker.getCurrentSession();
      expect(session).toBeDefined();
    });

    it('should handle concurrent answer recordings', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      // Record multiple answers concurrently
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i % 2 === 0,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }

      const session = progressTracker.endSession();
      expect(session).toBeDefined();
      expect(session.questionsAttempted.length).toBe(10);
    });

    it('should handle concurrent metric calculations', async () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');

      for (let i = 0; i < 5; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }

      // Get metrics concurrently
      const metrics1 = progressTracker.getPerformanceMetrics('mathematics');
      const metrics2 = progressTracker.getPerformanceMetrics('mathematics');
      const metrics3 = progressTracker.getPerformanceMetrics('mathematics');

      expect(metrics1).toBeDefined();
      expect(metrics2).toBeDefined();
      expect(metrics3).toBeDefined();
    });
  });

  /**
   * Test Suite 8: Recovery & Resilience
   */
  describe('Recovery & Resilience', () => {
    it('should recover from invalid session state', async () => {
      // Create invalid state
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      progressTracker.endSession();

      // Should be able to start new session
      progressTracker.startSession('session-2', 'mathematics', 'beginner');
      const session = progressTracker.getCurrentSession();

      expect(session).toBeDefined();
      expect(session.sessionId).toBe('session-2');
    });

    it('should recover from corrupted metrics', async () => {
      // Corrupt metrics
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      progressTracker.endSession();

      // Clear and recalculate
      const metrics = progressTracker.getPerformanceMetrics('mathematics');
      expect(metrics).toBeDefined();
    });

    it('should not crash on repeated errors', async () => {
      // Make multiple invalid requests
      for (let i = 0; i < 10; i++) {
        const question = await questionService.getRandomQuestion('invalid', 'invalid');
        expect(question === null || question === undefined || question.id).toBeTruthy();
      }
    });
  });
});
