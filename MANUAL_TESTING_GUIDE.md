# Manual Testing Guide - Indic Language Translator

## Overview

This guide provides step-by-step manual testing procedures for the Indic Language Translator application. Manual testing complements automated tests and helps verify user experience and real-world scenarios.

---

## Prerequisites

- Development server running: `pnpm dev`
- Browser DevTools open (F12)
- Network tab visible for API monitoring
- Console tab visible for error checking

---

## Test Scenarios

### Scenario 1: Basic Translation Flow

**Objective:** Verify basic translation functionality

**Steps:**
1. Open chat application at http://localhost:3000
2. Send a message in English: "Hello, how are you?"
3. Wait for assistant response
4. Click "Translate" button on assistant's message
5. Select "Hindi" from language dropdown
6. Observe translated text appears below original

**Expected Results:**
- ✓ Translation appears within 3 seconds
- ✓ Original message remains visible
- ✓ Translated text is in Hindi script
- ✓ No console errors
- ✓ Network tab shows `/api/translate` POST request with 200 status

**Verification Checklist:**
- [ ] Translation appears
- [ ] Response time < 3 seconds
- [ ] Hindi text is readable
- [ ] No errors in console
- [ ] API call successful (200 status)

---

### Scenario 2: Language Selector

**Objective:** Verify language selector component works correctly

**Steps:**
1. Open chat application
2. Look for language selector in header/sidebar
3. Click on language dropdown
4. Verify all 23 languages are displayed
5. Select "Tamil" from the list
6. Verify selection is saved
7. Refresh page
8. Verify Tamil is still selected

**Expected Results:**
- ✓ All 23 languages visible in dropdown
- ✓ Languages show both English and native names
- ✓ Selection changes UI language
- ✓ Selection persists after refresh
- ✓ No console errors

**Verification Checklist:**
- [ ] All 23 languages visible
- [ ] Native names displayed correctly
- [ ] Selection works
- [ ] Persists after refresh
- [ ] No errors

---

### Scenario 3: Multiple Language Translations

**Objective:** Verify translation between different language pairs

**Steps:**
1. Send message: "Good morning"
2. Translate to Tamil
3. Verify Tamil translation appears
4. Send another message: "Thank you"
5. Translate to Telugu
6. Verify Telugu translation appears
7. Send message: "Goodbye"
8. Translate to Marathi
9. Verify Marathi translation appears

**Expected Results:**
- ✓ Each translation appears in correct language
- ✓ All translations complete within 3 seconds
- ✓ Different language scripts are distinguishable
- ✓ No errors in console

**Verification Checklist:**
- [ ] Tamil translation correct
- [ ] Telugu translation correct
- [ ] Marathi translation correct
- [ ] All within time limit
- [ ] Scripts are correct

---

### Scenario 4: Copy to Clipboard

**Objective:** Verify copy functionality works

**Steps:**
1. Send message: "Hello world"
2. Click "Copy" button on original message
3. Paste in text editor (Cmd+V)
4. Verify text matches original
5. Translate to Hindi
6. Click "Copy" button on translated text
7. Paste in text editor
8. Verify Hindi text matches translation

**Expected Results:**
- ✓ Original text copies correctly
- ✓ Translated text copies correctly
- ✓ Pasted text matches exactly
- ✓ No console errors

**Verification Checklist:**
- [ ] Original text copies
- [ ] Translated text copies
- [ ] Text matches exactly
- [ ] No errors

---

### Scenario 5: Web Speech API (Text-to-Speech)

**Objective:** Verify text-to-speech functionality

**Steps:**
1. Send message: "Hello, how are you?"
2. Click "Speak" button (speaker icon) on message
3. Listen for audio playback
4. Verify audio speaks the English text
5. Translate to Hindi
6. Click "Speak" button on Hindi translation
7. Listen for audio playback
8. Verify audio speaks Hindi text

**Expected Results:**
- ✓ English audio plays correctly
- ✓ Hindi audio plays correctly
- ✓ Audio language matches text language
- ✓ No console errors

**Verification Checklist:**
- [ ] English audio plays
- [ ] Hindi audio plays
- [ ] Languages correct
- [ ] No errors

---

### Scenario 6: Translation Caching

**Objective:** Verify translation caching works

