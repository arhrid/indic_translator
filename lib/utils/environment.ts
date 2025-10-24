/**
 * Environment utilities
 * Helps determine if code is running on server or client side
 */

export const isServer = typeof window === 'undefined';

export const isBrowser = !isServer;
