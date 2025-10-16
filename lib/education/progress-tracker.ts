/**
 * User Progress Tracker
 * Tracks learning progress, performance metrics, and learning velocity
 */

import { Subject, DifficultyLevel, UserAnswer } from './question-types';

/**
 * Performance metrics for a subject
 */
export interface PerformanceMetrics {
  subject: Subject;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  averageTimeTaken: number;
  byDifficulty: {
    beginner: { attempts: number; correct: number; rate: number };
    intermediate: { attempts: number; correct: number; rate: number };
    advanced: { attempts: number; correct: number; rate: number };
  };
  lastAttemptedAt: Date;
  firstAttemptedAt: Date;
}

/**
 * Learning velocity metrics
 */
export interface LearningVelocity {
  subject: Subject;
  improvementRate: number; // percentage improvement over time
  sessionsCompleted: number;
  averageSessionLength: number;
  consistencyScore: number; // 0-100, based on regular practice
  lastSevenDays: {
    attempts: number;
    correct: number;
    rate: number;
  };
}

/**
 * Weak areas identification
 */
export interface WeakArea {
  subject: Subject;
  difficulty: DifficultyLevel;
  successRate: number;
  questionsAttempted: string[];
  recommendedReview: string[];
}

/**
 * User session data
 */
export interface SessionData {
  sessionId: string;
  userId: string;
  subject: Subject;
  difficulty: DifficultyLevel;
  startedAt: Date;
  endedAt?: Date;
  questionsAttempted: UserAnswer[];
  totalScore: number;
  successRate: number;
  duration: number;
  language: 'en' | 'hi';
}

/**
 * Progress Tracker Class
 */
export class ProgressTracker {
  private userId: string;
  private performanceData: Map<Subject, PerformanceMetrics> = new Map();
  private sessionHistory: SessionData[] = [];
  private currentSession: SessionData | null = null;
  private readonly STORAGE_KEY_PREFIX = 'progress_';
  private readonly SESSION_STORAGE_KEY = 'current_session_';

  constructor(userId: string) {
    this.userId = userId;
    this.loadFromStorage();
  }

  /**
   * Start a new session
   */
  startSession(
    sessionId: string,
    subject: Subject,
    difficulty: DifficultyLevel,
    language: 'en' | 'hi' = 'en'
  ): SessionData {
    this.currentSession = {
      sessionId,
      userId: this.userId,
      subject,
      difficulty,
      startedAt: new Date(),
      questionsAttempted: [],
      totalScore: 0,
      successRate: 0,
      duration: 0,
      language,
    };

    this.saveCurrentSessionToStorage();
    return this.currentSession;
  }

  /**
   * End current session
   */
  endSession(): SessionData | null {
    if (!this.currentSession) {
      return null;
    }

    const duration = Date.now() - this.currentSession.startedAt.getTime();
    const correctAttempts = this.currentSession.questionsAttempted.filter(
      q => q.isCorrect
    ).length;
    const successRate =
      this.currentSession.questionsAttempted.length > 0
        ? (correctAttempts / this.currentSession.questionsAttempted.length) * 100
        : 0;

    this.currentSession.endedAt = new Date();
    this.currentSession.duration = duration;
    this.currentSession.successRate = successRate;
    this.currentSession.totalScore = correctAttempts;

    // Add to history
    this.sessionHistory.push(this.currentSession);

    // Update performance metrics
    this.updatePerformanceMetrics(this.currentSession);

    // Save to storage
    this.saveToStorage();
    this.clearCurrentSessionFromStorage();

    const completedSession = this.currentSession;
    this.currentSession = null;

    return completedSession;
  }

