/**
 * Question Schema Validation
 * Validates questions against defined schemas
 */

import {
  Question,
  MCQQuestion,
  ConceptualQuestion,
  NumericalQuestion,
  BaseQuestion,
  MCQOption,
  Hint,
  Subject,
  DifficultyLevel,
  QuestionType,
} from './question-types';

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate base question fields
 */
function validateBaseQuestion(question: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!question.id || typeof question.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'ID must be a non-empty string',
      value: question.id,
    });
  }

  if (!question.type || !['mcq', 'conceptual', 'numerical'].includes(question.type)) {
    errors.push({
      field: 'type',
      message: 'Type must be one of: mcq, conceptual, numerical',
      value: question.type,
    });
  }

  if (!question.subject || !['mathematics', 'finance', 'agriculture'].includes(question.subject)) {
    errors.push({
      field: 'subject',
      message: 'Subject must be one of: mathematics, finance, agriculture',
      value: question.subject,
    });
  }

  if (!question.difficulty || !['beginner', 'intermediate', 'advanced'].includes(question.difficulty)) {
    errors.push({
      field: 'difficulty',
      message: 'Difficulty must be one of: beginner, intermediate, advanced',
      value: question.difficulty,
    });
  }

  if (!question.questionText || typeof question.questionText !== 'string') {
    errors.push({
      field: 'questionText',
      message: 'Question text must be a non-empty string',
      value: question.questionText,
    });
  }

  if (!question.explanation || typeof question.explanation !== 'string') {
    errors.push({
      field: 'explanation',
      message: 'Explanation must be a non-empty string',
      value: question.explanation,
    });
  }

  if (!Array.isArray(question.tags) || question.tags.length === 0) {
    errors.push({
      field: 'tags',
      message: 'Tags must be a non-empty array',
      value: question.tags,
    });
  }

  // Check optional fields
  if (question.questionTextHindi && typeof question.questionTextHindi !== 'string') {
    errors.push({
      field: 'questionTextHindi',
      message: 'Hindi question text must be a string',
      value: question.questionTextHindi,
    });
  }

  if (question.explanationHindi && typeof question.explanationHindi !== 'string') {
    errors.push({
      field: 'explanationHindi',
      message: 'Hindi explanation must be a string',
      value: question.explanationHindi,
    });
  }

  if (question.prerequisites && !Array.isArray(question.prerequisites)) {
    errors.push({
      field: 'prerequisites',
      message: 'Prerequisites must be an array',
      value: question.prerequisites,
    });
  }

  return errors;
}

/**
 * Validate MCQ question
 */
function validateMCQQuestion(question: any): ValidationError[] {
  const errors = validateBaseQuestion(question);

  if (question.type !== 'mcq') {
    return errors;
  }

  // Check options
  if (!Array.isArray(question.options) || question.options.length < 2) {
    errors.push({
      field: 'options',
      message: 'MCQ must have at least 2 options',
      value: question.options,
    });
    return errors;
  }

  // Validate each option
  question.options.forEach((option: any, index: number) => {
    if (!option.id || typeof option.id !== 'string') {
      errors.push({
        field: `options[${index}].id`,
        message: 'Option ID must be a non-empty string',
        value: option.id,
      });
    }

    if (!option.text || typeof option.text !== 'string') {
      errors.push({
        field: `options[${index}].text`,
        message: 'Option text must be a non-empty string',
        value: option.text,
      });
    }

    if (typeof option.isCorrect !== 'boolean') {
      errors.push({
        field: `options[${index}].isCorrect`,
        message: 'Option isCorrect must be a boolean',
        value: option.isCorrect,
      });
    }
  });

  // Check correct option ID
  if (!question.correctOptionId || typeof question.correctOptionId !== 'string') {
    errors.push({
      field: 'correctOptionId',
      message: 'Correct option ID must be a non-empty string',
      value: question.correctOptionId,
    });
  } else {
    const correctOption = question.options.find((o: any) => o.id === question.correctOptionId);
    if (!correctOption) {
      errors.push({
        field: 'correctOptionId',
        message: 'Correct option ID must match one of the options',
        value: question.correctOptionId,
      });
    }
  }

  // Verify at least one option is marked as correct
  const correctCount = question.options.filter((o: any) => o.isCorrect).length;
  if (correctCount !== 1) {
    errors.push({
      field: 'options',
      message: 'Exactly one option must be marked as correct',
      value: correctCount,
    });
  }

  return errors;
}

/**
 * Validate conceptual question
 */
function validateConceptualQuestion(question: any): ValidationError[] {
  const errors = validateBaseQuestion(question);

  if (question.type !== 'conceptual') {
    return errors;
  }

  // Check hints
  if (!Array.isArray(question.hints) || question.hints.length < 1) {
    errors.push({
      field: 'hints',
      message: 'Conceptual question must have at least 1 hint',
      value: question.hints,
    });
  } else {
    question.hints.forEach((hint: any, index: number) => {
      if (![1, 2, 3].includes(hint.level)) {
        errors.push({
          field: `hints[${index}].level`,
          message: 'Hint level must be 1, 2, or 3',
          value: hint.level,
        });
      }

      if (!hint.text || typeof hint.text !== 'string') {
        errors.push({
          field: `hints[${index}].text`,
          message: 'Hint text must be a non-empty string',
          value: hint.text,
        });
      }
    });
  }

  // Check acceptable answers
  if (!Array.isArray(question.acceptableAnswers) || question.acceptableAnswers.length === 0) {
    errors.push({
      field: 'acceptableAnswers',
      message: 'Must have at least one acceptable answer',
      value: question.acceptableAnswers,
    });
  } else {
    question.acceptableAnswers.forEach((answer: any, index: number) => {
      if (typeof answer !== 'string' || answer.trim().length === 0) {
        errors.push({
          field: `acceptableAnswers[${index}]`,
          message: 'Acceptable answer must be a non-empty string',
          value: answer,
        });
      }
    });
  }

  // Check key points
  if (!Array.isArray(question.keyPoints) || question.keyPoints.length === 0) {
    errors.push({
      field: 'keyPoints',
      message: 'Must have at least one key point',
      value: question.keyPoints,
    });
  }

  return errors;
}

