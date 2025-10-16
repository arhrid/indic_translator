/**
 * Adaptive Difficulty Agent
 * Analyzes user performance and adapts question difficulty dynamically
 */

import { Subject, DifficultyLevel } from './question-types';
import { ProgressTracker, PerformanceMetrics, WeakArea } from './progress-tracker';

/**
 * Agent recommendation
 */
export interface AgentRecommendation {
  nextDifficulty: DifficultyLevel;
  reason: string;
  encouragement: string;
  suggestedTopics: string[];
  reviewTopics: string[];
}

/**
 * Adaptive Agent Class
 */
export class AdaptiveAgent {
  private progressTracker: ProgressTracker;
  private readonly SUCCESS_THRESHOLD_EASY = 85; // Move to intermediate if > 85%
  private readonly SUCCESS_THRESHOLD_MEDIUM = 75; // Move to advanced if > 75%
  private readonly SUCCESS_THRESHOLD_HARD = 60; // Stay at advanced if > 60%
  private readonly FAILURE_THRESHOLD = 50; // Move down if < 50%

  constructor(progressTracker: ProgressTracker) {
    this.progressTracker = progressTracker;
  }

  /**
   * Get next recommended difficulty
   */
  getNextDifficulty(subject: Subject, currentDifficulty: DifficultyLevel): AgentRecommendation {
    const metrics = this.progressTracker.getPerformanceMetrics(subject);

    if (!metrics) {
      return this.getInitialRecommendation(subject);
    }

    const difficultyMetrics = metrics.byDifficulty[currentDifficulty];
    const successRate = difficultyMetrics.rate;

    let nextDifficulty = currentDifficulty;
    let reason = '';

    // Determine next difficulty based on performance
    if (currentDifficulty === 'beginner') {
      if (successRate >= this.SUCCESS_THRESHOLD_EASY) {
        nextDifficulty = 'intermediate';
        reason = `Excellent performance at beginner level (${successRate.toFixed(1)}%). Ready for intermediate challenges.`;
      } else if (successRate < this.FAILURE_THRESHOLD) {
        reason = `Keep practicing at beginner level (${successRate.toFixed(1)}%). You'll improve with more practice.`;
      } else {
        reason = `Good progress at beginner level (${successRate.toFixed(1)}%). Continue practicing to master these concepts.`;
      }
    } else if (currentDifficulty === 'intermediate') {
      if (successRate >= this.SUCCESS_THRESHOLD_MEDIUM) {
        nextDifficulty = 'advanced';
        reason = `Great performance at intermediate level (${successRate.toFixed(1)}%). Ready for advanced questions.`;
      } else if (successRate < this.FAILURE_THRESHOLD) {
        nextDifficulty = 'beginner';
        reason = `Let's review beginner concepts (${successRate.toFixed(1)}%). Building a strong foundation helps with advanced topics.`;
      } else {
        reason = `Solid progress at intermediate level (${successRate.toFixed(1)}%). Keep practicing to reach advanced.`;
      }
    } else if (currentDifficulty === 'advanced') {
      if (successRate >= this.SUCCESS_THRESHOLD_HARD) {
        reason = `Excellent mastery at advanced level (${successRate.toFixed(1)}%). You're doing great!`;
      } else if (successRate < this.FAILURE_THRESHOLD) {
        nextDifficulty = 'intermediate';
        reason = `Let's review intermediate concepts (${successRate.toFixed(1)}%). Advanced topics build on these foundations.`;
      } else {
        reason = `Good effort at advanced level (${successRate.toFixed(1)}%). Keep challenging yourself.`;
      }
    }

    const encouragement = this.generateEncouragement(successRate, currentDifficulty);
    const suggestedTopics = this.getSuggestedTopics(subject, nextDifficulty);
    const reviewTopics = this.getReviewTopics(subject);

    return {
      nextDifficulty,
      reason,
      encouragement,
      suggestedTopics,
      reviewTopics,
    };
  }

