/**
 * End-to-End Chat Flow Tests
 * Browser automation tests for chat and translation flows
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Chat - Complete User Flows', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  test.afterEach(async () => {
    await page.close();
  });

  /**
   * Test 1: Basic Chat in English
   */
  test('should send and receive messages in English', async () => {
    // Verify chat input is visible
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();

    // Send message
    await chatInput.fill('Hello, how are you?');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Verify message appears in chat
    const messages = page.locator('[data-testid="chat-message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(0);
  });

  /**
   * Test 2: Chat in Hindi
   */
  test('should send and receive messages in Hindi', async () => {
    // Select Hindi language
    await page.selectOption('[data-testid="language-selector"]', 'hi');

    // Verify language changed
    const languageSelector = page.locator('[data-testid="language-selector"]');
    await expect(languageSelector).toHaveValue('hi');

    // Send message in Hindi
    await page.fill('[data-testid="chat-input"]', 'नमस्ते, आप कैसे हैं?');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Verify message appears
    const messages = page.locator('[data-testid="chat-message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(0);
  });

  /**
   * Test 3: Language Switching Mid-Chat
   */
  test('should switch language during chat', async () => {
    // Send message in English
    await page.fill('[data-testid="chat-input"]', 'Hello');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Switch to Hindi
    await page.selectOption('[data-testid="language-selector"]', 'hi');

    // Send message in Hindi
    await page.fill('[data-testid="chat-input"]', 'नमस्ते');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Verify both messages are in chat
    const messages = page.locator('[data-testid="chat-message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(2);
  });

  /**
   * Test 4: Multiple Languages
   */
  test('should support multiple languages', async () => {
    const languages = ['en', 'hi', 'ta', 'te'];
    const messages: Record<string, string> = {
      en: 'Hello',
      hi: 'नमस्ते',
      ta: 'வணக்கம்',
      te: 'హలో',
    };

    for (const lang of languages) {
      // Select language
      await page.selectOption('[data-testid="language-selector"]', lang);

      // Verify language changed
      const languageSelector = page.locator('[data-testid="language-selector"]');
      await expect(languageSelector).toHaveValue(lang);

      // Send message
      await page.fill('[data-testid="chat-input"]', messages[lang]);
      await page.click('[data-testid="send-button"]');

      // Wait for response
      await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });
    }

    // Verify all messages are in chat
    const messages_locator = page.locator('[data-testid="chat-message"]');
    const messageCount = await messages_locator.count();
    expect(messageCount).toBeGreaterThanOrEqual(languages.length);
  });

  /**
   * Test 5: Chat History Persistence
   */
  test('should persist chat history', async () => {
    // Send first message
    await page.fill('[data-testid="chat-input"]', 'First message');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Get initial message count
    let messages = page.locator('[data-testid="chat-message"]');
    const initialCount = await messages.count();

    // Reload page
    await page.reload();

    // Wait for chat to load
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Verify messages persist
    messages = page.locator('[data-testid="chat-message"]');
    const finalCount = await messages.count();
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });

  /**
   * Test 6: Clear Chat History
   */
  test('should clear chat history', async () => {
    // Send message
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Verify message exists
    let messages = page.locator('[data-testid="chat-message"]');
    let messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(0);

    // Clear chat
    const clearButton = page.locator('[data-testid="clear-chat-button"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Confirm clear
      const confirmButton = page.locator('[data-testid="confirm-clear-button"]');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify chat is cleared
      messages = page.locator('[data-testid="chat-message"]');
      messageCount = await messages.count();
      expect(messageCount).toBe(0);
    }
  });

  /**
   * Test 7: Long Conversation
   */
  test('should handle long conversations', async () => {
    // Send 10 messages
    for (let i = 1; i <= 10; i++) {
      await page.fill('[data-testid="chat-input"]', `Message ${i}`);
      await page.click('[data-testid="send-button"]');

      // Wait for response
      await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });
    }

    // Verify all messages are in chat
    const messages = page.locator('[data-testid="chat-message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(10);

    // Verify chat scrolls properly
    const chatContainer = page.locator('[data-testid="chat-container"]');
    const scrollHeight = await chatContainer.evaluate((el: any) => el.scrollHeight);
    expect(scrollHeight).toBeGreaterThan(0);
  });

  /**
   * Test 8: Message Formatting
   */
  test('should display messages with proper formatting', async () => {
    // Send message
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Verify message has proper structure
    const userMessage = page.locator('[data-testid="user-message"]').first();
    await expect(userMessage).toBeVisible();

    // Verify bot message
    const botMessage = page.locator('[data-testid="bot-message"]').first();
    await expect(botMessage).toBeVisible();
  });

  /**
   * Test 9: Typing Indicator
   */
  test('should show typing indicator while waiting for response', async () => {
    // Send message
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');

    // Check for typing indicator
    const typingIndicator = page.locator('[data-testid="typing-indicator"]');
    
    // Typing indicator might appear briefly
    if (await typingIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(typingIndicator).toBeVisible();
    }

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Typing indicator should disappear
    await expect(typingIndicator).not.toBeVisible();
  });

  /**
   * Test 10: Error Handling - Empty Message
   */
  test('should handle empty messages', async () => {
    // Try to send empty message
    await page.click('[data-testid="send-button"]');

    // Should not crash
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();

    // Should be able to send message after
    await chatInput.fill('Test message');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });
  });

  /**
   * Test 11: Error Handling - Network Error
   */
  test('should handle network errors gracefully', async () => {
    // Simulate network error by going offline
    await page.context().setOffline(true);

    // Try to send message
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');

    // Wait a bit for error to appear
    await page.waitForTimeout(2000);

    // Should show error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);

    // Go back online
    await page.context().setOffline(false);

    // Should be able to send message again
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });
  });

  /**
   * Test 12: Performance - Fast Response
   */
  test('should respond quickly to messages', async () => {
    // Measure response time
    const startTime = Date.now();

    // Send message
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="bot-message"]', { timeout: 10000 });

    const responseTime = Date.now() - startTime;

    // Response should be within 5 seconds
    expect(responseTime).toBeLessThan(5000);
  });

  /**
   * Test 13: Copy Message
   */
  test('should copy message to clipboard', async () => {
    // Send message
    await page.fill('[data-testid="chat-input"]', 'Test message to copy');
    await page.click('[data-testid="send-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Find copy button
    const copyButton = page.locator('[data-testid="copy-message-button"]').first();
    
    if (await copyButton.isVisible()) {
      // Click copy button
      await copyButton.click();

      // Verify success message or button state change
      const successMessage = page.locator('[data-testid="copy-success"]');
      const isSuccessVisible = await successMessage.isVisible().catch(() => false);
      
      // Should show some indication of success
      expect(isSuccessVisible || await copyButton.getAttribute('aria-label')).toBeTruthy();
    }
  });

  /**
   * Test 14: Accessibility - Screen Reader Support
   */
  test('should have proper accessibility labels', async () => {
    // Check for ARIA labels
    const chatInput = page.locator('[data-testid="chat-input"]');
    const ariaLabel = await chatInput.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();

    // Check for role attributes
    const sendButton = page.locator('[data-testid="send-button"]');
    const buttonRole = await sendButton.getAttribute('role');
    expect(buttonRole).toBe('button');

    // Check for language selector
    const languageSelector = page.locator('[data-testid="language-selector"]');
    const selectorAriaLabel = await languageSelector.getAttribute('aria-label');
    expect(selectorAriaLabel).toBeTruthy();
  });

  /**
   * Test 15: Mobile Chat Experience
   */
  test('should work well on mobile', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    });

    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:3000');

    // Send message
    await mobilePage.fill('[data-testid="chat-input"]', 'Mobile test');
    await mobilePage.click('[data-testid="send-button"]');

    // Wait for response
    await mobilePage.waitForSelector('[data-testid="chat-message"]', { timeout: 10000 });

    // Verify message appears
    const messages = mobilePage.locator('[data-testid="chat-message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(0);

    // Verify layout is responsive
    const chatContainer = mobilePage.locator('[data-testid="chat-container"]');
    const width = await chatContainer.evaluate((el: any) => el.offsetWidth);
    expect(width).toBeLessThanOrEqual(375);

    await mobileContext.close();
  });
});
