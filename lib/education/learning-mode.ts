/**
 * Learning Mode
 * Manages educational chat mode with question delivery and progress tracking
 */

import {
  Question,
  Subject,
  DifficultyLevel,
  UserProgress,
  LearningSession,
  UserAnswer,
} from './question-types';
import { QuestionService } from './question-service';

/**
 * Learning Mode Manager
 */
export class LearningModeManager {
  private questionService: QuestionService;
  private currentSession: LearningSession | null = null;
  private userProgress: Map<string, UserProgress> = new Map();
  private currentQuestion: Question | null = null;
  private sessionStartTime: number = 0;

  constructor(questionService: QuestionService) {
    this.questionService = questionService;
  }

  /**
   * Start a new learning session
   */
  async startSession(
    userId: string,
    subject: Subject,
    difficulty: DifficultyLevel = 'beginner'
  ): Promise<LearningSession> {
    this.sessionStartTime = Date.now();

    this.currentSession = {
      id: `session-${userId}-${Date.now()}`,
      userId,
      subject,
      difficulty,
      startedAt: new Date(),
      questionsAttempted: [],
      totalScore: 0,
      successRate: 0,
      duration: 0,
    };

    return this.currentSession;
  }

  /**
   * End current learning session
   */
  endSession(): LearningSession | null {
    if (!this.currentSession) {
      return null;
    }

    const duration = Date.now() - this.sessionStartTime;
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

    return this.currentSession;
  }

  /**
   * Get next question
   */
  async getNextQuestion(): Promise<Question | null> {
    if (!this.currentSession) {
      return null;
    }

    this.currentQuestion = await this.questionService.getRandomQuestion(
      this.currentSession.subject,
      this.currentSession.difficulty
    );

    return this.currentQuestion;
  }

  /**
   * Submit answer to current question
   */
  async submitAnswer(
    userId: string,
    answer: string | number,
    timeTaken: number
  ): Promise<{
    isCorrect: boolean;
    feedback: string;
    explanation: string;
  }> {
    if (!this.currentQuestion || !this.currentSession) {
      return {
        isCorrect: false,
        feedback: 'No question available',
        explanation: '',
      };
    }

    const { isCorrect, feedback } = this.questionService.checkAnswer(
      this.currentQuestion,
      answer
    );

    const explanation = this.questionService.getExplanation(
      this.currentQuestion,
      'en'
    );

    // Record answer
    const userAnswer = this.questionService.createUserAnswer(
      this.currentQuestion.id,
      userId,
      answer,
      isCorrect,
      timeTaken,
      1
    );

    this.currentSession.questionsAttempted.push(userAnswer);

    // Update progress
    this.updateUserProgress(userId, this.currentSession.subject, isCorrect);

    return {
      isCorrect,
      feedback,
      explanation,
    };
  }

  /**
   * Get hint for current question
   */
  getHint(hintLevel: 1 | 2 | 3): string | null {
    if (!this.currentQuestion || this.currentQuestion.type !== 'conceptual') {
      return null;
    }

    return this.questionService.getHint(
      this.currentQuestion as any,
      hintLevel
    );
  }

  /**
   * Skip current question
   */
  async skipQuestion(): Promise<Question | null> {
    return this.getNextQuestion();
  }

  /**
   * Update user progress
   */
  private updateUserProgress(
    userId: string,
    subject: Subject,
    isCorrect: boolean
  ): void {
    const key = `${userId}-${subject}`;
    let progress = this.userProgress.get(key);

    if (!progress) {
      progress = {
        userId,
        subject,
        totalAttempts: 0,
        correctAttempts: 0,
        successRate: 0,
        averageTimeTaken: 0,
        difficulty: 'beginner',
        lastAttemptedAt: new Date(),
        questionsAttempted: [],
      };
    }

    progress.totalAttempts++;
    if (isCorrect) {
      progress.correctAttempts++;
    }
    progress.successRate = (progress.correctAttempts / progress.totalAttempts) * 100;
    progress.lastAttemptedAt = new Date();

    if (this.currentQuestion) {
      progress.questionsAttempted.push(this.currentQuestion.id);
    }

    this.userProgress.set(key, progress);
  }

  /**
   * Get user progress
   */
  getUserProgress(userId: string, subject: Subject): UserProgress | null {
    const key = `${userId}-${subject}`;
    return this.userProgress.get(key) || null;
  }