  /**
   * Get initial recommendation for new user
   */
  private getInitialRecommendation(subject: Subject): AgentRecommendation {
    return {
      nextDifficulty: 'beginner',
      reason: 'Starting with beginner level to build a strong foundation.',
      encouragement: 'Welcome! Let\'s start with some fundamental concepts.',
      suggestedTopics: this.getSuggestedTopics(subject, 'beginner'),
      reviewTopics: [],
    };
  }

  /**
   * Generate encouragement message
   */
  private generateEncouragement(successRate: number, difficulty: DifficultyLevel): string {
    if (successRate >= 90) {
      return '🌟 Outstanding! You\'re mastering this material!';
    } else if (successRate >= 80) {
      return '👏 Excellent work! You\'re making great progress!';
    } else if (successRate >= 70) {
      return '💪 Good job! You\'re on the right track!';
    } else if (successRate >= 60) {
      return '📚 Keep going! Every question helps you learn!';
    } else if (successRate >= 50) {
      return '🎯 Don\'t give up! Let\'s focus on the basics!';
    } else {
      return '🤔 Take your time. Learning is a journey!';
    }
  }

  /**
   * Get suggested topics based on difficulty
   */
  private getSuggestedTopics(subject: Subject, difficulty: DifficultyLevel): string[] {
    const topicMap: Record<Subject, Record<DifficultyLevel, string[]>> = {
      mathematics: {
        beginner: ['Addition', 'Subtraction', 'Multiplication', 'Division'],
        intermediate: ['Algebra', 'Geometry', 'Fractions', 'Decimals'],
        advanced: ['Calculus', 'Trigonometry', 'Statistics', 'Probability'],
      },
      finance: {
        beginner: ['Budgeting', 'Saving', 'Basic Interest', 'Income & Expenses'],
        intermediate: ['Investments', 'Stocks & Bonds', 'Compound Interest', 'Loans'],
        advanced: ['Portfolio Management', 'CAPM', 'Risk Analysis', 'Derivatives'],
      },
      agriculture: {
        beginner: ['Crop Rotation', 'Soil Health', 'Watering', 'Pest Control'],
        intermediate: ['Sustainable Farming', 'Fertilizers', 'Crop Selection', 'Yield'],
        advanced: ['Precision Farming', 'Data Analytics', 'Climate Adaptation', 'Biotech'],
      },
    };

    return topicMap[subject]?.[difficulty] || [];
  }

  /**
   * Get topics that need review
   */
  private getReviewTopics(subject: Subject): string[] {
    const weakAreas = this.progressTracker.identifyWeakAreas(70);
    const subjectWeakAreas = weakAreas.filter(area => area.subject === subject);

    return subjectWeakAreas.flatMap(area => area.recommendedReview);
  }