**Steps:**
1. Open DevTools Network tab
2. Send message: "Hello"
3. Translate to Hindi
4. Note the response time (e.g., 2500ms)
5. Translate same message to Hindi again
6. Observe response time (should be instant)
7. Check Network tab - no new API call should be made

**Expected Results:**
- ✓ First translation takes 2-3 seconds
- ✓ Second translation is instant
- ✓ No duplicate API calls in Network tab
- ✓ Cache is working correctly

**Verification Checklist:**
- [ ] First translation: 2-3 seconds
- [ ] Second translation: instant
- [ ] No duplicate API calls
- [ ] Cache working

---

### Scenario 7: Error Handling - Empty Text

**Objective:** Verify error handling for invalid input

**Steps:**
1. Try to send empty message
2. Observe error message or validation
3. Try to translate empty text
4. Observe error handling

**Expected Results:**
- ✓ Empty messages are rejected
- ✓ Clear error message displayed
- ✓ No console errors
- ✓ Application remains stable

**Verification Checklist:**
- [ ] Empty text rejected
- [ ] Error message clear
- [ ] No console errors
- [ ] App stable

---

### Scenario 8: Error Handling - Unsupported Language

**Objective:** Verify error handling for unsupported languages

**Steps:**
1. Manually modify API request to use unsupported language (e.g., "xx")
2. Send translation request
3. Observe error response

**Expected Results:**
- ✓ API returns 400 error
- ✓ Error message indicates unsupported language
- ✓ User-friendly error displayed
- ✓ No console errors

**Verification Checklist:**
- [ ] 400 error returned
- [ ] Error message clear
- [ ] User-friendly display
- [ ] No console errors

---

### Scenario 9: Performance Testing

**Objective:** Verify performance meets requirements

**Steps:**
1. Open DevTools Performance tab
2. Send message: "Hello world" (2 words)
3. Translate to Hindi
4. Record performance metrics
5. Send message: "The quick brown fox jumps over the lazy dog" (9 words)
6. Translate to Hindi
7. Record performance metrics
8. Send message with 50 words
9. Translate to Hindi
10. Record performance metrics

**Expected Results:**
- ✓ 2 words: < 1 second
- ✓ 9 words: < 2 seconds
- ✓ 50 words: < 3 seconds
- ✓ Throughput: ~20 words/second

**Verification Checklist:**
- [ ] 2 words: < 1s
- [ ] 9 words: < 2s
- [ ] 50 words: < 3s
- [ ] Throughput acceptable

---

### Scenario 10: Responsive Design

**Objective:** Verify UI works on different screen sizes

**Steps:**
1. Open DevTools Device Emulation
2. Test on iPhone 12 (390x844)
3. Verify language selector is accessible
4. Verify translate button is clickable
5. Test on iPad (768x1024)
6. Verify layout is responsive
7. Test on Desktop (1920x1080)
8. Verify layout is optimal

**Expected Results:**
- ✓ Mobile: All elements accessible
- ✓ Tablet: Layout adapts properly
- ✓ Desktop: Layout is optimal
- ✓ No horizontal scrolling on mobile

**Verification Checklist:**
- [ ] Mobile responsive
- [ ] Tablet responsive
- [ ] Desktop optimal
- [ ] No scrolling issues

---

### Scenario 11: LocalStorage Persistence

**Objective:** Verify user preferences are saved

**Steps:**
1. Select language: "Tamil"
2. Send a message
3. Close browser tab
4. Reopen application
5. Verify Tamil is still selected
6. Check DevTools Application tab > LocalStorage
7. Verify language preference is stored

**Expected Results:**
- ✓ Language preference persists
- ✓ LocalStorage contains preference
- ✓ Correct key-value pair stored
- ✓ No console errors

**Verification Checklist:**
- [ ] Language persists
- [ ] LocalStorage has entry
- [ ] Correct value stored
- [ ] No errors

---

### Scenario 12: API Response Validation

**Objective:** Verify API responses are correct

**Steps:**
1. Open DevTools Network tab
2. Send translation request
3. Click on `/api/translate` request
4. View Response tab
5. Verify response structure:
   ```json
   {
     "success": true,
     "data": {
       "translatedText": "...",
       "sourceLang": "en",
       "targetLang": "hi",
       "duration": 2500
     }
   }
   ```

**Expected Results:**
- ✓ Response has `success: true`
- ✓ `translatedText` is non-empty
- ✓ Language codes are correct
- ✓ Duration is in milliseconds
- ✓ Status code is 200

