/**
 * Content Quality Validator
 * Validates question clarity, correctness, educational value, and translation quality
 */

interface Question {
  id: string;
  subject: string;
  difficulty: string;
  type: string;
  questionText: string;
  questionTextHindi?: string;
  options?: Record<string, string>;
  optionsHindi?: Record<string, string>;
  correctOptionId?: string;
  explanation: string;
  explanationHindi?: string;
  hints?: string[];
  hintsHindi?: string[];
  tags?: string[];
  [key: string]: any;
}

interface ValidationIssue {
  type: 'clarity' | 'correctness' | 'educational' | 'cultural' | 'translation';
  severity: 'warning' | 'error';
  message: string;
}

interface ValidationResult {
  questionId: string;
  isValid: boolean;
  issues: ValidationIssue[];
  score: number; // 0-100
  flags: string[];
}

export class ContentValidator {
  /**
   * Validate question clarity
   */
  validateClarity(question: Question): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const text = question.questionText || '';

    // Check length
    if (text.length < 10) {
      issues.push({
        type: 'clarity',
        severity: 'error',
        message: 'Question too short (< 10 characters)',
      });
    }

    if (text.length > 500) {
      issues.push({
        type: 'clarity',
        severity: 'warning',
        message: 'Question too long (> 500 characters)',
      });
    }

    // Check for ambiguous words
    const ambiguousWords = ['maybe', 'perhaps', 'possibly', 'might', 'could', 'probably'];
    const hasAmbiguous = ambiguousWords.some(word =>
      text.toLowerCase().includes(word)
    );

    if (hasAmbiguous) {
      issues.push({
        type: 'clarity',
        severity: 'warning',
        message: 'Question contains ambiguous language',
      });
    }

    // Check for proper punctuation
    if (!text.match(/[?.!]$/)) {
      issues.push({
        type: 'clarity',
        severity: 'warning',
        message: 'Question should end with punctuation',
      });
    }

    // Check for clarity indicators
    if (text.includes('???') || text.includes('!!!')) {
      issues.push({
        type: 'clarity',
        severity: 'error',
        message: 'Question contains excessive punctuation',
      });
    }