  /**
   * Record answer in current session
   */
  recordAnswer(answer: UserAnswer): void {
    if (!this.currentSession) {
      console.warn('No active session to record answer');
      return;
    }

    this.currentSession.questionsAttempted.push(answer);
    this.saveCurrentSessionToStorage();
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Get session history
   */
  getSessionHistory(subject?: Subject, limit?: number): SessionData[] {
    let history = this.sessionHistory;

    if (subject) {
      history = history.filter(s => s.subject === subject);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(session: SessionData): void {
    const subject = session.subject;
    let metrics = this.performanceData.get(subject);

    if (!metrics) {
      metrics = {
        subject,
        totalAttempts: 0,
        correctAttempts: 0,
        successRate: 0,
        averageTimeTaken: 0,
        byDifficulty: {
          beginner: { attempts: 0, correct: 0, rate: 0 },
          intermediate: { attempts: 0, correct: 0, rate: 0 },
          advanced: { attempts: 0, correct: 0, rate: 0 },
        },
        lastAttemptedAt: new Date(),
        firstAttemptedAt: new Date(),
      };
    }

    // Update overall metrics
    const correctCount = session.questionsAttempted.filter(q => q.isCorrect).length;
    const totalCount = session.questionsAttempted.length;

    metrics.totalAttempts += totalCount;
    metrics.correctAttempts += correctCount;
    metrics.successRate = (metrics.correctAttempts / metrics.totalAttempts) * 100;

    // Calculate average time
    const totalTime = session.questionsAttempted.reduce((sum, q) => sum + q.timeTaken, 0);
    const avgTime = totalTime / totalCount;
    metrics.averageTimeTaken =
      (metrics.averageTimeTaken * (metrics.totalAttempts - totalCount) + totalTime) /
      metrics.totalAttempts;

    // Update difficulty-specific metrics
    const difficultyMetrics = metrics.byDifficulty[session.difficulty];
    difficultyMetrics.attempts += totalCount;
    difficultyMetrics.correct += correctCount;
    difficultyMetrics.rate = (difficultyMetrics.correct / difficultyMetrics.attempts) * 100;

    metrics.lastAttemptedAt = new Date();

    this.performanceData.set(subject, metrics);
  }

  /**
   * Get performance metrics for subject
   */
  getPerformanceMetrics(subject: Subject): PerformanceMetrics | null {
    return this.performanceData.get(subject) || null;
  }

  /**
   * Get all performance metrics
   */
  getAllPerformanceMetrics(): PerformanceMetrics[] {
    return Array.from(this.performanceData.values());
  }

  /**
   * Calculate learning velocity
   */
  calculateLearningVelocity(subject: Subject): LearningVelocity {
    const metrics = this.performanceData.get(subject);
    const sessions = this.sessionHistory.filter(s => s.subject === subject);

    if (!metrics || sessions.length === 0) {
      return {
        subject,
        improvementRate: 0,
        sessionsCompleted: 0,
        averageSessionLength: 0,
        consistencyScore: 0,
        lastSevenDays: { attempts: 0, correct: 0, rate: 0 },
      };
    }

    // Calculate improvement rate
    const firstHalf = sessions.slice(0, Math.floor(sessions.length / 2));
    const secondHalf = sessions.slice(Math.floor(sessions.length / 2));

    const firstHalfRate =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, s) => sum + s.successRate, 0) / firstHalf.length
        : 0;
    const secondHalfRate =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, s) => sum + s.successRate, 0) / secondHalf.length
        : 0;

    const improvementRate = secondHalfRate - firstHalfRate;

    // Calculate average session length
    const averageSessionLength =
      sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;

    // Calculate consistency score (based on regular practice)
    const consistencyScore = this.calculateConsistencyScore(sessions);

    // Calculate last 7 days metrics
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastSevenDaysSessions = sessions.filter(s => s.startedAt > sevenDaysAgo);

    const lastSevenDaysAttempts = lastSevenDaysSessions.reduce(
      (sum, s) => sum + s.questionsAttempted.length,
      0
    );
    const lastSevenDaysCorrect = lastSevenDaysSessions.reduce(
      (sum, s) => sum + s.totalScore,
      0
    );
    const lastSevenDaysRate =
      lastSevenDaysAttempts > 0 ? (lastSevenDaysCorrect / lastSevenDaysAttempts) * 100 : 0;

