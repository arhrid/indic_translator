/**
 * Adaptive Agent Tests
 * Tests for lib/education/adaptive-agent.ts
 */

import {
  AdaptiveAgent,
  getAdaptiveAgent,
  AgentRecommendation,
} from '@/lib/education/adaptive-agent';
import { ProgressTracker, getProgressTracker } from '@/lib/education/progress-tracker';

describe('Adaptive Agent', () => {
  let agent: AdaptiveAgent;
  let progressTracker: ProgressTracker;
  const userId = 'test-user-123';

  beforeEach(() => {
    progressTracker = new ProgressTracker(userId);
    progressTracker.clearAllData();
    agent = new AdaptiveAgent(progressTracker);
  });

  afterEach(() => {
    progressTracker.clearAllData();
  });

  /**
   * Test Suite 1: Difficulty Adjustment
   */
  describe('Difficulty Adjustment', () => {
    it('should recommend intermediate after 85% beginner success', () => {
      // Simulate 85%+ success at beginner
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 9, // 90% success
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');

      expect(recommendation.nextDifficulty).toBe('intermediate');
      expect(recommendation.reason).toContain('intermediate');
    });

    it('should recommend advanced after 75% intermediate success', () => {
      // Simulate 75%+ success at intermediate
      progressTracker.startSession('session-1', 'mathematics', 'intermediate');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 8, // 80% success
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'intermediate');

      expect(recommendation.nextDifficulty).toBe('advanced');
      expect(recommendation.reason).toContain('advanced');
    });

    it('should recommend beginner after < 50% intermediate success', () => {
      // Simulate < 50% success at intermediate
      progressTracker.startSession('session-1', 'mathematics', 'intermediate');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 4, // 40% success
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'intermediate');

      expect(recommendation.nextDifficulty).toBe('beginner');
      expect(recommendation.reason).toContain('beginner');
    });

    it('should keep beginner if < 85% success', () => {
      // Simulate 70% success at beginner
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 7, // 70% success
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');

      expect(recommendation.nextDifficulty).toBe('beginner');
    });

    it('should keep advanced if >= 60% success', () => {
      // Simulate 70% success at advanced
      progressTracker.startSession('session-1', 'mathematics', 'advanced');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 7, // 70% success
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'advanced');

      expect(recommendation.nextDifficulty).toBe('advanced');
    });

    it('should provide encouragement message', () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
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
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');

      expect(recommendation.encouragement).toBeTruthy();
      expect(recommendation.encouragement.length).toBeGreaterThan(0);
    });

    it('should provide suggested topics', () => {
      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');

      expect(Array.isArray(recommendation.suggestedTopics)).toBe(true);
      expect(recommendation.suggestedTopics.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 2: Encouragement Messages
   */
  describe('Encouragement Messages', () => {
    it('should provide outstanding message for 90%+ success', () => {
      const message = agent['generateEncouragement'](95, 'beginner');
      expect(message).toContain('Outstanding');
    });

    it('should provide excellent message for 80-89% success', () => {
      const message = agent['generateEncouragement'](85, 'beginner');
      expect(message).toContain('Excellent');
    });

    it('should provide good message for 70-79% success', () => {
      const message = agent['generateEncouragement'](75, 'beginner');
      expect(message).toContain('Good');
    });

    it('should provide keep going message for 60-69% success', () => {
      const message = agent['generateEncouragement'](65, 'beginner');
      expect(message).toContain('Keep going');
    });

    it('should provide motivational message for 50-59% success', () => {
      const message = agent['generateEncouragement'](55, 'beginner');
      expect(message).toContain("Don't give up");
    });

    it('should provide patient message for <50% success', () => {
      const message = agent['generateEncouragement'](40, 'beginner');
      expect(message).toContain('Take your time');
    });
  });

  /**
   * Test Suite 3: Spaced Repetition
   */
  describe('Spaced Repetition', () => {
    it('should return 1 day interval for first correct attempt', () => {
      const interval = agent.getSpacedRepetitionSchedule('q-001', 0);
      const oneDayMs = 1 * 24 * 60 * 60 * 1000;
      expect(interval).toBe(oneDayMs);
    });

    it('should return 3 day interval for second correct attempt', () => {
      const interval = agent.getSpacedRepetitionSchedule('q-001', 1);
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      expect(interval).toBe(threeDaysMs);
    });

    it('should return 7 day interval for third correct attempt', () => {
      const interval = agent.getSpacedRepetitionSchedule('q-001', 2);
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(interval).toBe(sevenDaysMs);
    });

    it('should return 14 day interval for fourth correct attempt', () => {
      const interval = agent.getSpacedRepetitionSchedule('q-001', 3);
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      expect(interval).toBe(fourteenDaysMs);
    });

    it('should return 30 day interval for fifth+ correct attempts', () => {
      const interval = agent.getSpacedRepetitionSchedule('q-001', 5);
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      expect(interval).toBe(thirtyDaysMs);
    });

    it('should determine if question should be shown again', () => {
      const lastAttemptedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const shouldShow = agent.shouldShowQuestionAgain(lastAttemptedAt, 0, true);

      expect(shouldShow).toBe(true); // 2 days > 1 day interval
    });

    it('should not show question if interval not reached', () => {
      const lastAttemptedAt = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
      const shouldShow = agent.shouldShowQuestionAgain(lastAttemptedAt, 0, true);

      expect(shouldShow).toBe(false); // 12 hours < 1 day interval
    });

    it('should show incorrect answers again soon', () => {
      const lastAttemptedAt = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      const shouldShow = agent.shouldShowQuestionAgain(lastAttemptedAt, 0, false);

      expect(shouldShow).toBe(true); // Always show incorrect answers
    });
  });

  /**
   * Test Suite 4: Personalized Learning Path
   */
  describe('Personalized Learning Path', () => {
    it('should return beginner path for new user', () => {
      const path = agent.getPersonalizedLearningPath('mathematics');

      expect(path.currentFocus).toBe('beginner');
      expect(path.nextMilestone).toContain('beginner');
      expect(path.progressToNextMilestone).toBe(0);
    });

    it('should progress to intermediate after beginner mastery', () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
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
      progressTracker.endSession();

      progressTracker.startSession('session-2', 'mathematics', 'intermediate');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i + 10}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 8,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      const path = agent.getPersonalizedLearningPath('mathematics');

      expect(path.currentFocus).toBe('intermediate');
      expect(path.nextMilestone).toContain('intermediate');
    });

    it('should calculate progress to next milestone', () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 7, // 70% success
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      const path = agent.getPersonalizedLearningPath('mathematics');

      expect(path.progressToNextMilestone).toBeGreaterThan(0);
      expect(path.progressToNextMilestone).toBeLessThanOrEqual(100);
    });

    it('should estimate time to mastery', () => {
      const path = agent.getPersonalizedLearningPath('mathematics');

      expect(path.estimatedTimeToMastery).toBeGreaterThan(0);
      expect(path.estimatedTimeToMastery).toBeLessThanOrEqual(100);
    });
  });

  /**
   * Test Suite 5: Motivational Messages
   */
  describe('Motivational Messages', () => {
    it('should provide motivational message for new subject', () => {
      const message = agent.getMotivationalMessage('mathematics');

      expect(message).toBeTruthy();
      expect(message.length).toBeGreaterThan(0);
    });

    it('should provide rocket message for high improvement', () => {
      // Create sessions with improving performance
      for (let session = 0; session < 3; session++) {
        progressTracker.startSession(`session-${session}`, 'mathematics', 'beginner');
        const correctCount = 3 + session * 2; // Improving
        for (let i = 0; i < 5; i++) {
          progressTracker.recordAnswer({
            questionId: `q-${session}-${i}`,
            userId,
            answer: 'opt-1',
            isCorrect: i < correctCount,
            timeTaken: 5000,
            attemptNumber: 1,
            submittedAt: new Date(),
          });
        }
        progressTracker.endSession();
      }

      const message = agent.getMotivationalMessage('mathematics');

      expect(message).toBeTruthy();
    });

    it('should provide perfect message for 80%+ success', () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 9, // 90% success
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      const message = agent.getMotivationalMessage('mathematics');

      expect(message).toContain('great');
    });
  });

  /**
   * Test Suite 6: Next Question Recommendation
   */
  describe('Next Question Recommendation', () => {
    it('should recommend beginner for new user', () => {
      const recommendation = agent.getNextQuestionRecommendation('mathematics');

      expect(recommendation.difficulty).toBe('beginner');
      expect(['mcq', 'conceptual', 'numerical']).toContain(recommendation.type);
    });

    it('should recommend intermediate after beginner mastery', () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 9, // 90% success
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      progressTracker.startSession('session-2', 'mathematics', 'intermediate');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i + 10}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 8, // 80% success
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      const recommendation = agent.getNextQuestionRecommendation('mathematics');

      expect(recommendation.difficulty).toBe('intermediate');
    });

    it('should vary question types', () => {
      const types = new Set<string>();

      for (let i = 0; i < 20; i++) {
        const recommendation = agent.getNextQuestionRecommendation('mathematics');
        types.add(recommendation.type);
      }

      // Should have multiple types due to randomization
      expect(types.size).toBeGreaterThan(1);
    });

    it('should provide reason for recommendation', () => {
      const recommendation = agent.getNextQuestionRecommendation('mathematics');

      expect(recommendation.reason).toBeTruthy();
      expect(recommendation.reason.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 7: Topic Suggestions
   */
  describe('Topic Suggestions', () => {
    it('should suggest beginner topics for mathematics', () => {
      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');

      expect(recommendation.suggestedTopics).toContain('Addition');
      expect(recommendation.suggestedTopics).toContain('Subtraction');
    });

    it('should suggest intermediate topics for mathematics', () => {
      const recommendation = agent.getNextDifficulty('mathematics', 'intermediate');

      expect(recommendation.suggestedTopics).toContain('Algebra');
      expect(recommendation.suggestedTopics).toContain('Geometry');
    });

    it('should suggest advanced topics for mathematics', () => {
      const recommendation = agent.getNextDifficulty('mathematics', 'advanced');

      expect(recommendation.suggestedTopics).toContain('Calculus');
      expect(recommendation.suggestedTopics).toContain('Trigonometry');
    });

    it('should suggest finance topics', () => {
      const recommendation = agent.getNextDifficulty('finance', 'beginner');

      expect(recommendation.suggestedTopics).toContain('Budgeting');
      expect(recommendation.suggestedTopics).toContain('Saving');
    });

    it('should suggest agriculture topics', () => {
      const recommendation = agent.getNextDifficulty('agriculture', 'beginner');

      expect(recommendation.suggestedTopics).toContain('Crop Rotation');
      expect(recommendation.suggestedTopics).toContain('Soil Health');
    });
  });

  /**
   * Test Suite 8: Singleton Instance
   */
  describe('Singleton Instance', () => {
    it('should return same instance for same user', () => {
      const agent1 = getAdaptiveAgent(userId, progressTracker);
      const agent2 = getAdaptiveAgent(userId, progressTracker);

      expect(agent1).toBe(agent2);
    });

    it('should return different instances for different users', () => {
      const tracker1 = getProgressTracker('user-1');
      const tracker2 = getProgressTracker('user-2');

      const agent1 = getAdaptiveAgent('user-1', tracker1);
      const agent2 = getAdaptiveAgent('user-2', tracker2);

      expect(agent1).not.toBe(agent2);
    });
  });

  /**
   * Test Suite 9: Integration with Progress Tracker
   */
  describe('Integration with Progress Tracker', () => {
    it('should work with progress tracker data', () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i < 8,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');
      const path = agent.getPersonalizedLearningPath('mathematics');
      const motivation = agent.getMotivationalMessage('mathematics');

      expect(recommendation).toBeDefined();
      expect(path).toBeDefined();
      expect(motivation).toBeDefined();
    });

    it('should adapt based on multiple sessions', () => {
      for (let session = 0; session < 3; session++) {
        progressTracker.startSession(`session-${session}`, 'mathematics', 'beginner');
        for (let i = 0; i < 5; i++) {
          progressTracker.recordAnswer({
            questionId: `q-${session}-${i}`,
            userId,
            answer: 'opt-1',
            isCorrect: true,
            timeTaken: 5000,
            attemptNumber: 1,
            submittedAt: new Date(),
          });
        }
        progressTracker.endSession();
      }

      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');

      expect(recommendation.nextDifficulty).toBe('intermediate');
    });
  });

  /**
   * Test Suite 10: Edge Cases
   */
  describe('Edge Cases', () => {
    it('should handle zero success rate', () => {
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
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');

      expect(recommendation).toBeDefined();
      expect(recommendation.encouragement).toBeTruthy();
    });

    it('should handle 100% success rate', () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 10; i++) {
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
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');

      expect(recommendation.nextDifficulty).toBe('intermediate');
      expect(recommendation.encouragement).toContain('Outstanding');
    });

    it('should handle very few attempts', () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      progressTracker.recordAnswer({
        questionId: 'q-001',
        userId,
        answer: 'opt-1',
        isCorrect: true,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');

      expect(recommendation).toBeDefined();
    });

    it('should handle many attempts', () => {
      progressTracker.startSession('session-1', 'mathematics', 'beginner');
      for (let i = 0; i < 100; i++) {
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
      progressTracker.endSession();

      const recommendation = agent.getNextDifficulty('mathematics', 'beginner');

      expect(recommendation).toBeDefined();
    });
  });
});