  /**
   * Get all user progress
   */
  getAllUserProgress(userId: string): UserProgress[] {
    return Array.from(this.userProgress.values()).filter(
      p => p.userId === userId
    );
  }

  /**
   * Get current session
   */
  getCurrentSession(): LearningSession | null {
    return this.currentSession;
  }

  /**
   * Get current question
   */
  getCurrentQuestion(): Question | null {
    return this.currentQuestion;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    questionsAttempted: number;
    correctAnswers: number;
    successRate: number;
    averageTime: number;
  } | null {
    if (!this.currentSession) {
      return null;
    }

    const correctAnswers = this.currentSession.questionsAttempted.filter(
      q => q.isCorrect
    ).length;
    const totalAttempts = this.currentSession.questionsAttempted.length;
    const averageTime =
      totalAttempts > 0
        ? this.currentSession.questionsAttempted.reduce(
            (sum, q) => sum + q.timeTaken,
            0
          ) / totalAttempts
        : 0;

    return {
      questionsAttempted: totalAttempts,
      correctAnswers,
      successRate: totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0,
      averageTime,
    };
  }

  /**
   * Reset session
   */
  resetSession(): void {
    this.currentSession = null;
    this.currentQuestion = null;
    this.sessionStartTime = 0;
  }
}

/**
 * Learning Mode Chat Interface
 */
export interface LearningModeChatMessage {
  id: string;
  type: 'question' | 'answer' | 'feedback' | 'hint' | 'system';
  content: string;
  timestamp: Date;
  questionId?: string;
  isCorrect?: boolean;
}

/**
 * Learning Mode Chat Manager
 */
export class LearningModeChatManager {
  private messages: LearningModeChatMessage[] = [];
  private learningModeManager: LearningModeManager;

  constructor(learningModeManager: LearningModeManager) {
    this.learningModeManager = learningModeManager;
  }

  /**
   * Add message to chat
   */
  addMessage(message: LearningModeChatMessage): void {
    this.messages.push(message);
  }

  /**
   * Get all messages
   */
  getMessages(): LearningModeChatMessage[] {
    return [...this.messages];
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Format question as chat message
   */
  formatQuestionMessage(question: Question): LearningModeChatMessage {
    let content = `📚 **Question**: ${question.questionText}\n\n`;

    if (question.type === 'mcq') {
      const mcqQuestion = question as any;
      content += '**Options:**\n';
      mcqQuestion.options.forEach((opt: any, index: number) => {
        content += `${String.fromCharCode(65 + index)}) ${opt.text}\n`;
      });
    }

    return {
      id: `msg-${question.id}-${Date.now()}`,
      type: 'question',
      content,
      timestamp: new Date(),
      questionId: question.id,
    };
  }

  /**
   * Format feedback as chat message
   */
  formatFeedbackMessage(
    isCorrect: boolean,
    feedback: string,
    explanation: string
  ): LearningModeChatMessage {
    const icon = isCorrect ? '✅' : '❌';
    const content = `${icon} ${feedback}\n\n**Explanation**: ${explanation}`;

    return {
      id: `msg-feedback-${Date.now()}`,
      type: 'feedback',
      content,
      timestamp: new Date(),
      isCorrect,
    };
  }

  /**
   * Format hint as chat message
   */
  formatHintMessage(hintLevel: 1 | 2 | 3, hint: string): LearningModeChatMessage {
    return {
      id: `msg-hint-${Date.now()}`,
      type: 'hint',
      content: `💡 **Hint ${hintLevel}**: ${hint}`,
      timestamp: new Date(),
    };
  }

  /**
   * Format system message
   */
  formatSystemMessage(content: string): LearningModeChatMessage {
    return {
      id: `msg-system-${Date.now()}`,
      type: 'system',
      content,
      timestamp: new Date(),
    };
  }

  /**
   * Get session summary
   */
  getSessionSummary(): string {
    const stats = this.learningModeManager.getSessionStats();
    if (!stats) {
      return 'No active session';
    }

    return `
📊 **Session Summary**
- Questions Attempted: ${stats.questionsAttempted}
- Correct Answers: ${stats.correctAnswers}
- Success Rate: ${stats.successRate.toFixed(1)}%
- Average Time: ${(stats.averageTime / 1000).toFixed(1)}s
    `.trim();
  }
}

export default LearningModeManager;