  /**
   * Get spaced repetition schedule
   */
  getSpacedRepetitionSchedule(questionId: string, correctAttempts: number): number {
    // Simple spaced repetition: increase intervals based on correct attempts
    // Intervals: 1 day, 3 days, 7 days, 14 days, 30 days
    const intervals = [1, 3, 7, 14, 30];
    const intervalIndex = Math.min(correctAttempts, intervals.length - 1);
    return intervals[intervalIndex] * 24 * 60 * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Should show question again (spaced repetition)
   */
  shouldShowQuestionAgain(
    lastAttemptedAt: Date,
    correctAttempts: number,
    lastCorrect: boolean
  ): boolean {
    if (!lastCorrect) {
      // Show incorrect answers again soon
      return true;
    }

    const interval = this.getSpacedRepetitionSchedule('', correctAttempts);
    const timeSinceLastAttempt = Date.now() - lastAttemptedAt.getTime();

    return timeSinceLastAttempt >= interval;
  }

  /**
   * Get personalized learning path
   */
  getPersonalizedLearningPath(subject: Subject): {
    currentFocus: DifficultyLevel;
    nextMilestone: string;
    progressToNextMilestone: number;
    estimatedTimeToMastery: number;
  } {
    const metrics = this.progressTracker.getPerformanceMetrics(subject);

    if (!metrics) {
      return {
        currentFocus: 'beginner',
        nextMilestone: 'Complete 10 beginner questions',
        progressToNextMilestone: 0,
        estimatedTimeToMastery: 30, // days
      };
    }

    let currentFocus: DifficultyLevel = 'beginner';
    let nextMilestone = '';
    let progressToNextMilestone = 0;
    let estimatedTimeToMastery = 30;

    // Determine current focus
    if (metrics.byDifficulty.advanced.attempts > 0 && metrics.byDifficulty.advanced.rate >= 60) {
      currentFocus = 'advanced';
      nextMilestone = 'Achieve 80% success rate at advanced level';
      progressToNextMilestone = Math.min(
        100,
        (metrics.byDifficulty.advanced.rate / 80) * 100
      );
      estimatedTimeToMastery = 60;
    } else if (
      metrics.byDifficulty.intermediate.attempts > 0 &&
      metrics.byDifficulty.intermediate.rate >= 70
    ) {
      currentFocus = 'intermediate';
      nextMilestone = 'Achieve 75% success rate at intermediate level';
      progressToNextMilestone = Math.min(
        100,
        (metrics.byDifficulty.intermediate.rate / 75) * 100
      );
      estimatedTimeToMastery = 45;
    } else {
      currentFocus = 'beginner';
      nextMilestone = 'Achieve 85% success rate at beginner level';
      progressToNextMilestone = Math.min(
        100,
        (metrics.byDifficulty.beginner.rate / 85) * 100
      );
      estimatedTimeToMastery = 30;
    }

    return {
      currentFocus,
      nextMilestone,
      progressToNextMilestone,
      estimatedTimeToMastery,
    };
  }

  /**
   * Get motivational message
   */
  getMotivationalMessage(subject: Subject): string {
    const summary = this.progressTracker.getProgressSummary();
    const metrics = this.progressTracker.getPerformanceMetrics(subject);

    if (!metrics) {
      return `Let's start learning ${subject}! Every expert was once a beginner.`;
    }

    const velocity = this.progressTracker.calculateLearningVelocity(subject);

    if (velocity.improvementRate > 15) {
      return `🚀 Amazing progress in ${subject}! Your improvement rate is outstanding!`;
    } else if (velocity.improvementRate > 5) {
      return `📈 Great improvement in ${subject}! Keep up the momentum!`;
    } else if (metrics.successRate >= 80) {
      return `💯 You're doing great in ${subject}! Keep practicing!`;
    } else if (metrics.successRate >= 60) {
      return `🎯 You're making progress in ${subject}! Stay consistent!`;
    } else {
      return `🌱 Every step counts! Keep practicing ${subject}!`;
    }
  }

  /**
   * Get next question recommendation
   */
  getNextQuestionRecommendation(subject: Subject): {
    difficulty: DifficultyLevel;
    type: 'mcq' | 'conceptual' | 'numerical';
    reason: string;
  } {
    const metrics = this.progressTracker.getPerformanceMetrics(subject);

    // Determine difficulty
    let difficulty: DifficultyLevel = 'beginner';
    if (metrics) {
      if (metrics.byDifficulty.advanced.rate >= 60 && metrics.byDifficulty.advanced.attempts > 5) {
        difficulty = 'advanced';
      } else if (
        metrics.byDifficulty.intermediate.rate >= 70 &&
        metrics.byDifficulty.intermediate.attempts > 5
      ) {
        difficulty = 'intermediate';
      }
    }

    // Determine question type (vary for better learning)
    const types: Array<'mcq' | 'conceptual' | 'numerical'> = [
      'mcq',
      'conceptual',
      'numerical',
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const reason = `${difficulty} level ${randomType} question to reinforce your learning.`;

    return {
      difficulty,
      type: randomType,
      reason,
    };
  }
}

/**
 * Get or create adaptive agent
 */
const agentInstances: Map<string, AdaptiveAgent> = new Map();

export function getAdaptiveAgent(
  userId: string,
  progressTracker: ProgressTracker
): AdaptiveAgent {
  if (!agentInstances.has(userId)) {
    agentInstances.set(userId, new AdaptiveAgent(progressTracker));
  }
  return agentInstances.get(userId)!;
}

export default AdaptiveAgent;
