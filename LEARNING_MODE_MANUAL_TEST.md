# Learning Mode Manual Testing Guide

**Date:** October 16, 2024  
**Status:** Ready for Testing  
**Test Duration:** ~15 minutes

---

## Prerequisites

- [ ] Development server running: `pnpm dev`
- [ ] Browser open at http://localhost:3000
- [ ] DevTools open (F12)
- [ ] Console tab visible
- [ ] Network tab visible

---

## Test Scenario 1: Basic Learning Mode Flow

### Step 1: Toggle Learning Mode
**Action:**
1. Look for sidebar menu
2. Find "Chat Mode" / "Learning Mode" toggle
3. Click to switch to "Learning Mode"

**Expected Result:**
- ✅ Sidebar updates to show "Learning Mode"
- ✅ Chat interface changes to learning interface
- ✅ Subject selector appears (Mathematics, Finance, Agriculture)
- ✅ Difficulty selector appears (Beginner, Intermediate, Advanced)
- ✅ No console errors

**Verification:**
```javascript
// In console, check:
console.log(document.querySelector('[data-testid="learning-mode"]'));
// Should return element
```

---

### Step 2: Select Subject and Difficulty
**Action:**
1. Click subject selector
2. Select "Mathematics"
3. Click difficulty selector
4. Select "Beginner"
5. Click "Start Learning" button

**Expected Result:**
- ✅ Subject dropdown shows all 3 subjects
- ✅ Difficulty dropdown shows all 3 levels
- ✅ Selection is saved
- ✅ Learning session starts
- ✅ No console errors

**Verification:**
```javascript
// Check session started
console.log(localStorage.getItem('learningSession'));
// Should contain session data
```

---

### Step 3: Receive First Question
**Action:**
- Wait for first question to load

**Expected Result:**
- ✅ Question appears in chat format
- ✅ Question text is clear and readable
- ✅ For MCQ: Options A, B, C, D displayed
- ✅ For Numerical: Input field appears
- ✅ For Conceptual: Text area appears
- ✅ Question loads within 2 seconds
- ✅ No console errors

**Verification:**
```javascript
// Check question loaded
console.log(document.querySelector('[data-testid="question"]'));
// Should return question element
```

---

## Test Scenario 2: MCQ Question Flow

### Step 1: Display MCQ Question
**Expected Display:**
```
📚 Question: What is 5 + 3?

Options:
A) 6
B) 8
C) 9
D) 10
```

**Verification Checklist:**
- [ ] Question text visible
- [ ] All 4 options visible
- [ ] Options labeled A, B, C, D
- [ ] Options are clickable
- [ ] No formatting issues

---

### Step 2: Select Answer
**Action:**
1. Click on option "B) 8"

**Expected Result:**
- ✅ Option highlights/selects
- ✅ Submit button appears or auto-submits
- ✅ Loading indicator shows
- ✅ No console errors

**Verification:**
```javascript
// Check answer submitted
console.log(document.querySelector('[data-testid="answer-feedback"]'));
// Should show feedback
```

---

### Step 3: Receive Feedback
**Expected Display:**
```
✅ Correct answer!

Explanation:
When we add 5 and 3, we get 8. This is a basic arithmetic operation.

Next Question →
```

**Verification Checklist:**
- [ ] Correct/Incorrect indicator shown
- [ ] Feedback message displayed
- [ ] Explanation provided
- [ ] Explanation is clear and helpful
- [ ] Next button available
- [ ] Response time < 2 seconds

---

### Step 4: Request Hint (Optional)
**Action:**
1. Before answering, click "Get Hint" button

**Expected Result:**
- ✅ Hint Level 1 appears
- ✅ Hint is relevant to question
- ✅ Can request Hint Level 2
- ✅ Can request Hint Level 3
- ✅ No console errors

**Verification:**
```javascript
// Check hints available
console.log(document.querySelector('[data-testid="hint-level-1"]'));
// Should show hint text
```

---

## Test Scenario 3: Numerical Question Flow

### Step 1: Display Numerical Question
**Expected Display:**
```
📚 Question: If a rectangle has length 8 cm and width 5 cm, what is its area?

[Input field for answer]
Unit: cm²

Formula: Area = length × width
```

**Verification Checklist:**
- [ ] Question text visible
- [ ] Input field present
- [ ] Unit displayed
- [ ] Formula shown (if available)
- [ ] Input field is focused

---

### Step 2: Enter Answer
**Action:**
1. Click input field
2. Type "40"
3. Press Enter or click Submit