    return issues;
  }

  /**
   * Validate answer correctness
   */
  validateCorrectness(question: Question): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (question.type === 'mcq') {
      // Check options
      if (!question.options || Object.keys(question.options).length < 2) {
        issues.push({
          type: 'correctness',
          severity: 'error',
          message: 'MCQ must have at least 2 options',
        });
      }

      if (question.options && Object.keys(question.options).length > 6) {
        issues.push({
          type: 'correctness',
          severity: 'warning',
          message: 'MCQ has too many options (> 6)',
        });
      }

      // Check correct option
      if (!question.correctOptionId) {
        issues.push({
          type: 'correctness',
          severity: 'error',
          message: 'Correct option not specified',
        });
      }

      // Check for duplicate options
      if (question.options) {
        const optionValues = Object.values(question.options);
        const uniqueValues = new Set(optionValues.map(v => v.toLowerCase().trim()));

        if (uniqueValues.size !== optionValues.length) {
          issues.push({
            type: 'correctness',
            severity: 'error',
            message: 'Duplicate options detected',
          });
        }
      }

      // Check option length consistency
      if (question.options) {
        const lengths = Object.values(question.options).map(o => o.length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const maxDeviation = Math.max(...lengths.map(l => Math.abs(l - avgLength)));

        if (maxDeviation > avgLength * 2) {
          issues.push({
            type: 'correctness',
            severity: 'warning',
            message: 'Option lengths vary significantly (potential hint)',
          });
        }
      }
    }

    // Check explanation
    const explanation = question.explanation || '';
    if (explanation.length < 10) {
      issues.push({
        type: 'correctness',
        severity: 'warning',
        message: 'Explanation too short (< 10 characters)',
      });
    }

    if (explanation.length > 1000) {
      issues.push({
        type: 'correctness',
        severity: 'warning',
        message: 'Explanation too long (> 1000 characters)',
      });
    }

    return issues;
  }

  /**
   * Validate educational value
   */
  validateEducational(question: Question): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for learning objectives
    if (!question.tags || question.tags.length === 0) {
      issues.push({
        type: 'educational',
        severity: 'warning',
        message: 'No tags/learning objectives specified',
      });
    }

    // Check difficulty level
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(question.difficulty)) {
      issues.push({
        type: 'educational',
        severity: 'error',
        message: 'Invalid difficulty level',
      });
    }

    // Check hints
    if (!question.hints || question.hints.length === 0) {
      issues.push({
        type: 'educational',
        severity: 'warning',
        message: 'No hints provided',
      });
    }

    // Check question type
    const validTypes = ['mcq', 'conceptual', 'numerical'];
    if (!validTypes.includes(question.type)) {
      issues.push({
        type: 'educational',
        severity: 'error',
        message: 'Invalid question type',
      });
    }

    return issues;
  }

  /**
   * Validate cultural appropriateness
   */
  validateCultural(question: Question): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const text = question.questionText?.toLowerCase() || '';
    const explanation = question.explanation?.toLowerCase() || '';
    const fullText = text + ' ' + explanation;

    // Check for potentially offensive content
    const redFlags = [
      'offensive',
      'discriminatory',
      'stereotypical',
      'racist',
      'sexist',
      'hate',
      'violence',
    ];

    for (const flag of redFlags) {
      if (fullText.includes(flag)) {
        issues.push({
          type: 'cultural',
          severity: 'error',
          message: `Potentially inappropriate content detected: "${flag}"`,
        });
      }
    }

    // Check for cultural sensitivity
    const sensitiveTerms = ['primitive', 'uncivilized', 'backward', 'underdeveloped'];
    for (const term of sensitiveTerms) {
      if (fullText.includes(term)) {
        issues.push({
          type: 'cultural',
          severity: 'warning',
          message: `Potentially insensitive term detected: "${term}"`,
        });
      }
    }

    return issues;
  }

  /**
   * Validate translation quality
   */
  validateTranslation(question: Question): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (question.questionTextHindi) {
      const englishLength = question.questionText?.length || 0;
      const hindiLength = question.questionTextHindi.length;

      // Check length ratio (Hindi typically 20-30% longer)
      const ratio = hindiLength / englishLength;
      if (ratio < 0.5 || ratio > 2.5) {
        issues.push({
          type: 'translation',
          severity: 'warning',
          message: `Hindi translation length ratio unusual (${ratio.toFixed(2)})`,
        });
      }

      // Check for untranslated English words
      const englishWords = (question.questionText || '').split(/\s+/);
      const hindiWords = question.questionTextHindi.split(/\s+/);

      const englishWordCount = englishWords.filter(w => /^[a-zA-Z]+$/.test(w)).length;
      const hindiWordCount = hindiWords.filter(w => /^[a-zA-Z]+$/.test(w)).length;

      if (englishWordCount > 0 && hindiWordCount > englishWordCount * 0.5) {
        issues.push({
          type: 'translation',
          severity: 'warning',
          message: 'Hindi translation may contain untranslated English words',
        });
      }

      // Check for Hindi script
      const hindiScriptRegex = /[\u0900-\u097F]/g;
      const hindiCharCount = (question.questionTextHindi.match(hindiScriptRegex) || []).length;

      if (hindiCharCount < hindiLength * 0.5) {
        issues.push({
          type: 'translation',
          severity: 'error',
          message: 'Hindi translation contains less than 50% Hindi script',
        });
      }
    }

    if (question.explanationHindi) {
      const englishLength = question.explanation?.length || 0;
      const hindiLength = question.explanationHindi.length;

      const ratio = hindiLength / englishLength;
      if (ratio < 0.5 || ratio > 2.5) {
        issues.push({
          type: 'translation',
          severity: 'warning',
          message: `Hindi explanation length ratio unusual (${ratio.toFixed(2)})`,
        });
      }
    }

    return issues;
  }

  /**
   * Comprehensive validation
   */
  validate(question: Question): ValidationResult {
    const allIssues: ValidationIssue[] = [
      ...this.validateClarity(question),
      ...this.validateCorrectness(question),
      ...this.validateEducational(question),
      ...this.validateCultural(question),
      ...this.validateTranslation(question),
    ];

    const errorCount = allIssues.filter(i => i.severity === 'error').length;
    const warningCount = allIssues.filter(i => i.severity === 'warning').length;

    // Calculate score: 100 - (errors * 20 + warnings * 5)
    const score = Math.max(0, 100 - (errorCount * 20 + warningCount * 5));

    // Generate flags
    const flags: string[] = [];
    if (errorCount > 0) flags.push(`${errorCount} error(s)`);
    if (warningCount > 0) flags.push(`${warningCount} warning(s)`);
    if (score < 50) flags.push('Low quality score');
    if (question.questionTextHindi && !this.isValidHindiTranslation(question)) {
      flags.push('Poor translation quality');
    }

    return {
      questionId: question.id,
      isValid: errorCount === 0,
      issues: allIssues,
      score,
      flags,
    };
  }

  /**
   * Check if Hindi translation is valid
   */
  private isValidHindiTranslation(question: Question): boolean {
    if (!question.questionTextHindi) return true;

    // Check for Hindi script presence
    const hindiScriptRegex = /[\u0900-\u097F]/g;
    const hindiCharCount = (question.questionTextHindi.match(hindiScriptRegex) || []).length;
    const hindiLength = question.questionTextHindi.length;

    // At least 70% should be Hindi script
    return hindiCharCount / hindiLength > 0.7;
  }

  /**
   * Batch validate questions
   */
  validateBatch(questions: Question[]): ValidationResult[] {
    return questions.map(q => this.validate(q));
  }

  /**
   * Generate quality report
   */
  generateReport(results: ValidationResult[]) {
    const totalQuestions = results.length;
    const validQuestions = results.filter(r => r.isValid).length;
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalQuestions;

    const issuesByType = {
      clarity: 0,
      correctness: 0,
      educational: 0,
      cultural: 0,
      translation: 0,
    };

    const issuesBySeverity = {
      error: 0,
      warning: 0,
    };

    for (const result of results) {
      for (const issue of result.issues) {
        issuesByType[issue.type]++;
        issuesBySeverity[issue.severity]++;
      }
    }

    return {
      timestamp: new Date().toISOString(),
      totalQuestions,
      validQuestions,
      validPercentage: (validQuestions / totalQuestions) * 100,
      averageScore: avgScore,
      issuesByType,
      issuesBySeverity,
      flaggedQuestions: results.filter(r => r.flags.length > 0).length,
    };
  }
}

export default ContentValidator;
