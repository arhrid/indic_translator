# Phase 5: Educational Content System

## Overview

Phase 5 implements a comprehensive educational content system with question management, learning sessions, and progress tracking. This transforms the Indic Language Translator into an interactive learning platform.

**Status:** ✅ Complete  
**Components Created:** 3  
**Data Files:** 3 (15 sample questions)  
**Services:** 2

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chat Interface                        │
│              (Learning Mode Toggle)                      │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Question   │ │  Learning    │ │   Progress   │
│   Service    │ │  Mode Mgr    │ │   Tracker    │
└──────────────┘ └──────────────┘ └──────────────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────▼────────────┐
        │   Question Data         │
        │  (JSON Files)           │
        ├────────────────────────┤
        │ • Mathematics (5 Qs)    │
        │ • Finance (5 Qs)        │
        │ • Agriculture (5 Qs)    │
        └─────────────────────────┘
```

---

## Files Created

### 1. Question Type Definitions
**File:** `lib/education/question-types.ts`

**Exports:**
- `DifficultyLevel` - 'beginner' | 'intermediate' | 'advanced'
- `QuestionType` - 'mcq' | 'conceptual' | 'numerical'
- `Subject` - 'mathematics' | 'finance' | 'agriculture'
- `MCQQuestion` - Multiple choice questions
- `ConceptualQuestion` - Essay/conceptual questions
- `NumericalQuestion` - Numerical problems
- `UserAnswer` - Answer records
- `UserProgress` - Progress tracking
- `LearningSession` - Session management

**Key Interfaces:**
```typescript
interface BaseQuestion {
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
}

interface MCQQuestion extends BaseQuestion {
  options: MCQOption[];
  correctOptionId: string;
}

interface ConceptualQuestion extends BaseQuestion {
  hints: Hint[];
  acceptableAnswers: string[];
  keyPoints: string[];
}

interface NumericalQuestion extends BaseQuestion {
  correctAnswer: number;
  tolerance: number;
  unit?: string;
  formula?: string;
}
```

---

### 2. Question Service
**File:** `lib/education/question-service.ts`

**Features:**
- Question loading and caching
- Answer validation (MCQ, numerical, conceptual)
- Hint management
- Progress tracking
- Related question retrieval
- Difficulty progression

**Key Methods:**
```typescript
// Question retrieval
getRandomQuestion(subject, difficulty?)
getFilteredQuestions(options)
getQuestionById(subject, questionId)
getProgressionQuestions(subject, startDifficulty)

// Answer checking
checkMCQAnswer(question, selectedOptionId)
checkNumericalAnswer(question, userAnswer)
checkConceptualAnswer(question, userAnswer)
checkAnswer(question, userAnswer)

// Hints and explanations
getHint(question, hintLevel)
getExplanation(question, language)
getQuestionText(question, language)

// Related content
getRelatedQuestions(subject, question, limit)
```

**Usage:**
```typescript
const questionService = await getQuestionService();

// Get random question
const question = await questionService.getRandomQuestion('mathematics', 'beginner');

// Check answer
const { isCorrect, feedback } = questionService.checkAnswer(question, userAnswer);

// Get hint
const hint = questionService.getHint(question, 1);

// Get explanation
const explanation = questionService.getExplanation(question, 'hi');
```

---

### 3. Learning Mode Manager
**File:** `lib/education/learning-mode.ts`

**Features:**
- Session management
- Question delivery
- Answer submission
- Progress tracking
- Statistics calculation
- Chat message formatting

**Key Classes:**

**LearningModeManager:**
```typescript
// Session management
startSession(userId, subject, difficulty)
endSession()
getCurrentSession()

// Question flow
getNextQuestion()
submitAnswer(userId, answer, timeTaken)
getHint(hintLevel)
skipQuestion()

// Progress tracking
getUserProgress(userId, subject)
getAllUserProgress(userId)
getSessionStats()
```

**LearningModeChatManager:**
```typescript
// Message management
addMessage(message)
getMessages()
clearMessages()

// Message formatting
formatQuestionMessage(question)
formatFeedbackMessage(isCorrect, feedback, explanation)
formatHintMessage(hintLevel, hint)
formatSystemMessage(content)

