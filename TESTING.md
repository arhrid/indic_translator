# Testing Guide - Indic Language Translator

## Overview

This document provides comprehensive guidance on testing the Indic Language Translator application. The test suite covers unit tests, integration tests, and API endpoint tests.

---

## Test Structure

```
tests/
├── translation.test.ts          # Unit tests for translation service
├── api/
│   └── translate.test.ts        # API endpoint tests
└── fixtures/
    └── test-data.ts             # Test data and fixtures
```

---

## Running Tests

### Run All Tests

```bash
# Using pnpm
pnpm test

# Using npm
npm test

# Using Playwright (as configured in package.json)
export PLAYWRIGHT=True && pnpm exec playwright test
```

### Run Specific Test File

```bash
# Run translation service tests
pnpm test tests/translation.test.ts

# Run API endpoint tests
pnpm test tests/api/translate.test.ts
```

### Run Tests in Watch Mode

```bash
pnpm test --watch
```

### Run Tests with Coverage

```bash
pnpm test --coverage
```

### Run Tests with Verbose Output

```bash
pnpm test --verbose
```

---

## Test Suites

### 1. Translation Service Tests (`tests/translation.test.ts`)

**Location:** `tests/translation.test.ts`  
**Coverage:** `lib/translation/translator.ts`  
**Total Tests:** 40+

#### Test Suites

##### Model Loading (3 tests)
- ✓ Model loads successfully
- ✓ Returns true on subsequent load attempts (cached)
- ✓ Model loaded status after loading

**Purpose:** Verify singleton pattern and lazy loading mechanism

##### Language Support (6 tests)
- ✓ Returns all supported languages
- ✓ Includes all 22 Indian languages + English
- ✓ Returns language codes as array
- ✓ Validates supported languages correctly
- ✓ Gets language details by code
- ✓ Returns undefined for unsupported language

**Purpose:** Verify language support and validation

##### Input Validation (7 tests)
- ✓ Rejects empty text
- ✓ Rejects whitespace-only text
- ✓ Rejects text exceeding 500 words
- ✓ Accepts text up to 500 words
- ✓ Rejects unsupported source language
- ✓ Rejects unsupported target language
- ✓ Rejects when source and target are the same

**Purpose:** Verify input validation logic

##### Translation Requests (5 tests)
- ✓ Handles valid translation request
- ✓ Trims whitespace from text
- ✓ Measures translation duration
- ✓ Supports multiple language pairs
- ✓ Returns proper response structure

**Purpose:** Verify translation request handling

##### Error Handling (3 tests)
- ✓ Returns error object with code and message
- ✓ Includes error details when available
- ✓ Handles model loading errors gracefully

**Purpose:** Verify error handling and reporting

##### Service Status (2 tests)
- ✓ Returns service status
- ✓ Reports correct number of supported languages

**Purpose:** Verify status reporting

##### Edge Cases (5 tests)
- ✓ Handles single word translation
- ✓ Handles text with special characters
- ✓ Handles text with punctuation
- ✓ Handles text with numbers
- ✓ Handles text with mixed case

**Purpose:** Verify robustness with edge cases

##### Type Safety (2 tests)
- ✓ Has correct response type for success
- ✓ Has correct response type for error

**Purpose:** Verify TypeScript type safety

### 2. API Endpoint Tests (`tests/api/translate.test.ts`)

**Location:** `tests/api/translate.test.ts`  
**Coverage:** `app/api/translate/route.ts`  
**Total Tests:** 35+

#### Test Suites

##### GET Endpoint (3 tests)
- ✓ Returns API documentation
- ✓ Includes supported languages in documentation
- ✓ Includes example request and response

**Purpose:** Verify API documentation endpoint

##### Valid POST Requests (6 tests)
- ✓ Translates English to Hindi
- ✓ Translates between different language pairs
- ✓ Handles single word translation
- ✓ Handles text with punctuation
- ✓ Returns duration in milliseconds
- ✓ Returns proper response structure

**Purpose:** Verify successful translation requests

##### Invalid POST Requests (8 tests)
- ✓ Rejects empty text
- ✓ Rejects missing text field
- ✓ Rejects missing sourceLang field
- ✓ Rejects missing targetLang field
- ✓ Rejects unsupported source language
- ✓ Rejects unsupported target language
- ✓ Rejects text exceeding maximum length
- ✓ Rejects same source and target language

**Purpose:** Verify request validation

##### Invalid JSON (2 tests)
- ✓ Rejects invalid JSON
- ✓ Rejects non-JSON content type

**Purpose:** Verify JSON parsing

##### HTTP Status Codes (4 tests)
- ✓ Returns 200 for successful translation
- ✓ Returns 400 for validation errors
- ✓ Returns 400 for unsupported language
- ✓ Returns 400 for invalid JSON

**Purpose:** Verify HTTP status codes

##### Response Format (3 tests)
- ✓ Returns success response with correct structure
- ✓ Returns error response with correct structure
- ✓ Returns JSON content type

**Purpose:** Verify response format

##### CORS Support (2 tests)
- ✓ Handles CORS preflight request
- ✓ Includes CORS headers

**Purpose:** Verify CORS support

