// Environment detection
export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
  process.env.PLAYWRIGHT ||
  process.env.CI_PLAYWRIGHT
);

export const guestRegex = /^guest-\d+$/;

// This will be set when the app initializes
export let DUMMY_PASSWORD = 'dummy-password-placeholder';

// Function to initialize the dummy password asynchronously
export async function initializeDummyPassword() {
  if (typeof window === 'undefined') {
    const { generateDummyPassword } = await import('./db/utils');
    DUMMY_PASSWORD = await generateDummyPassword();
  }
  return DUMMY_PASSWORD;
}

// Initialize the dummy password immediately in Node.js environment
if (typeof window === 'undefined') {
  initializeDummyPassword().catch(console.error);
}