**Expected Result:**
- ✅ Input accepts numbers
- ✅ Answer submits
- ✅ Loading indicator shows
- ✅ Feedback appears within 2 seconds

---

### Step 3: Receive Feedback
**Expected Display:**
```
✅ Correct answer!

Explanation:
The area of a rectangle is calculated by multiplying its length by its width.
Area = 8 × 5 = 40 cm².
```

**Verification Checklist:**
- [ ] Correct indicator shown
- [ ] Explanation clear
- [ ] Unit included in explanation
- [ ] Formula shown

---

## Test Scenario 4: Conceptual Question Flow

### Step 1: Display Conceptual Question
**Expected Display:**
```
📚 Question: Explain what a prime number is and give three examples.

[Text area for answer]

💡 Get Hint
```

**Verification Checklist:**
- [ ] Question text visible
- [ ] Text area present
- [ ] Hint button available
- [ ] Text area is focused

---

### Step 2: Request Hints
**Action:**
1. Click "Get Hint"
2. Read Hint Level 1
3. Click "Get Hint" again
4. Read Hint Level 2
5. Click "Get Hint" again
6. Read Hint Level 3

**Expected Hints:**
```
Hint 1: A prime number is only divisible by 1 and itself.

Hint 2: Examples include 2, 3, 5, 7, 11, 13, etc. These numbers have no other divisors.

Hint 3: 2 is the only even prime number. All other prime numbers are odd.
```

**Verification Checklist:**
- [ ] Hints appear progressively
- [ ] Each hint is more specific
- [ ] Hints are helpful
- [ ] Can't get hint beyond level 3

---

### Step 3: Enter Answer
**Action:**
1. Type in text area: "A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself. Examples: 2, 3, 5"
2. Click Submit

**Expected Result:**
- ✅ Text area accepts input
- ✅ Answer submits
- ✅ Loading indicator shows
- ✅ Feedback appears

---

### Step 4: Receive Feedback
**Expected Display:**
```
✅ Great answer! Your understanding is correct.

Explanation:
A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself. Examples: 2, 3, 5, 7, 11.

Key Points:
• Prime numbers are greater than 1
• They have exactly two divisors: 1 and themselves
• 2 is the smallest and only even prime
• Examples: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29
```

**Verification Checklist:**
- [ ] Feedback indicates correctness
- [ ] Explanation provided
- [ ] Key points listed
- [ ] Response helpful for learning

---

## Test Scenario 5: Session Management

### Step 1: Complete Multiple Questions
**Action:**
1. Answer 5 questions in sequence
2. Mix of correct and incorrect answers

**Expected Result:**
- ✅ Questions load smoothly
- ✅ Feedback provided for each
- ✅ Session continues
- ✅ No errors after multiple questions

---

### Step 2: Check Progress Display
**Expected Display:**
```
📊 Session Progress
Questions Attempted: 5
Correct Answers: 4
Success Rate: 80%
Average Time: 45s
```

**Verification Checklist:**
- [ ] Progress updates after each question
- [ ] Correct count accurate
- [ ] Success rate calculated correctly
- [ ] Time tracking works

---

### Step 3: End Session
**Action:**
1. Click "End Session" button

**Expected Result:**
- ✅ Session ends
- ✅ Final summary shown
- ✅ Option to start new session
- ✅ Progress saved

**Expected Summary:**
```
📊 Session Complete!

Questions Attempted: 5
Correct Answers: 4
Success Rate: 80%
Total Time: 3m 45s

Great job! You're making good progress.

Start New Session →
```

---

## Test Scenario 6: Language Support

### Step 1: Switch Language
**Action:**
1. Click language selector
2. Select "Hindi"

**Expected Result:**
- ✅ UI language changes to Hindi
- ✅ Questions display in Hindi
- ✅ Options/buttons in Hindi
- ✅ No console errors

---

### Step 2: Verify Hindi Content
**Expected Display:**
```
📚 प्रश्न: 5 + 3 क्या है?

विकल्प:
A) 6
B) 8
C) 9
D) 10
```

**Verification Checklist:**
- [ ] Question in Hindi
- [ ] Options in Hindi
- [ ] Explanations in Hindi
- [ ] Hints in Hindi
- [ ] Readable and correct

---

## Test Scenario 7: Error Handling

### Step 1: Test Invalid Input
**Action:**
1. For MCQ: Try clicking outside options
2. For Numerical: Try entering non-numeric value
3. For Conceptual: Try submitting empty answer