// Session summary
getSessionSummary()
```

---

### 4. Question Data Files

#### Mathematics Questions
**File:** `data/questions/mathematics.json`

**Questions:**
1. **math-001** (MCQ, Beginner) - Basic addition: 5 + 3 = ?
2. **math-002** (MCQ, Beginner) - Basic division: 12 ÷ 3 = ?
3. **math-003** (Conceptual, Intermediate) - Explain prime numbers
4. **math-004** (Numerical, Intermediate) - Rectangle area calculation
5. **math-005** (MCQ, Advanced) - Calculus derivative

#### Finance Questions
**File:** `data/questions/finance.json`

**Questions:**
1. **fin-001** (MCQ, Beginner) - Purpose of budgeting
2. **fin-002** (MCQ, Beginner) - What is compound interest?
3. **fin-003** (Conceptual, Intermediate) - Stocks vs bonds
4. **fin-004** (Numerical, Intermediate) - Simple interest calculation
5. **fin-005** (MCQ, Advanced) - CAPM model

#### Agriculture Questions
**File:** `data/questions/agriculture.json`

**Questions:**
1. **agr-001** (MCQ, Beginner) - Purpose of crop rotation
2. **agr-002** (MCQ, Beginner) - Important plant nutrients
3. **agr-003** (Conceptual, Intermediate) - Sustainable agriculture
4. **agr-004** (Numerical, Intermediate) - Yield calculation
5. **agr-005** (MCQ, Advanced) - Precision agriculture

---

## Question Schema

### MCQ Question Example
```json
{
  "id": "math-001",
  "type": "mcq",
  "subject": "mathematics",
  "difficulty": "beginner",
  "questionText": "What is 5 + 3?",
  "questionTextHindi": "5 + 3 क्या है?",
  "options": [
    { "id": "opt-1", "text": "6", "isCorrect": false },
    { "id": "opt-2", "text": "8", "isCorrect": true },
    { "id": "opt-3", "text": "9", "isCorrect": false },
    { "id": "opt-4", "text": "10", "isCorrect": false }
  ],
  "correctOptionId": "opt-2",
  "explanation": "When we add 5 and 3, we get 8.",
  "explanationHindi": "जब हम 5 और 3 को जोड़ते हैं, तो हमें 8 मिलता है।",
  "tags": ["addition", "basic", "arithmetic"],
  "prerequisites": []
}
```

### Conceptual Question Example
```json
{
  "id": "math-003",
  "type": "conceptual",
  "subject": "mathematics",
  "difficulty": "intermediate",
  "questionText": "Explain what a prime number is and give three examples.",
  "hints": [
    { "level": 1, "text": "A prime number is only divisible by 1 and itself." },
    { "level": 2, "text": "Examples include 2, 3, 5, 7, 11, 13, etc." },
    { "level": 3, "text": "2 is the only even prime number." }
  ],
  "acceptableAnswers": [
    "A prime number is a natural number greater than 1...",
    "A number that can only be divided by 1 and itself"
  ],
  "keyPoints": [
    "Prime numbers are greater than 1",
    "They have exactly two divisors: 1 and themselves"
  ]
}
```

### Numerical Question Example
```json
{
  "id": "math-004",
  "type": "numerical",
  "subject": "mathematics",
  "difficulty": "intermediate",
  "questionText": "If a rectangle has length 8 cm and width 5 cm, what is its area?",
  "correctAnswer": 40,
  "tolerance": 0,
  "unit": "cm²",
  "formula": "Area = length × width"
}
```

---

## Learning Flow

### 1. Start Learning Session
```
User: "I want to learn mathematics"
↓
System: Starts session with beginner difficulty
↓
System: Loads first question
↓
Display: Question with options (for MCQ)
```

### 2. Answer Question
```
User: Submits answer
↓
System: Validates answer
↓
System: Calculates if correct
↓
Display: Feedback + Explanation
↓
System: Updates progress
```

### 3. Request Hint
```
User: "I need a hint"
↓
System: Provides hint level 1
↓
User: "Another hint"
↓
System: Provides hint level 2
↓
User: "One more hint"
↓
System: Provides hint level 3
```

### 4. Skip Question
```
User: "Skip this question"
↓
System: Loads next question
↓
Display: New question
```

### 5. End Session
```
User: "End session"
↓
System: Calculates statistics
↓
Display: Session summary
↓
System: Saves progress
```

---

## Integration with Chat

### Chat Mode Toggle
```typescript
<ChatModeSelector
  modes={['chat', 'learning']}
  currentMode={mode}
  onChange={setMode}
