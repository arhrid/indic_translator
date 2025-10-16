/**
 * Educational Question Types and Schemas
 * Defines TypeScript interfaces for questions and answers
 */

/**
 * Question difficulty levels
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Question types
 */
export type QuestionType = 'mcq' | 'conceptual' | 'numerical';

/**
 * Subject areas
 */
export type Subject = 'mathematics' | 'finance' | 'agriculture';

/**
 * MCQ Option
 */
export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Hint for conceptual questions
 */
export interface Hint {
  level: 1 | 2 | 3;
  text: string;
}

/**
 * Base Question Interface
 */
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  subject: Subject;
  difficulty: DifficultyLevel;
  questionText: string;
  questionTextHindi?: string;
  explanation: string;
  explanationHindi?: string;
  tags: string[];
  prerequisites?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MCQ Question
 */
export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: MCQOption[];
  correctOptionId: string;
}

/**
 * Conceptual Question
 */
export interface ConceptualQuestion extends BaseQuestion {
  type: 'conceptual';
  hints: Hint[];
  acceptableAnswers: string[];
  keyPoints: string[];
}

/**
 * Numerical Question
 */
export interface NumericalQuestion extends BaseQuestion {
  type: 'numerical';
  correctAnswer: number;
  tolerance: number; // Acceptable margin of error
  unit?: string;
  formula?: string;
}

/**
 * Union type for all question types
 */
export type Question = MCQQuestion | ConceptualQuestion | NumericalQuestion;

/**
 * User Answer
 */
export interface UserAnswer {
  questionId: string;
  userId: string;
  answer: string | number;
  isCorrect: boolean;
  timeTaken: number; // milliseconds
  attemptNumber: number;
  submittedAt: Date;
}

/**
 * Question Response
 */
export interface QuestionResponse {
  question: Question;
  userAnswer?: UserAnswer;
  isCorrect?: boolean;
  feedback: string;
  explanation: string;
}

/**
 * User Progress
 */
export interface UserProgress {
  userId: string;
  subject: Subject;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  averageTimeTaken: number;
  difficulty: DifficultyLevel;
  lastAttemptedAt: Date;
  questionsAttempted: string[];
}

/**
 * Question Filter Options
 */
export interface QuestionFilterOptions {
  subject?: Subject;
  difficulty?: DifficultyLevel;
  type?: QuestionType;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Question Statistics
 */
export interface QuestionStatistics {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  averageTimeTaken: number;
  averageDifficulty: number;
}

/**
 * Learning Session
 */
export interface LearningSession {
  id: string;
  userId: string;
  subject: Subject;
  difficulty: DifficultyLevel;
  startedAt: Date;
  endedAt?: Date;
  questionsAttempted: UserAnswer[];
  totalScore: number;
  successRate: number;
  duration: number; // milliseconds
}

/**
 * Certificate
 */
export interface Certificate {
  id: string;
  userId: string;
  subject: Subject;
  difficulty: DifficultyLevel;
  issuedAt: Date;
  expiresAt?: Date;
  score: number;
  successRate: number;
}