**Expected Result:**
- ✅ Invalid input rejected gracefully
- ✅ Error message displayed
- ✅ User can correct input
- ✅ No console errors

---

### Step 2: Test Network Error
**Action:**
1. Open DevTools Network tab
2. Throttle to "Offline"
3. Try to get next question

**Expected Result:**
- ✅ Error message shown
- ✅ Retry button available
- ✅ No crash
- ✅ Helpful error message

---

## Test Scenario 8: Performance

### Step 1: Measure Load Time
**Action:**
1. Open DevTools Performance tab
2. Start Learning Mode
3. Get first question
4. Measure time to display

**Expected Result:**
- ✅ First question loads < 2 seconds
- ✅ Subsequent questions < 1 second
- ✅ Smooth animations
- ✅ No lag

**Verification:**
```javascript
// In console:
performance.mark('question-start');
// ... get question ...
performance.mark('question-end');
performance.measure('question', 'question-start', 'question-end');
console.log(performance.getEntriesByName('question')[0].duration);
// Should be < 2000ms
```

---

### Step 2: Check Memory Usage
**Action:**
1. Open DevTools Memory tab
2. Take heap snapshot before session
3. Answer 10 questions
4. Take heap snapshot after
5. Compare memory usage

**Expected Result:**
- ✅ Memory usage stable
- ✅ No memory leaks
- ✅ Garbage collection working
- ✅ < 50MB increase

---

## Test Scenario 9: Responsiveness

### Step 1: Test on Mobile (DevTools)
**Action:**
1. Open DevTools Device Emulation
2. Select iPhone 12 (390x844)
3. Go through learning flow

**Expected Result:**
- ✅ Layout responsive
- ✅ Questions readable
- ✅ Options clickable
- ✅ No horizontal scroll
- ✅ Buttons accessible

---

### Step 2: Test on Tablet
**Action:**
1. Select iPad (768x1024)
2. Go through learning flow

**Expected Result:**
- ✅ Layout optimized for tablet
- ✅ Good use of screen space
- ✅ All elements accessible
- ✅ No layout issues

---

## Test Scenario 10: Accessibility

### Step 1: Keyboard Navigation
**Action:**
1. Disable mouse
2. Use Tab to navigate
3. Use Enter to select
4. Use Arrow keys for options

**Expected Result:**
- ✅ All elements keyboard accessible
- ✅ Tab order logical
- ✅ Focus indicators visible
- ✅ Can complete session with keyboard only

---

### Step 2: Screen Reader Test
**Action:**
1. Enable screen reader (if available)
2. Navigate through learning flow

**Expected Result:**
- ✅ Questions read aloud
- ✅ Options announced
- ✅ Feedback read
- ✅ No missing labels

---

## Test Checklist

### Functionality
- [ ] Learning mode toggle works
- [ ] Subject selection works
- [ ] Difficulty selection works
- [ ] Questions load correctly
- [ ] MCQ questions display properly
- [ ] Numerical questions display properly
- [ ] Conceptual questions display properly
- [ ] Hints work correctly
- [ ] Answer submission works
- [ ] Feedback displays correctly
- [ ] Progress tracking works
- [ ] Session management works
- [ ] Language switching works

### Performance
- [ ] First question loads < 2s
- [ ] Subsequent questions < 1s
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] No lag or stuttering

### Responsiveness
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] All elements accessible

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] Color contrast adequate

### Error Handling
- [ ] Invalid input rejected
- [ ] Network errors handled
- [ ] Helpful error messages
- [ ] No crashes

### User Experience
- [ ] Clear instructions
- [ ] Intuitive flow
- [ ] Helpful feedback
- [ ] Encouraging messages
- [ ] Progress visible

---

## Test Results Template

**Date:** ___________  
**Tester:** ___________  
**Browser:** ___________  
**Device:** ___________

### Scenario Results

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Basic Flow | ✓/✗ | |
| 2. MCQ Questions | ✓/✗ | |
| 3. Numerical Questions | ✓/✗ | |
| 4. Conceptual Questions | ✓/✗ | |
| 5. Session Management | ✓/✗ | |
| 6. Language Support | ✓/✗ | |
| 7. Error Handling | ✓/✗ | |
| 8. Performance | ✓/✗ | |
| 9. Responsiveness | ✓/✗ | |
| 10. Accessibility | ✓/✗ | |

### Issues Found

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| | | | |

### Sign-Off

- **Tester:** _________________ **Date:** _________
- **QA Lead:** ________________ **Date:** _________

---

**Status:** Ready for Manual Testing  
**Last Updated:** October 16, 2024