/>
```

### Learning Mode in Sidebar
```
Sidebar
├── Chat Mode
├── Learning Mode
│   ├── Mathematics
│   │   ├── Beginner
│   │   ├── Intermediate
│   │   └── Advanced
│   ├── Finance
│   │   ├── Beginner
│   │   ├── Intermediate
│   │   └── Advanced
│   └── Agriculture
│       ├── Beginner
│       ├── Intermediate
│       └── Advanced
```

---

## Progress Tracking

### User Progress Record
```typescript
interface UserProgress {
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
```

### Session Statistics
```typescript
{
  questionsAttempted: 10,
  correctAnswers: 8,
  successRate: 80,
  averageTime: 45000 // milliseconds
}
```

---

## Features

### ✅ Question Management
- 15 sample questions (5 per subject)
- 3 question types (MCQ, conceptual, numerical)
- 3 difficulty levels
- Bilingual support (English + Hindi)
- Tags and prerequisites

### ✅ Answer Validation
- MCQ: Exact match checking
- Numerical: Tolerance-based validation
- Conceptual: Keyword matching

### ✅ Hint System
- Progressive hints (3 levels)
- Context-aware hints
- Difficulty-appropriate hints

### ✅ Progress Tracking
- Session management
- User statistics
- Success rate calculation
- Time tracking

### ✅ Learning Features
- Random question selection
- Difficulty progression
- Related question suggestions
- Performance analytics

---

## Usage Examples

### Initialize Learning Mode
```typescript
import { getQuestionService } from '@/lib/education/question-service';
import { LearningModeManager } from '@/lib/education/learning-mode';

const questionService = await getQuestionService();
const learningMode = new LearningModeManager(questionService);

// Start session
await learningMode.startSession('user-123', 'mathematics', 'beginner');
```

### Get and Answer Question
```typescript
// Get next question
const question = await learningMode.getNextQuestion();

// Submit answer
const { isCorrect, feedback, explanation } = 
  await learningMode.submitAnswer('user-123', answer, timeTaken);

// Get hint if needed
const hint = learningMode.getHint(1);
```

### Track Progress
```typescript
// Get session statistics
const stats = learningMode.getSessionStats();

// Get user progress
const progress = learningMode.getUserProgress('user-123', 'mathematics');

// End session
const session = learningMode.endSession();
```

---

## Data Storage

### Current Implementation
- Questions stored in JSON files
- Progress stored in memory (can be extended to database)
- Session data in-memory during session

### Future Enhancement
- Move to database (PostgreSQL)
- Persistent progress tracking
- User profiles and certificates
- Analytics and reporting

---

## Extensibility

### Adding New Questions
1. Add to appropriate JSON file in `data/questions/`
2. Follow schema structure
3. Include bilingual content
4. Add relevant tags and prerequisites

### Adding New Subjects
1. Create new JSON file: `data/questions/[subject].json`
2. Add subject to `Subject` type in `question-types.ts`
3. Populate with questions
4. Update UI subject selector

### Custom Question Types
1. Extend `BaseQuestion` interface
2. Implement validation logic in `QuestionService`
3. Add to `Question` union type

---

## Performance Considerations

### Caching
- Questions cached in memory
- Cache expires after 1 hour
- Automatic reload on expiry

### Optimization
- Lazy loading of questions
- Efficient filtering and searching
- Minimal re-renders in UI

---

## Testing

### Unit Tests
- Question validation
- Answer checking
- Progress calculation
- Session management

### Integration Tests
- End-to-end learning flow
- Progress persistence
- Multi-session handling

---

## Future Enhancements

### Phase 5.1: Advanced Features
1. **Adaptive Learning**
   - Adjust difficulty based on performance
   - Personalized question selection

2. **Certificates**
   - Issue certificates on completion
   - Track achievements

3. **Leaderboards**
   - User rankings
   - Subject-wise rankings

### Phase 5.2: Content Expansion
1. **More Questions**
   - Expand to 50+ questions per subject
   - Add more subjects

2. **Video Content**
   - Embed educational videos
   - Interactive tutorials

3. **Practice Tests**
   - Full-length tests
   - Timed assessments

### Phase 5.3: Analytics
1. **Performance Tracking**
   - Detailed analytics
   - Learning patterns
   - Weakness identification

2. **Reporting**
   - Progress reports
   - Performance insights
   - Recommendations

---

## References

- [Question Schema](./lib/education/question-types.ts)
- [Question Service](./lib/education/question-service.ts)
- [Learning Mode](./lib/education/learning-mode.ts)
- [Sample Data](./data/questions/)

---

**Status:** ✅ Phase 5 Complete  
**Questions:** 15 (5 per subject)  
**Question Types:** 3  
**Difficulty Levels:** 3  
**Bilingual Support:** Yes  
**Ready for:** Integration with Chat UI
