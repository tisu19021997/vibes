export interface Dream {
  id: string;
  content: string;
  analysis: string;
  tarotCard?: TarotCard;
  createdAt: Date;
  updatedAt: Date;
}

export interface TarotCard {
  id: string;
  imageUrl: string;
  theme: CardTheme;
  title: string;
  subtitle?: string;
  analysis: string;
  createdAt: Date;
}

export interface CardTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundPattern: string;
  fontFamily: string;
  borderStyle: string;
}

export const CARD_THEMES: CardTheme[] = [
  {
    id: 'mystical',
    name: 'Mystical Night',
    primaryColor: '#8B5CF6',
    secondaryColor: '#A855F7',
    accentColor: '#C084FC',
    backgroundPattern: 'cosmic',
    fontFamily: 'serif',
    borderStyle: 'ornate'
  },
  {
    id: 'ethereal',
    name: 'Ethereal Dawn',
    primaryColor: '#06B6D4',
    secondaryColor: '#67E8F9',
    accentColor: '#A5F3FC',
    backgroundPattern: 'flowing',
    fontFamily: 'sans-serif',
    borderStyle: 'minimal'
  },
  {
    id: 'ancient',
    name: 'Ancient Wisdom',
    primaryColor: '#D97706',
    secondaryColor: '#F59E0B',
    accentColor: '#FCD34D',
    backgroundPattern: 'geometric',
    fontFamily: 'serif',
    borderStyle: 'classic'
  },
  {
    id: 'lunar',
    name: 'Lunar Eclipse',
    primaryColor: '#4C1D95',
    secondaryColor: '#6D28D9',
    accentColor: '#8B5CF6',
    backgroundPattern: 'celestial',
    fontFamily: 'fantasy',
    borderStyle: 'mystical'
  }
];

export interface DreamAnalysisRequest {
  dreamContent: string;
  userId?: string;
  includeJungianElements?: boolean;
}

export interface DreamAnalysisResponse {
  analysis: string;
  jungianInterpretation: string;
  symbols: string[];
  archetypes: string[];
  emotions: string[];
  suggestions: string[];
}