/**
 * End-to-End Learning Flow Tests
 * Browser automation tests for complete user flows
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Learning Mode - Complete User Flows', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  test.afterEach(async () => {
    await page.close();
  });

  /**
   * Test 1: Complete Learning Session in Hindi
   */
  test('should complete full learning session in Hindi', async () => {
    // Step 1: Select Hindi language
    await page.selectOption('[data-testid="language-selector"]', 'hi');
    
    // Verify UI is in Hindi
    const languageSelector = page.locator('[data-testid="language-selector"]');
    await expect(languageSelector).toHaveValue('hi');

    // Step 2: Switch to learning mode
    await page.click('[data-testid="learning-mode-toggle"]');
    
    // Verify learning mode is active
    const learningModeButton = page.locator('[data-testid="learning-mode-toggle"]');
    await expect(learningModeButton).toHaveAttribute('aria-pressed', 'true');

    // Step 3: Request math question in Hindi
    await page.fill('[data-testid="chat-input"]', 'गणित का प्रश्न दें');
    await page.click('[data-testid="send-button"]');

    // Step 4: Verify question appears
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });
    
    const questionText = page.locator('[data-testid="mcq-question"]');
    await expect(questionText).toBeVisible();

    // Step 5: Verify options are displayed
    const optionA = page.locator('[data-testid="option-A"]');
    const optionB = page.locator('[data-testid="option-B"]');
    const optionC = page.locator('[data-testid="option-C"]');
    const optionD = page.locator('[data-testid="option-D"]');

    await expect(optionA).toBeVisible();
    await expect(optionB).toBeVisible();
    await expect(optionC).toBeVisible();
    await expect(optionD).toBeVisible();

    // Step 6: Answer question
    await page.click('[data-testid="option-A"]');

    // Step 7: Verify feedback appears
    await page.waitForSelector('[data-testid="feedback"]', { timeout: 5000 });
    
    const feedback = page.locator('[data-testid="feedback"]');
    await expect(feedback).toBeVisible();

    // Step 8: Verify explanation appears
    const explanation = page.locator('[data-testid="explanation"]');
    await expect(explanation).toBeVisible();

    // Step 9: Request next question
    await page.click('[data-testid="next-question-button"]');

    // Step 10: Verify new question appears
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });
    const newQuestion = page.locator('[data-testid="mcq-question"]');
    await expect(newQuestion).toBeVisible();
  });

  /**
   * Test 2: Language Switching During Learning
   */
  test('should switch language during learning session', async () => {
    // Start in English
    await page.click('[data-testid="learning-mode-toggle"]');
    await page.fill('[data-testid="chat-input"]', 'Give me a math question');
    await page.click('[data-testid="send-button"]');

    // Wait for question
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

    // Switch to Hindi
    await page.selectOption('[data-testid="language-selector"]', 'hi');

    // Verify UI updates to Hindi
    const languageSelector = page.locator('[data-testid="language-selector"]');
    await expect(languageSelector).toHaveValue('hi');

    // Verify question is still visible
    const question = page.locator('[data-testid="mcq-question"]');
    await expect(question).toBeVisible();

    // Answer question
    await page.click('[data-testid="option-A"]');

    // Verify feedback in Hindi
    const feedback = page.locator('[data-testid="feedback"]');
    await expect(feedback).toBeVisible();
  });

  /**
   * Test 3: Multiple Questions in Session
   */
  test('should answer multiple questions in sequence', async () => {
    // Select Hindi
    await page.selectOption('[data-testid="language-selector"]', 'hi');

    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    // Request questions and answer them
    for (let i = 0; i < 3; i++) {
      // Request question
      await page.fill('[data-testid="chat-input"]', 'अगला प्रश्न');
      await page.click('[data-testid="send-button"]');

      // Wait for question
      await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

      // Answer question
      const options = ['option-A', 'option-B', 'option-C', 'option-D'];
      const randomOption = options[Math.floor(Math.random() * options.length)];
      await page.click(`[data-testid="${randomOption}"]`);

      // Wait for feedback
      await page.waitForSelector('[data-testid="feedback"]', { timeout: 5000 });

      // Click next question
      if (i < 2) {
        await page.click('[data-testid="next-question-button"]');
      }
    }

    // Verify session summary
    const summary = page.locator('[data-testid="session-summary"]');
    await expect(summary).toBeVisible();
  });

  /**
   * Test 4: Difficulty Level Selection
   */
  test('should select and change difficulty levels', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    // Select beginner level
    await page.selectOption('[data-testid="difficulty-selector"]', 'beginner');
    
    let difficultySelector = page.locator('[data-testid="difficulty-selector"]');
    await expect(difficultySelector).toHaveValue('beginner');

    // Request question
    await page.fill('[data-testid="chat-input"]', 'Give me a question');
    await page.click('[data-testid="send-button"]');

    // Wait for question
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

    // Change to intermediate
    await page.selectOption('[data-testid="difficulty-selector"]', 'intermediate');
    
    difficultySelector = page.locator('[data-testid="difficulty-selector"]');
    await expect(difficultySelector).toHaveValue('intermediate');

    // Request new question
    await page.fill('[data-testid="chat-input"]', 'Next question');
    await page.click('[data-testid="send-button"]');

    // Wait for new question
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });
  });

  /**
   * Test 5: Subject Selection
   */
  test('should select different subjects', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    const subjects = ['mathematics', 'science', 'history'];

    for (const subject of subjects) {
      // Select subject
      await page.selectOption('[data-testid="subject-selector"]', subject);
      
      const subjectSelector = page.locator('[data-testid="subject-selector"]');
      await expect(subjectSelector).toHaveValue(subject);

      // Request question
      await page.fill('[data-testid="chat-input"]', `Give me a ${subject} question`);
      await page.click('[data-testid="send-button"]');

      // Wait for question
      await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

      // Verify question appears
      const question = page.locator('[data-testid="mcq-question"]');
      await expect(question).toBeVisible();
    }
  });

  /**
   * Test 6: Hint System
   */
  test('should display hints for questions', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    // Request question
    await page.fill('[data-testid="chat-input"]', 'Give me a question');
    await page.click('[data-testid="send-button"]');

    // Wait for question
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

    // Request hint
    const hintButton = page.locator('[data-testid="hint-button"]');
    if (await hintButton.isVisible()) {
      await hintButton.click();

      // Verify hint appears
      const hint = page.locator('[data-testid="hint-text"]');
      await expect(hint).toBeVisible();
    }
  });

  /**
   * Test 7: Progress Display
   */
  test('should display progress during session', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    // Request question
    await page.fill('[data-testid="chat-input"]', 'Give me a question');
    await page.click('[data-testid="send-button"]');

    // Wait for question
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

    // Verify progress indicator
    const progress = page.locator('[data-testid="progress-indicator"]');
    await expect(progress).toBeVisible();

    // Answer question
    await page.click('[data-testid="option-A"]');

    // Verify progress updates
    const progressText = page.locator('[data-testid="progress-text"]');
    await expect(progressText).toBeVisible();
  });

  /**
   * Test 8: Bilingual Question Display
   */
  test('should display questions in selected language', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    // Select Hindi
    await page.selectOption('[data-testid="language-selector"]', 'hi');

    // Request question
    await page.fill('[data-testid="chat-input"]', 'प्रश्न दें');
    await page.click('[data-testid="send-button"]');

    // Wait for question
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

    // Verify question text is in Hindi
    const questionText = page.locator('[data-testid="mcq-question"]');
    const text = await questionText.textContent();
    
    // Check if text contains Hindi characters
    expect(text).toMatch(/[\u0900-\u097F]/); // Hindi Unicode range
  });

  /**
   * Test 9: Error Handling - Invalid Input
   */
  test('should handle invalid inputs gracefully', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    // Send empty message
    await page.click('[data-testid="send-button"]');

    // Should not crash
    const learningMode = page.locator('[data-testid="learning-mode-toggle"]');
    await expect(learningMode).toBeVisible();

    // Send very long message
    const longMessage = 'a'.repeat(5000);
    await page.fill('[data-testid="chat-input"]', longMessage);
    await page.click('[data-testid="send-button"]');

    // Should handle gracefully
    await expect(learningMode).toBeVisible();
  });

  /**
   * Test 10: Performance - Fast Question Loading
   */
  test('should load questions quickly', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    // Measure time to load question
    const startTime = Date.now();

    // Request question
    await page.fill('[data-testid="chat-input"]', 'Give me a question');
    await page.click('[data-testid="send-button"]');

    // Wait for question
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  /**
   * Test 11: Session Persistence
   */
  test('should persist session data across page reload', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    // Request question
    await page.fill('[data-testid="chat-input"]', 'Give me a question');
    await page.click('[data-testid="send-button"]');

    // Wait for question
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

    // Get session ID
    const sessionId = await page.getAttribute('[data-testid="session-id"]', 'data-session-id');

    // Reload page
    await page.reload();

    // Verify session data persists
    const newSessionId = await page.getAttribute('[data-testid="session-id"]', 'data-session-id');
    expect(sessionId).toBe(newSessionId);
  });

  /**
   * Test 12: Accessibility - Keyboard Navigation
   */
  test('should support keyboard navigation', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    // Request question
    await page.fill('[data-testid="chat-input"]', 'Give me a question');
    await page.press('[data-testid="chat-input"]', 'Enter'); // Use Enter instead of click

    // Wait for question
    await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

    // Navigate to option using Tab
    await page.press('[data-testid="option-A"]', 'Tab');
    await page.press('[data-testid="option-B"]', 'Tab');

    // Select option using Enter
    await page.press('[data-testid="option-A"]', 'Enter');

    // Verify feedback appears
    const feedback = page.locator('[data-testid="feedback"]');
    await expect(feedback).toBeVisible();
  });

  /**
   * Test 13: Mobile Responsiveness
   */
  test('should work on mobile devices', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }, // iPhone size
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    });

    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:3000');

    // Start learning mode
    await mobilePage.click('[data-testid="learning-mode-toggle"]');

    // Request question
    await mobilePage.fill('[data-testid="chat-input"]', 'Give me a question');
    await mobilePage.click('[data-testid="send-button"]');

    // Wait for question
    await mobilePage.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

    // Verify question is visible on mobile
    const question = mobilePage.locator('[data-testid="mcq-question"]');
    await expect(question).toBeVisible();

    // Answer question
    await mobilePage.click('[data-testid="option-A"]');

    // Verify feedback
    const feedback = mobilePage.locator('[data-testid="feedback"]');
    await expect(feedback).toBeVisible();

    await mobileContext.close();
  });

  /**
   * Test 14: Chat History
   */
  test('should maintain chat history', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    const messages: string[] = [];

    // Send multiple messages
    for (let i = 0; i < 3; i++) {
      const message = `Question ${i + 1}`;
      messages.push(message);

      await page.fill('[data-testid="chat-input"]', message);
      await page.click('[data-testid="send-button"]');

      // Wait for response
      await page.waitForSelector('[data-testid="chat-message"]', { timeout: 5000 });
    }

    // Verify all messages are in history
    const chatHistory = page.locator('[data-testid="chat-history"]');
    const historyText = await chatHistory.textContent();

    for (const message of messages) {
      expect(historyText).toContain(message);
    }
  });

  /**
   * Test 15: Session End and Summary
   */
  test('should display session summary at end', async () => {
    // Start learning mode
    await page.click('[data-testid="learning-mode-toggle"]');

    // Answer 3 questions
    for (let i = 0; i < 3; i++) {
      // Request question
      await page.fill('[data-testid="chat-input"]', `Question ${i + 1}`);
      await page.click('[data-testid="send-button"]');

      // Wait for question
      await page.waitForSelector('[data-testid="mcq-question"]', { timeout: 10000 });

      // Answer question
      await page.click('[data-testid="option-A"]');

      // Wait for feedback
      await page.waitForSelector('[data-testid="feedback"]', { timeout: 5000 });
    }

    // End session
    await page.click('[data-testid="end-session-button"]');

    // Verify summary appears
    const summary = page.locator('[data-testid="session-summary"]');
    await expect(summary).toBeVisible();

    // Verify summary contains stats
    const summaryText = await summary.textContent();
    expect(summaryText).toContain('Questions');
    expect(summaryText).toContain('Score');
  });
});
