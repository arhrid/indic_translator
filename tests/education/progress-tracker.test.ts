/**
 * Progress Tracker Tests
 * Tests for lib/education/progress-tracker.ts
 */

import {
  ProgressTracker,
  getProgressTracker,
  PerformanceMetrics,
  LearningVelocity,
  WeakArea,
  SessionData,
} from '@/lib/education/progress-tracker';
import { UserAnswer } from '@/lib/education/question-types';

describe('Progress Tracker', () => {
  let tracker: ProgressTracker;
  const userId = 'test-user-123';

  beforeEach(() => {
    tracker = new ProgressTracker(userId);
    tracker.clearAllData();
  });

  afterEach(() => {
    tracker.clearAllData();
  });

  /**
   * Test Suite 1: Session Management
   */
  describe('Session Management', () => {
    it('should start a new session', () => {
      const session = tracker.startSession('session-1', 'mathematics', 'beginner', 'en');

      expect(session).toBeDefined();
      expect(session.sessionId).toBe('session-1');
      expect(session.userId).toBe(userId);
      expect(session.subject).toBe('mathematics');
      expect(session.difficulty).toBe('beginner');
      expect(session.language).toBe('en');
      expect(session.questionsAttempted).toEqual([]);
      expect(session.startedAt).toBeDefined();
    });

    it('should get current session', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      const current = tracker.getCurrentSession();

      expect(current).toBeDefined();
      expect(current?.sessionId).toBe('session-1');
    });

    it('should end session and calculate metrics', () => {
      const session = tracker.startSession('session-1', 'mathematics', 'beginner');

      // Add answers
      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      tracker.recordAnswer({
        questionId: 'q-002',
        userId,
        answer: 'opt-2',
        isCorrect: false,
        timeTaken: 3000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      const ended = tracker.endSession();

      expect(ended).toBeDefined();
      expect(ended?.totalScore).toBe(1);
      expect(ended?.successRate).toBe(50);
      expect(ended?.duration).toBeGreaterThan(0);
      expect(ended?.endedAt).toBeDefined();
    });

    it('should return null when ending session without starting', () => {
      const ended = tracker.endSession();
      expect(ended).toBeNull();
    });

    it('should get session history', () => {
      // Create multiple sessions
      for (let i = 0; i < 3; i++) {
        tracker.startSession(`session-${i}`, 'mathematics', 'beginner');
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
        tracker.endSession();
      }

      const history = tracker.getSessionHistory();
      expect(history.length).toBe(3);
    });

    it('should filter session history by subject', () => {
      // Math sessions
      for (let i = 0; i < 2; i++) {
        tracker.startSession(`math-${i}`, 'mathematics', 'beginner');
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
        tracker.endSession();
      }

      // Finance sessions
      for (let i = 0; i < 2; i++) {
        tracker.startSession(`finance-${i}`, 'finance', 'beginner');
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
        tracker.endSession();
      }

      const mathHistory = tracker.getSessionHistory('mathematics');
      expect(mathHistory.length).toBe(2);
      expect(mathHistory.every(s => s.subject === 'mathematics')).toBe(true);
    });

    it('should limit session history', () => {
      for (let i = 0; i < 5; i++) {
        tracker.startSession(`session-${i}`, 'mathematics', 'beginner');
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
        tracker.endSession();
      }

      const limited = tracker.getSessionHistory(undefined, 3);
      expect(limited.length).toBe(3);
    });
  });

  /**
   * Test Suite 2: Recording Answers
   */
  describe('Recording Answers', () => {
    it('should record answer in current session', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');

      const answer: UserAnswer = {
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      };

      tracker.recordAnswer(answer);
      const session = tracker.getCurrentSession();

      expect(session?.questionsAttempted.length).toBe(1);
      expect(session?.questionsAttempted[0]).toEqual(answer);
    });

    it('should record multiple answers', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');

      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i % 2 === 0,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }

      const session = tracker.getCurrentSession();
      expect(session?.questionsAttempted.length).toBe(5);
    });

    it('should warn when recording answer without session', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  /**
   * Test Suite 3: Performance Metrics
   */
  describe('Performance Metrics', () => {
    it('should calculate performance metrics', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');

      for (let i = 0; i < 10; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 8, // 8 correct, 2 incorrect
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }

      tracker.endSession();

      const metrics = tracker.getPerformanceMetrics('mathematics');

      expect(metrics).toBeDefined();
      expect(metrics?.totalAttempts).toBe(10);
      expect(metrics?.correctAttempts).toBe(8);
      expect(metrics?.successRate).toBe(80);
    });

    it('should track performance by difficulty', () => {
      // Beginner session
      tracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      // Intermediate session
      tracker.startSession('session-2', 'mathematics', 'intermediate');
      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i + 5}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 3, // 3 correct, 2 incorrect
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      const metrics = tracker.getPerformanceMetrics('mathematics');

      expect(metrics?.byDifficulty.beginner.attempts).toBe(5);
      expect(metrics?.byDifficulty.beginner.correct).toBe(5);
      expect(metrics?.byDifficulty.beginner.rate).toBe(100);

      expect(metrics?.byDifficulty.intermediate.attempts).toBe(5);
      expect(metrics?.byDifficulty.intermediate.correct).toBe(3);
      expect(metrics?.byDifficulty.intermediate.rate).toBe(60);
    });

    it('should calculate average time taken', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');

      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      tracker.recordAnswer({
        questionId: 'q-002',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 3000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      tracker.endSession();

      const metrics = tracker.getPerformanceMetrics('mathematics');
      expect(metrics?.averageTimeTaken).toBe(4000);
    });

    it('should get all performance metrics', () => {
      // Math session
      tracker.startSession('session-1', 'mathematics', 'beginner');
      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      tracker.endSession();

      // Finance session
      tracker.startSession('session-2', 'finance', 'beginner');
      tracker.recordAnswer({
        questionId: 'q-002',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      tracker.endSession();

      const allMetrics = tracker.getAllPerformanceMetrics();
      expect(allMetrics.length).toBe(2);
      expect(allMetrics.some(m => m.subject === 'mathematics')).toBe(true);
      expect(allMetrics.some(m => m.subject === 'finance')).toBe(true);
    });
  });

  /**
   * Test Suite 4: Learning Velocity
   */
  describe('Learning Velocity', () => {
    it('should calculate learning velocity', () => {
      // First session: 60% success
      tracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 3,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      // Second session: 80% success
      tracker.startSession('session-2', 'mathematics', 'beginner');
      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i + 5}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 4,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      const velocity = tracker.calculateLearningVelocity('mathematics');

      expect(velocity.subject).toBe('mathematics');
      expect(velocity.sessionsCompleted).toBe(2);
      expect(velocity.improvementRate).toBeGreaterThan(0);
      expect(velocity.consistencyScore).toBeGreaterThan(0);
    });

    it('should calculate consistency score', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      tracker.endSession();

      const velocity = tracker.calculateLearningVelocity('mathematics');
      expect(velocity.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(velocity.consistencyScore).toBeLessThanOrEqual(100);
    });

    it('should return zero velocity for new subject', () => {
      const velocity = tracker.calculateLearningVelocity('mathematics');

      expect(velocity.subject).toBe('mathematics');
      expect(velocity.improvementRate).toBe(0);
      expect(velocity.sessionsCompleted).toBe(0);
      expect(velocity.consistencyScore).toBe(0);
    });
  });

  /**
   * Test Suite 5: Weak Areas
   */
  describe('Weak Areas', () => {
    it('should identify weak areas below threshold', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 5, // 50% success rate
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      const weakAreas = tracker.identifyWeakAreas(70);

      expect(weakAreas.length).toBeGreaterThan(0);
      expect(weakAreas.some(area => area.subject === 'mathematics')).toBe(true);
    });

    it('should not identify areas above threshold as weak', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: true, // 100% success rate
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      const weakAreas = tracker.identifyWeakAreas(70);

      expect(weakAreas.every(area => area.subject !== 'mathematics')).toBe(true);
    });

    it('should include recommendations for weak areas', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: false,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      const weakAreas = tracker.identifyWeakAreas(50);

      if (weakAreas.length > 0) {
        expect(weakAreas[0].recommendedReview).toBeDefined();
        expect(weakAreas[0].recommendedReview.length).toBeGreaterThan(0);
      }
    });
  });

  /**
   * Test Suite 6: Recommendations
   */
  describe('Recommendations', () => {
    it('should provide recommendations', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 3,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      const recommendations = tracker.getRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should provide positive recommendations for strong performance', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      const recommendations = tracker.getRecommendations();

      expect(recommendations.some(r => r.includes('Great job'))).toBe(true);
    });
  });

  /**
   * Test Suite 7: Progress Summary
   */
  describe('Progress Summary', () => {
    it('should generate progress summary', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 4,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      const summary = tracker.getProgressSummary();

      expect(summary.totalSessions).toBe(1);
      expect(summary.totalQuestions).toBe(5);
      expect(summary.overallSuccessRate).toBe(80);
      expect(summary.subjectsStudied).toContain('mathematics');
    });

    it('should identify best and weakest subjects', () => {
      // Math: 80% success
      tracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 4,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      // Finance: 40% success
      tracker.startSession('session-2', 'finance', 'beginner');
      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i + 5}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 2,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      tracker.endSession();

      const summary = tracker.getProgressSummary();

      expect(summary.bestSubject).toBe('mathematics');
      expect(summary.weakestSubject).toBe('finance');
    });
  });

  /**
   * Test Suite 8: Data Persistence
   */
  describe('Data Persistence', () => {
    it('should save data to localStorage', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      tracker.endSession();

      const data = localStorage.getItem(`progress_${userId}`);
      expect(data).toBeDefined();
    });

    it('should load data from localStorage', () => {
      // Create and save data
      const tracker1 = new ProgressTracker(userId);
      tracker1.startSession('session-1', 'mathematics', 'beginner');
      tracker1.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      tracker1.endSession();

      // Create new tracker and verify data loaded
      const tracker2 = new ProgressTracker(userId);
      const history = tracker2.getSessionHistory();

      expect(history.length).toBe(1);
    });

    it('should export progress data', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      tracker.endSession();

      const exported = tracker.exportData();

      expect(exported.performanceData).toBeDefined();
      expect(exported.sessionHistory).toBeDefined();
      expect(exported.recommendations).toBeDefined();
    });

    it('should clear all data', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      tracker.endSession();

      tracker.clearAllData();

      const history = tracker.getSessionHistory();
      const metrics = tracker.getAllPerformanceMetrics();

      expect(history.length).toBe(0);
      expect(metrics.length).toBe(0);
    });
  });

  /**
   * Test Suite 9: Singleton Instance
   */
  describe('Singleton Instance', () => {
    it('should return same instance for same user', () => {
      const tracker1 = getProgressTracker(userId);
      const tracker2 = getProgressTracker(userId);

      expect(tracker1).toBe(tracker2);
    });

    it('should return different instances for different users', () => {
      const tracker1 = getProgressTracker('user-1');
      const tracker2 = getProgressTracker('user-2');

      expect(tracker1).not.toBe(tracker2);
    });
  });

  /**
   * Test Suite 10: Edge Cases
   */
  describe('Edge Cases', () => {
    it('should handle empty session', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      const ended = tracker.endSession();

      expect(ended?.totalScore).toBe(0);
      expect(ended?.successRate).toBe(0);
    });

    it('should handle single question session', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      const ended = tracker.endSession();

      expect(ended?.totalScore).toBe(1);
      expect(ended?.successRate).toBe(100);
    });

    it('should handle all incorrect answers', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 5; i++) {
        tracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: false,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      const ended = tracker.endSession();

      expect(ended?.totalScore).toBe(0);
      expect(ended?.successRate).toBe(0);
    });

    it('should handle very fast answers', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 100, // 100ms
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      tracker.endSession();

      const metrics = tracker.getPerformanceMetrics('mathematics');
      expect(metrics?.averageTimeTaken).toBe(100);
    });

    it('should handle very slow answers', () => {
      tracker.startSession('session-1', 'mathematics', 'beginner');
      tracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 300000, // 5 minutes
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      tracker.endSession();

      const metrics = tracker.getPerformanceMetrics('mathematics');
      expect(metrics?.averageTimeTaken).toBe(300000);
    });
  });
});