/**
 * Validate numerical question
 */
function validateNumericalQuestion(question: any): ValidationError[] {
  const errors = validateBaseQuestion(question);

  if (question.type !== 'numerical') {
    return errors;
  }

  // Check correct answer
  if (typeof question.correctAnswer !== 'number') {
    errors.push({
      field: 'correctAnswer',
      message: 'Correct answer must be a number',
      value: question.correctAnswer,
    });
  }

  // Check tolerance
  if (typeof question.tolerance !== 'number' || question.tolerance < 0) {
    errors.push({
      field: 'tolerance',
      message: 'Tolerance must be a non-negative number',
      value: question.tolerance,
    });
  }

  // Check optional fields
  if (question.unit && typeof question.unit !== 'string') {
    errors.push({
      field: 'unit',
      message: 'Unit must be a string',
      value: question.unit,
    });
  }

  if (question.formula && typeof question.formula !== 'string') {
    errors.push({
      field: 'formula',
      message: 'Formula must be a string',
      value: question.formula,
    });
  }

  return errors;
}

/**
 * Validate question schema
 */
export function validateQuestionSchema(question: any): boolean {
  const result = validateQuestionSchemaDetailed(question);
  return result.valid;
}

/**
 * Validate question schema with detailed errors
 */
export function validateQuestionSchemaDetailed(question: any): ValidationResult {
  if (!question || typeof question !== 'object') {
    return {
      valid: false,
      errors: [
        {
          field: 'root',
          message: 'Question must be an object',
          value: question,
        },
      ],
    };
  }

  let errors: ValidationError[] = [];

  // Validate based on type
  switch (question.type) {
    case 'mcq':
      errors = validateMCQQuestion(question);
      break;
    case 'conceptual':
      errors = validateConceptualQuestion(question);
      break;
    case 'numerical':
      errors = validateNumericalQuestion(question);
      break;
    default:
      errors = validateBaseQuestion(question);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate array of questions
 */
export function validateQuestionsArray(questions: any[]): ValidationResult {
  if (!Array.isArray(questions)) {
    return {
      valid: false,
      errors: [
        {
          field: 'root',
          message: 'Questions must be an array',
          value: questions,
        },
      ],
    };
  }

  const errors: ValidationError[] = [];

  questions.forEach((question, index) => {
    const result = validateQuestionSchemaDetailed(question);
    if (!result.valid) {
      result.errors.forEach(error => {
        errors.push({
          field: `questions[${index}].${error.field}`,
          message: error.message,
          value: error.value,
        });
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate answer format
 */
export function validateAnswer(
  question: Question,
  answer: string | number
): ValidationResult {
  const errors: ValidationError[] = [];

  if (question.type === 'mcq') {
    if (typeof answer !== 'string') {
      errors.push({
        field: 'answer',
        message: 'MCQ answer must be a string (option ID)',
        value: answer,
      });
    } else {
      const mcqQuestion = question as MCQQuestion;
      const validOption = mcqQuestion.options.find(o => o.id === answer);
      if (!validOption) {
        errors.push({
          field: 'answer',
          message: 'Answer must match one of the option IDs',
          value: answer,
        });
      }
    }
  } else if (question.type === 'numerical') {
    if (typeof answer !== 'number') {
      errors.push({
        field: 'answer',
        message: 'Numerical answer must be a number',
        value: answer,
      });
    }
  } else if (question.type === 'conceptual') {
    if (typeof answer !== 'string' || answer.trim().length === 0) {
      errors.push({
        field: 'answer',
        message: 'Conceptual answer must be a non-empty string',
        value: answer,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user progress data
 */
export function validateUserProgress(progress: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!progress.userId || typeof progress.userId !== 'string') {
    errors.push({
      field: 'userId',
      message: 'User ID must be a non-empty string',
      value: progress.userId,
    });
  }

  if (!progress.subject || !['mathematics', 'finance', 'agriculture'].includes(progress.subject)) {
    errors.push({
      field: 'subject',
      message: 'Subject must be one of: mathematics, finance, agriculture',
      value: progress.subject,
    });
  }

  if (typeof progress.totalAttempts !== 'number' || progress.totalAttempts < 0) {
    errors.push({
      field: 'totalAttempts',
      message: 'Total attempts must be a non-negative number',
      value: progress.totalAttempts,
    });
  }

  if (typeof progress.correctAttempts !== 'number' || progress.correctAttempts < 0) {
    errors.push({
      field: 'correctAttempts',
      message: 'Correct attempts must be a non-negative number',
      value: progress.correctAttempts,
    });
  }

  if (progress.correctAttempts > progress.totalAttempts) {
    errors.push({
      field: 'correctAttempts',
      message: 'Correct attempts cannot exceed total attempts',
      value: progress.correctAttempts,
    });
  }

  if (typeof progress.successRate !== 'number' || progress.successRate < 0 || progress.successRate > 100) {
    errors.push({
      field: 'successRate',
      message: 'Success rate must be between 0 and 100',
      value: progress.successRate,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map(error => `${error.field}: ${error.message}`)
    .join('\n');
}

export default {
  validateQuestionSchema,
  validateQuestionSchemaDetailed,
  validateQuestionsArray,
  validateAnswer,
  validateUserProgress,
  formatValidationErrors,
};
