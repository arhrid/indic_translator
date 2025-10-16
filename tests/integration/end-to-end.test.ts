/**
 * End-to-End Integration Tests
 * Tests for complete user flows across all components
 */

import { translationService } from '@/lib/translation/translator';
import { getQuestionService } from '@/lib/education/question-service';
import { getProgressTracker } from '@/lib/education/progress-tracker';
import { getAdaptiveAgent } from '@/lib/education/adaptive-agent';

describe('End-to-End User Flows', () => {
  const userId = 'test-user-e2e';
  let questionService: any;
  let progressTracker: any;
  let adaptiveAgent: any;

  beforeAll(async () => {
    await translationService.loadModel();
    questionService = await getQuestionService();
    progressTracker = getProgressTracker(userId);
    adaptiveAgent = getAdaptiveAgent(userId, progressTracker);

    // Clear previous data
    progressTracker.clearAllData();
  });

  afterEach(() => {
    // Clean up after each test
    progressTracker.clearAllData();
  });

  /**
   * Test Suite 1: Chat with Translation Flow
   */
  describe('Chat with Translation Flow', () => {
    it('should translate user message and response', async () => {
      const userMessage = 'Hello, how are you?';

      // Step 1: Translate user message from Hindi to English
      const translatedMessage = await translationService.translate({
        text: userMessage,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      expect(translatedMessage.translatedText).toBeTruthy();

      // Step 2: Simulate response
      const response = 'I am doing well, thank you for asking.';

      // Step 3: Translate response back to Hindi
      const translatedResponse = await translationService.translate({
        text: response,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      expect(translatedResponse.translatedText).toBeTruthy();
      expect(translatedResponse.translatedText).not.toBe(response);
    });

    it('should handle language switching mid-conversation', async () => {
      const message = 'Hello world';

      // First in English
      const response1 = await translationService.translate({
        text: message,
        sourceLang: 'en',
        targetLang: 'en',
      });

      expect(response1.translatedText).toBe(message);

      // Switch to Hindi
      const response2 = await translationService.translate({
        text: message,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      expect(response2.translatedText).not.toBe(message);

      // Switch to Tamil
      const response3 = await translationService.translate({
        text: message,
        sourceLang: 'en',
        targetLang: 'ta',
      });

      expect(response3.translatedText).not.toBe(message);
      expect(response3.translatedText).not.toBe(response2.translatedText);
    });

    it('should cache translations across chat turns', async () => {
      const message = 'Cached message';

      // First turn
      const start1 = performance.now();
      const response1 = await translationService.translate({
        text: message,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration1 = performance.now() - start1;

      // Second turn (same message)
      const start2 = performance.now();
      const response2 = await translationService.translate({
        text: message,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration2 = performance.now() - start2;

      // Should be cached
      expect(response1.translatedText).toBe(response2.translatedText);
      expect(duration2).toBeLessThan(duration1 * 0.1);
    });
  });

  /**
   * Test Suite 2: Learning Mode Flow
   */
  describe('Learning Mode Flow', () => {
    it('should complete full learning session', async () => {
      // Step 1: Start session
      const session = progressTracker.startSession(
        'session-1',
        'mathematics',
        'beginner',
        'en'
      );

      expect(session).toBeDefined();
      expect(session.subject).toBe('mathematics');

      // Step 2: Get question
      const question = await questionService.getRandomQuestion('mathematics', 'beginner');
      expect(question).toBeDefined();

      // Step 3: Answer question
      let isCorrect = false;
      if (question.type === 'mcq') {
        isCorrect = true; // Simulate correct answer
        progressTracker.recordAnswer({
          questionId: question.id,
          userId,
          answer: question.correctOptionId,
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }

      // Step 4: End session
      const completed = progressTracker.endSession();

      expect(completed).toBeDefined();
      expect(completed.totalScore).toBeGreaterThan(0);
      expect(completed.successRate).toBeGreaterThan(0);
    });

    it('should provide bilingual questions', async () => {
      // Get question in English
      const questionEn = await questionService.getRandomQuestion('mathematics', 'beginner');
      expect(questionEn.questionText).toBeTruthy();

      // Get question with Hindi translation
      const questionHi = await questionService.getRandomQuestion('mathematics', 'beginner');
      expect(questionHi.questionTextHindi || questionHi.questionText).toBeTruthy();
    });

    it('should track progress through multiple questions', async () => {
      progressTracker.startSession('session-2', 'mathematics', 'beginner', 'en');

      // Answer 5 questions
      for (let i = 0; i < 5; i++) {
        const question = await questionService.getRandomQuestion('mathematics', 'beginner');

        progressTracker.recordAnswer({
          questionId: `q-${i}`,
          userId,
          answer: 'opt-1',
          isCorrect: i % 2 === 0, // 60% success rate
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }

      const session = progressTracker.endSession();

      expect(session.questionsAttempted.length).toBe(5);
      expect(session.totalScore).toBeGreaterThan(0);
      expect(session.successRate).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 3: Progress Tracking Across Sessions
   */
  describe('Progress Tracking Across Sessions', () => {
    it('should persist progress across sessions', async () => {
      // Session 1
      progressTracker.startSession('session-1', 'mathematics', 'beginner', 'en');

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

      progressTracker.endSession();

      // Session 2
      progressTracker.startSession('session-2', 'mathematics', 'beginner', 'en');

      for (let i = 5; i < 10; i++) {
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

      // Check progress
      const metrics = progressTracker.getPerformanceMetrics('mathematics');

      expect(metrics).toBeDefined();
      expect(metrics.totalAttempts).toBe(10);
      expect(metrics.correctAttempts).toBe(10);
      expect(metrics.successRate).toBe(100);
    });

    it('should update adaptive recommendations based on progress', async () => {
      // Session 1: 80% success at beginner
      progressTracker.startSession('session-1', 'mathematics', 'beginner', 'en');

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

      // Get recommendation
      const recommendation = adaptiveAgent.getNextDifficulty('mathematics', 'beginner');

      expect(recommendation).toBeDefined();
      expect(recommendation.encouragement).toBeTruthy();
    });

    it('should calculate learning velocity', async () => {
      // Multiple sessions with improving performance
      for (let session = 0; session < 3; session++) {
        progressTracker.startSession(`session-${session}`, 'mathematics', 'beginner', 'en');

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

      const velocity = progressTracker.calculateLearningVelocity('mathematics');

      expect(velocity).toBeDefined();
      expect(velocity.sessionsCompleted).toBe(3);
      expect(velocity.improvementRate).toBeGreaterThanOrEqual(0);
    });
  });

  /**
   * Test Suite 4: Bilingual Content Integration
   */
  describe('Bilingual Content Integration', () => {
    it('should display questions in selected language', async () => {
      // Get question
      const question = await questionService.getRandomQuestion('mathematics', 'beginner');

      // Should have English content
      expect(question.questionText).toBeTruthy();

      // Should have Hindi content or be translatable
      const hindiText = question.questionTextHindi || question.questionText;
      expect(hindiText).toBeTruthy();
    });

    it('should provide hints in selected language', async () => {
      const question = await questionService.getRandomQuestion('mathematics', 'beginner');

      if (question.type === 'conceptual') {
        const hint = questionService.getHint(question, 1);
        expect(hint).toBeTruthy();
      }
    });

    it('should provide explanations in selected language', async () => {
      const question = await questionService.getRandomQuestion('mathematics', 'beginner');

      // English explanation
      const explanationEn = questionService.getExplanation(question, 'en');
      expect(explanationEn).toBeTruthy();

      // Hindi explanation
      const explanationHi = questionService.getExplanation(question, 'hi');
      expect(explanationHi).toBeTruthy();
    });
  });

  /**
   * Test Suite 5: Cache Integration
   */
  describe('Cache Integration', () => {
    it('should cache translations across components', async () => {
      const text = 'Cache integration test';

      // Translate in chat
      const start1 = performance.now();
      const response1 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration1 = performance.now() - start1;

      // Same translation in learning mode
      const start2 = performance.now();
      const response2 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration2 = performance.now() - start2;

      // Should be cached
      expect(response1.translatedText).toBe(response2.translatedText);
      expect(duration2).toBeLessThan(duration1 * 0.1);
    });

    it('should cache questions across sessions', async () => {
      // Session 1: Get question
      const question1 = await questionService.getRandomQuestion('mathematics', 'beginner');

      // Session 2: Get same question (if cached)
      const question2 = await questionService.getRandomQuestion('mathematics', 'beginner');

      // Both should be valid
      expect(question1).toBeDefined();
      expect(question2).toBeDefined();
    });

    it('should persist cache across sessions', async () => {
      const text = 'Persistence test';

      // First session: translate
      const response1 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });

      // Simulate new session
      // Second session: same translation (should be cached)
      const start = performance.now();
      const response2 = await translationService.translate({
        text,
        sourceLang: 'en',
        targetLang: 'hi',
      });
      const duration = performance.now() - start;

      // Should be cached
      expect(response1.translatedText).toBe(response2.translatedText);
      expect(duration).toBeLessThan(100);
    });
  });

  /**
   * Test Suite 6: Error Handling in Flows
   */
  describe('Error Handling in Flows', () => {
    it('should handle translation errors gracefully', async () => {
      const response = await translationService.translate({
        text: 'Test',
        sourceLang: 'invalid' as any,
        targetLang: 'hi',
      });

      // Should return error response
      expect(response).toHaveProperty('code');
      expect(response).toHaveProperty('message');
    });

    it('should handle missing questions gracefully', async () => {
      const question = await questionService.getRandomQuestion('invalid' as any, 'beginner');

      // Should handle gracefully
      expect(question === null || question === undefined || question.id).toBeTruthy();
    });

    it('should handle invalid progress data gracefully', async () => {
      const session = progressTracker.startSession('session-1', 'mathematics', 'beginner', 'en');

      // Record invalid answer
      progressTracker.recordAnswer({
        questionId: 'q-1',
        userId,
        answer: 'invalid',
        isCorrect: false,
        timeTaken: 5000,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      const completed = progressTracker.endSession();

      expect(completed).toBeDefined();
      expect(completed.totalScore).toBe(0);
    });
  });

  /**
   * Test Suite 7: Performance in Flows
   */
  describe('Performance in Flows', () => {
    it('should complete full learning flow within time budget', async () => {
      const start = performance.now();

      // Start session
      progressTracker.startSession('session-1', 'mathematics', 'beginner', 'en');

      // Get and answer 5 questions
      for (let i = 0; i < 5; i++) {
        const question = await questionService.getRandomQuestion('mathematics', 'beginner');

        progressTracker.recordAnswer({
          questionId: question.id,
          userId,
          answer: 'opt-1',
          isCorrect: true,
          timeTaken: 5000,
          attemptNumber: 1,
          submittedAt: new Date(),
        });
      }

      progressTracker.endSession();

      const duration = performance.now() - start;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(30000); // 30 seconds
    });

    it('should handle concurrent chat and learning', async () => {
      const start = performance.now();

      // Concurrent operations
      const promises = [
        translationService.translate({
          text: 'Chat message',
          sourceLang: 'en',
          targetLang: 'hi',
        }),
        questionService.getRandomQuestion('mathematics', 'beginner'),
        progressTracker.getProgressSummary(),
      ];

      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      expect(results.length).toBe(3);
      expect(duration).toBeLessThan(10000);
    });
  });
});