##### Edge Cases (5 tests)
- ✓ Handles very long text (but under 500 words)
- ✓ Handles text with special characters
- ✓ Handles text with numbers
- ✓ Handles text with newlines
- ✓ Handles text with mixed case

**Purpose:** Verify robustness with edge cases

---

## Test Data

### Sample Translations

```typescript
// English to Hindi
{
  text: "Hello, how are you?",
  sourceLang: "en",
  targetLang: "hi"
}

// English to Tamil
{
  text: "Good morning",
  sourceLang: "en",
  targetLang: "ta"
}

// Hindi to English
{
  text: "नमस्ते",
  sourceLang: "hi",
  targetLang: "en"
}
```

### Language Codes

All 22 Indian languages + English:
- `en` - English
- `hi` - Hindi
- `ta` - Tamil
- `te` - Telugu
- `kn` - Kannada
- `ml` - Malayalam
- `mr` - Marathi
- `gu` - Gujarati
- `bn` - Bengali
- `pa` - Punjabi
- `or` - Odia
- `as` - Assamese
- `ur` - Urdu
- `sa` - Sanskrit
- `kok` - Konkani
- `mni` - Manipuri
- `mai` - Maithili
- `sd` - Sindhi
- `ks` - Kashmiri
- `dg` - Dogri
- `bodo` - Bodo
- `sat` - Santali

---

## Writing New Tests

### Test Template

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Feature Name', () => {
  describe('Sub-feature', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test data';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Best Practices

1. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should reject empty text with VALIDATION_ERROR code', () => {});
   
   // Bad
   it('should reject empty text', () => {});
   ```

2. **Follow AAA Pattern**
   - Arrange: Set up test data
   - Act: Execute the function
   - Assert: Verify the results

3. **Test One Thing Per Test**
   ```typescript
   // Good
   it('should validate text is not empty', () => {});
   it('should validate text does not exceed 500 words', () => {});
   
   // Bad
   it('should validate text', () => {});
   ```

4. **Use Fixtures for Common Data**
   ```typescript
   const validRequest = {
     text: 'Hello',
     sourceLang: 'en',
     targetLang: 'hi'
   };
   ```

5. **Test Error Cases**
   ```typescript
   it('should handle invalid input gracefully', () => {
     const result = translate('', 'en', 'hi');
     expect(result.code).toBe('VALIDATION_ERROR');
   });
   ```

---

## Coverage Goals

### Current Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 70% |
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |

### View Coverage Report

```bash
# Generate coverage report
pnpm test --coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

---

## Debugging Tests

### Run Single Test

```bash
pnpm test --testNamePattern="should translate English to Hindi"
```

### Run Tests in Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Add Console Logs

```typescript
it('should translate text', async () => {
  const result = await translate('Hello', 'en', 'hi');
  console.log('Translation result:', result);
  expect(result.translatedText).toBeTruthy();
});
```

### Use Debugger

```typescript
it('should translate text', async () => {
  debugger; // Execution will pause here
  const result = await translate('Hello', 'en', 'hi');
  expect(result.translatedText).toBeTruthy();
});
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test --coverage
```

---

## Performance Testing

### Measure Translation Speed

```typescript
it('should translate within acceptable time', async () => {
  const start = Date.now();
  const result = await translate('Hello', 'en', 'hi');
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(5000); // 5 seconds
});
```

### Benchmark Multiple Translations

```typescript
it('should handle batch translations efficiently', async () => {
  const texts = ['Hello', 'Good morning', 'How are you?'];
  const start = Date.now();
  
  for (const text of texts) {
    await translate(text, 'en', 'hi');
  }
  
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(10000); // 10 seconds for 3 translations
});
```

---

## Troubleshooting

### Tests Timeout

**Problem:** Tests exceed timeout limit

**Solution:**
```bash
# Increase timeout in jest.setup.js
jest.setTimeout(60000); // 60 seconds
```

### Module Not Found

**Problem:** Cannot find module '@/lib/translation/translator'

**Solution:**
```bash
# Verify moduleNameMapper in jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### API Tests Fail

**Problem:** API endpoint tests fail with connection refused

**Solution:**
```bash
# Ensure dev server is running
pnpm dev

# In another terminal
pnpm test tests/api/translate.test.ts
```

### Type Errors

**Problem:** TypeScript errors in test files

**Solution:**
```bash
# Install TypeScript types
pnpm add -D @types/jest

# Update tsconfig.json
{
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
```

---

## Test Maintenance

### Update Tests When Code Changes

1. Run tests to identify failures
2. Review changes to understand impact
3. Update test expectations
4. Add new tests for new functionality
5. Verify coverage remains above targets

### Regular Test Review

- Review test coverage monthly
- Remove obsolete tests
- Refactor duplicated test code
- Update test data as needed

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [TypeScript Testing Guide](https://www.typescriptlang.org/docs/handbook/testing.html)

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run all tests |
| `pnpm test --watch` | Run tests in watch mode |
| `pnpm test --coverage` | Generate coverage report |
| `pnpm test --testNamePattern="pattern"` | Run specific tests |
| `pnpm test --verbose` | Show detailed output |

---

**Last Updated:** October 16, 2024  
**Test Suite Version:** 1.0  
**Total Tests:** 75+
