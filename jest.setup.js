/**
 * Jest Setup File
 * Configures global test environment and utilities
 */

// Extend Jest matchers if needed
expect.extend({
  toBeValidLanguageCode(received) {
    const validCodes = [
      'en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa',
      'or', 'as', 'ur', 'sa', 'kok', 'mni', 'mai', 'sd', 'ks', 'dg',
      'bodo', 'sat'
    ];
    
    const pass = validCodes.includes(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid language code`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid language code`,
        pass: false,
      };
    }
  },
});

// Set test timeout
jest.setTimeout(30000);

// Mock environment variables if needed
process.env.NODE_ENV = 'test';