    return {
      subject,
      improvementRate,
      sessionsCompleted: sessions.length,
      averageSessionLength,
      consistencyScore,
      lastSevenDays: {
        attempts: lastSevenDaysAttempts,
        correct: lastSevenDaysCorrect,
        rate: lastSevenDaysRate,
      },
    };
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(sessions: SessionData[]): number {
    if (sessions.length === 0) return 0;

    // Sort sessions by date
    const sortedSessions = [...sessions].sort(
      (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
    );

    // Calculate days with practice
    const daysWithPractice = new Set<string>();
    sortedSessions.forEach(s => {
      const dateStr = s.startedAt.toISOString().split('T')[0];
      daysWithPractice.add(dateStr);
    });

    // Calculate consistency (0-100)
    const daySpan = Math.max(
      1,
      (sortedSessions[sortedSessions.length - 1].startedAt.getTime() -
        sortedSessions[0].startedAt.getTime()) /
        (24 * 60 * 60 * 1000)
    );

    return Math.min(100, (daysWithPractice.size / daySpan) * 100);
  }

  /**
   * Identify weak areas
   */
  identifyWeakAreas(threshold: number = 70): WeakArea[] {
    const weakAreas: WeakArea[] = [];

    this.performanceData.forEach((metrics, subject) => {
      // Check overall performance
      if (metrics.successRate < threshold) {
        weakAreas.push({
          subject,
          difficulty: 'beginner',
          successRate: metrics.byDifficulty.beginner.rate,
          questionsAttempted: [],
          recommendedReview: ['Basic concepts', 'Fundamentals'],
        });
      }

      // Check by difficulty
      Object.entries(metrics.byDifficulty).forEach(([difficulty, stats]) => {
        if (stats.rate < threshold && stats.attempts > 0) {
          weakAreas.push({
            subject,
            difficulty: difficulty as DifficultyLevel,
            successRate: stats.rate,
            questionsAttempted: [],
            recommendedReview: [
              `Review ${difficulty} level concepts`,
              'Practice more questions',
            ],
          });
        }
      });
    });

    return weakAreas;
  }

  /**
   * Get recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const weakAreas = this.identifyWeakAreas();

    if (weakAreas.length === 0) {
      recommendations.push('Great job! Keep practicing to maintain your progress.');
    } else {
      weakAreas.forEach(area => {
        recommendations.push(
          `Focus on ${area.difficulty} level ${area.subject} (${area.successRate.toFixed(1)}% success rate)`
        );
      });
    }

    // Check learning velocity
    const subjects: Subject[] = ['mathematics', 'finance', 'agriculture'];
    subjects.forEach(subject => {
      const velocity = this.calculateLearningVelocity(subject);
      if (velocity.improvementRate > 10) {
        recommendations.push(`Excellent improvement in ${subject}! Keep it up.`);
      }
    });

    return recommendations;
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        performanceData: Array.from(this.performanceData.entries()),
        sessionHistory: this.sessionHistory,
      };
      localStorage.setItem(
        `${this.STORAGE_KEY_PREFIX}${this.userId}`,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Failed to save progress to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${this.userId}`);
      if (data) {
        const parsed = JSON.parse(data);
        this.performanceData = new Map(parsed.performanceData);
        this.sessionHistory = parsed.sessionHistory;
      }
    } catch (error) {
      console.error('Failed to load progress from storage:', error);
    }
  }

  /**
   * Save current session to storage
   */
  private saveCurrentSessionToStorage(): void {
    if (!this.currentSession) return;

    try {
      localStorage.setItem(
        `${this.SESSION_STORAGE_KEY}${this.userId}`,
        JSON.stringify(this.currentSession)
      );
    } catch (error) {
      console.error('Failed to save current session:', error);
    }
  }

  /**
   * Clear current session from storage
   */
  private clearCurrentSessionFromStorage(): void {
    try {
      localStorage.removeItem(`${this.SESSION_STORAGE_KEY}${this.userId}`);
    } catch (error) {
      console.error('Failed to clear current session:', error);
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.performanceData.clear();
    this.sessionHistory = [];
    this.currentSession = null;

    try {
      localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${this.userId}`);
      localStorage.removeItem(`${this.SESSION_STORAGE_KEY}${this.userId}`);
    } catch (error) {
      console.error('Failed to clear data from storage:', error);
    }
  }

  /**
   * Export progress data
   */
  exportData(): {
    performanceData: PerformanceMetrics[];
    sessionHistory: SessionData[];
    recommendations: string[];
  } {
    return {
      performanceData: this.getAllPerformanceMetrics(),
      sessionHistory: this.sessionHistory,
      recommendations: this.getRecommendations(),
    };
  }

  /**
   * Get progress summary
   */
  getProgressSummary(): {
    totalSessions: number;
    totalQuestions: number;
    overallSuccessRate: number;
    subjectsStudied: Subject[];
    bestSubject: Subject | null;
    weakestSubject: Subject | null;
  } {
    const totalSessions = this.sessionHistory.length;
    const totalQuestions = this.sessionHistory.reduce(
      (sum, s) => sum + s.questionsAttempted.length,
      0
    );
    const totalCorrect = this.sessionHistory.reduce((sum, s) => sum + s.totalScore, 0);
    const overallSuccessRate = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    const subjectsStudied = Array.from(this.performanceData.keys());

    let bestSubject: Subject | null = null;
    let bestRate = -1;
    let weakestSubject: Subject | null = null;
    let weakestRate = 101;

    this.performanceData.forEach((metrics, subject) => {
      if (metrics.successRate > bestRate) {
        bestRate = metrics.successRate;
        bestSubject = subject;
      }
      if (metrics.successRate < weakestRate) {
        weakestRate = metrics.successRate;
        weakestSubject = subject;
      }
    });

    return {
      totalSessions,
      totalQuestions,
      overallSuccessRate,
      subjectsStudied,
      bestSubject,
      weakestSubject,
    };
  }
}

/**
 * Get or create progress tracker for user
 */
const trackerInstances: Map<string, ProgressTracker> = new Map();

export function getProgressTracker(userId: string): ProgressTracker {
  if (!trackerInstances.has(userId)) {
    trackerInstances.set(userId, new ProgressTracker(userId));
  }
  return trackerInstances.get(userId)!;
}

export default ProgressTracker;