**Verification Checklist:**
- [ ] Response structure correct
- [ ] All fields present
- [ ] Values are correct
- [ ] Status 200

---

### Scenario 13: Concurrent Translations

**Objective:** Verify app handles multiple translations

**Steps:**
1. Send message 1: "Hello"
2. Immediately translate to Hindi
3. While translating, send message 2: "Good morning"
4. Immediately translate to Tamil
5. Observe both translations complete
6. Verify both are correct

**Expected Results:**
- ✓ Both translations complete
- ✓ No race conditions
- ✓ Both results are correct
- ✓ No console errors

**Verification Checklist:**
- [ ] Both translations complete
- [ ] No race conditions
- [ ] Results correct
- [ ] No errors

---

### Scenario 14: Browser Compatibility

**Objective:** Verify app works in different browsers

**Steps:**
1. Test in Chrome
2. Test in Safari
3. Test in Firefox
4. Verify all features work in each browser
5. Check console for browser-specific errors

**Expected Results:**
- ✓ Chrome: All features work
- ✓ Safari: All features work
- ✓ Firefox: All features work
- ✓ No browser-specific errors

**Verification Checklist:**
- [ ] Chrome works
- [ ] Safari works
- [ ] Firefox works
- [ ] No errors

---

### Scenario 15: Accessibility Testing

**Objective:** Verify app is accessible

**Steps:**
1. Use keyboard only (no mouse)
2. Tab through all interactive elements
3. Verify all buttons are reachable
4. Verify language selector is keyboard accessible
5. Use screen reader (if available)
6. Verify all content is readable

**Expected Results:**
- ✓ All elements keyboard accessible
- ✓ Tab order is logical
- ✓ Focus indicators visible
- ✓ Screen reader compatible

**Verification Checklist:**
- [ ] Keyboard accessible
- [ ] Tab order logical
- [ ] Focus visible
- [ ] Screen reader compatible

---

## Test Report Template

### Test Session: [Date/Time]

**Tester:** [Name]  
**Browser:** [Chrome/Safari/Firefox]  
**OS:** [macOS/Windows/Linux]  
**Device:** [Desktop/Tablet/Mobile]

| Scenario | Status | Notes | Issues |
|----------|--------|-------|--------|
| Basic Translation | ✓/✗ | | |
| Language Selector | ✓/✗ | | |
| Multiple Languages | ✓/✗ | | |
| Copy to Clipboard | ✓/✗ | | |
| Text-to-Speech | ✓/✗ | | |
| Caching | ✓/✗ | | |
| Error Handling | ✓/✗ | | |
| Performance | ✓/✗ | | |
| Responsive | ✓/✗ | | |
| Persistence | ✓/✗ | | |
| API Response | ✓/✗ | | |
| Concurrent | ✓/✗ | | |
| Compatibility | ✓/✗ | | |
| Accessibility | ✓/✗ | | |

---

## Issue Reporting

When reporting issues, include:

1. **Description:** What happened?
2. **Steps to Reproduce:** How to reproduce?
3. **Expected:** What should happen?
4. **Actual:** What actually happened?
5. **Environment:** Browser, OS, device
6. **Screenshots:** Visual evidence
7. **Console Errors:** Any error messages?
8. **Network Requests:** Any failed requests?

---

## Performance Benchmarks

### Expected Performance

| Metric | Target | Acceptable |
|--------|--------|-----------|
| Single word translation | < 1s | < 1.5s |
| 10 words translation | < 2s | < 2.5s |
| 50 words translation | < 3s | < 3.5s |
| Cached translation | < 100ms | < 200ms |
| UI responsiveness | < 100ms | < 200ms |

---

## Regression Testing Checklist

Before each release:

- [ ] All 15 scenarios pass
- [ ] No new console errors
- [ ] Performance meets benchmarks
- [ ] No broken links
- [ ] All languages work
- [ ] Mobile responsive
- [ ] Accessibility maintained
- [ ] API responses valid
- [ ] Error handling works
- [ ] Caching functional

---

## Quick Test Checklist

**5-minute quick test:**
1. [ ] Send message in English
2. [ ] Translate to Hindi
3. [ ] Verify translation appears
4. [ ] Check Network tab for API call
5. [ ] Verify response time < 3 seconds

---

**Last Updated:** October 16, 2024  
**Version:** 1.0
