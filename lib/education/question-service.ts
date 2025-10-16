/**
 * Question Service
 * Provides CRUD operations and question retrieval logic
 */

import {
  Question,
  MCQQuestion,
  ConceptualQuestion,
  NumericalQuestion,
  Subject,
  DifficultyLevel,
  QuestionType,
  QuestionFilterOptions,
  UserAnswer,
  QuestionResponse,
} from './question-types';

/**
 * Question Service Class
 * Manages question retrieval, validation, and answer checking
 */
export class QuestionService {
  private questionsCache: Map<Subject, Question[]> = new Map();
  private cacheExpiry: Map<Subject, number> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  /**
   * Initialize service and load questions
   */
  async initialize(): Promise<void> {
    try {
      await this.loadQuestions('mathematics');
      await this.loadQuestions('finance');
      await this.loadQuestions('agriculture');
    } catch (error) {
      console.error('Failed to initialize question service:', error);
    }
  }

  /**
   * Load questions for a subject
   */
  private async loadQuestions(subject: Subject): Promise<void> {
    try {
      const response = await fetch(`/data/questions/${subject}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load questions for ${subject}`);
      }

      const questions = await response.json();
      this.questionsCache.set(subject, questions);
      this.cacheExpiry.set(subject, Date.now() + this.CACHE_DURATION);
    } catch (error) {
      console.error(`Error loading questions for ${subject}:`, error);
      this.questionsCache.set(subject, []);
    }
  }

  /**
   * Get all questions for a subject
   */
  async getQuestions(subject: Subject): Promise<Question[]> {
    // Check if cache is valid
    const expiry = this.cacheExpiry.get(subject);
    if (!expiry || Date.now() > expiry) {
      await this.loadQuestions(subject);
    }

    return this.questionsCache.get(subject) || [];
  }

  /**
   * Get random question
   */
  async getRandomQuestion(
    subject: Subject,
    difficulty?: DifficultyLevel
  ): Promise<Question | null> {
    const questions = await this.getQuestions(subject);

    let filtered = questions;
    if (difficulty) {
      filtered = questions.filter(q => q.difficulty === difficulty);
    }

    if (filtered.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }

  /**
   * Get questions by filter options
   */
  async getFilteredQuestions(
    options: QuestionFilterOptions
  ): Promise<Question[]> {
    const subject = options.subject || 'mathematics';
    let questions = await this.getQuestions(subject);

    // Apply filters
    if (options.difficulty) {
      questions = questions.filter(q => q.difficulty === options.difficulty);
    }

    if (options.type) {
      questions = questions.filter(q => q.type === options.type);
    }

    if (options.tags && options.tags.length > 0) {
      questions = questions.filter(q =>
        options.tags?.some(tag => q.tags.includes(tag))
      );
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 10;
    return questions.slice(offset, offset + limit);
  }

  /**
   * Get question by ID
   */
  async getQuestionById(
    subject: Subject,
    questionId: string
  ): Promise<Question | null> {
    const questions = await this.getQuestions(subject);
    return questions.find(q => q.id === questionId) || null;
  }

  /**
   * Check MCQ answer
   */
  checkMCQAnswer(question: MCQQuestion, selectedOptionId: string): boolean {
    return selectedOptionId === question.correctOptionId;
  }

  /**
   * Check numerical answer
   */
  checkNumericalAnswer(
    question: NumericalQuestion,
    userAnswer: number
  ): boolean {
    const difference = Math.abs(userAnswer - question.correctAnswer);
    return difference <= question.tolerance;
  }

  /**
   * Check conceptual answer
   */
  checkConceptualAnswer(
    question: ConceptualQuestion,
    userAnswer: string
  ): boolean {
    const normalizedAnswer = userAnswer.toLowerCase().trim();
    return question.acceptableAnswers.some(
      acceptable => acceptable.toLowerCase().includes(normalizedAnswer) ||
                    normalizedAnswer.includes(acceptable.toLowerCase())
    );
  }

  /**
   * Check answer for any question type
   */
  checkAnswer(
    question: Question,
    userAnswer: string | number
  ): { isCorrect: boolean; feedback: string } {
    try {
      if (question.type === 'mcq') {
        const mcqQuestion = question as MCQQuestion;
        const isCorrect = this.checkMCQAnswer(mcqQuestion, userAnswer as string);
        return {
          isCorrect,
          feedback: isCorrect ? 'Correct answer!' : 'Incorrect answer. Please try again.',
        };
      }

      if (question.type === 'numerical') {
        const numQuestion = question as NumericalQuestion;
        const isCorrect = this.checkNumericalAnswer(numQuestion, userAnswer as number);
        return {
          isCorrect,
          feedback: isCorrect
            ? 'Correct answer!'
            : `Incorrect. The correct answer is ${numQuestion.correctAnswer}${numQuestion.unit ? ' ' + numQuestion.unit : ''}.`,
        };
      }

      if (question.type === 'conceptual') {
        const conceptQuestion = question as ConceptualQuestion;
        const isCorrect = this.checkConceptualAnswer(conceptQuestion, userAnswer as string);
        return {
          isCorrect,
          feedback: isCorrect
            ? 'Great answer! Your understanding is correct.'
            : 'Your answer is not quite right. Review the key points and try again.',
        };
      }

      return {
        isCorrect: false,
        feedback: 'Unknown question type.',
      };
    } catch (error) {
      console.error('Error checking answer:', error);
      return {
        isCorrect: false,
        feedback: 'Error checking answer. Please try again.',
      };
    }
  }

  /**
   * Get hint for conceptual question
   */
  getHint(question: ConceptualQuestion, hintLevel: 1 | 2 | 3): string | null {
    const hint = question.hints.find(h => h.level === hintLevel);
    return hint?.text || null;
  }

  /**
   * Get explanation for question
   */
  getExplanation(question: Question, language: 'en' | 'hi' = 'en'): string {
    if (language === 'hi' && 'explanationHindi' in question) {
      return (question as any).explanationHindi || question.explanation;
    }
    return question.explanation;
  }

  /**
   * Get question text in specified language
   */
  getQuestionText(question: Question, language: 'en' | 'hi' = 'en'): string {
    if (language === 'hi' && 'questionTextHindi' in question) {
      return (question as any).questionTextHindi || question.questionText;
    }
    return question.questionText;
  }

  /**
   * Get related questions (by tags or prerequisites)
   */
  async getRelatedQuestions(
    subject: Subject,
    question: Question,
    limit: number = 3
  ): Promise<Question[]> {
    const allQuestions = await this.getQuestions(subject);

    // Find questions with similar tags
    const related = allQuestions.filter(
      q =>
        q.id !== question.id &&
        q.tags.some(tag => question.tags.includes(tag))
    );

    return related.slice(0, limit);
  }

  /**
   * Get questions by difficulty progression
   */
  async getProgressionQuestions(
    subject: Subject,
    startDifficulty: DifficultyLevel = 'beginner'
  ): Promise<Question[][]> {
    const questions = await this.getQuestions(subject);
    const difficulties: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
    const progression: Question[][] = [];

    for (const difficulty of difficulties) {
      const filtered = questions.filter(q => q.difficulty === difficulty);
      if (filtered.length > 0) {
        progression.push(filtered);
      }
    }

    return progression;
  }

  /**
   * Create user answer record
   */
  createUserAnswer(
    questionId: string,
    userId: string,
    answer: string | number,
    isCorrect: boolean,
    timeTaken: number,
    attemptNumber: number = 1
  ): UserAnswer {
    return {
      questionId,
      userId,
      answer,
      isCorrect,
      timeTaken,
      attemptNumber,
      submittedAt: new Date(),
    };
  }

  /**
   * Create question response
   */
  createQuestionResponse(
    question: Question,
    userAnswer: UserAnswer | undefined,
    isCorrect: boolean,
    feedback: string,
    explanation: string
  ): QuestionResponse {
    return {
      question,
      userAnswer,
      isCorrect,
      feedback,
      explanation,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.questionsCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cachedSubjects: Subject[];
    cacheSize: number;
    totalQuestions: number;
  } {
    const cachedSubjects = Array.from(this.questionsCache.keys());
    const totalQuestions = Array.from(this.questionsCache.values()).reduce(
      (sum, questions) => sum + questions.length,
      0
    );

    return {
      cachedSubjects,
      cacheSize: this.questionsCache.size,
      totalQuestions,
    };
  }
}

/**
 * Singleton instance
 */
let questionServiceInstance: QuestionService | null = null;

/**
 * Get or create question service instance
 */
export async function getQuestionService(): Promise<QuestionService> {
  if (!questionServiceInstance) {
    questionServiceInstance = new QuestionService();
    await questionServiceInstance.initialize();
  }
  return questionServiceInstance;
}

export default QuestionService;
