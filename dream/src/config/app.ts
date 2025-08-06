/**
 * Centralized application configuration
 * All app-wide constants should be defined here
 */
export const APP_CONFIG = {
  // App Identity
  name: 'Oneiroi',
  tagline: 'Your Dream Keeper',
  description: 'A gentle place to save your dreams. Oneiroi helps you capture night visions and turn them into beautiful images you can keep forever.',
  
  // Version info
  version: '1.0.0',
  
  // URLs and links
  author: 'Dream Journal Team',
  
  // Feature flags
  features: {
    tarotCards: true,
    dreamAnalysis: true,
    imageGeneration: true,
  },
  
  // UI Configuration
  ui: {
    maxDreamsPerPage: 12,
    animationDuration: 20, // seconds for logo rotation
    loadingIconSize: {
      small: 'h-10 w-10',
      large: 'h-12 w-12',
    },
  },
  
  // Storage keys
  storage: {
    apiKey: 'gemini_api_key',
    dreams: 'oneiroi_dreams',
  },
} as const;

// Export individual constants for convenience
export const APP_NAME = APP_CONFIG.name;
export const APP_TAGLINE = APP_CONFIG.tagline;
export const APP_DESCRIPTION = APP_CONFIG.description;
export const APP_VERSION = APP_CONFIG.version;
