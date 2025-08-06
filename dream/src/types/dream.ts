export interface Dream {
  id: string;
  content: string;
  analysis: DreamAnalysisResponse;
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
    id: 'minimal',
    name: 'Minimal',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    accentColor: '#888888',
    backgroundPattern: 'half-circle',
    fontFamily: 'sans-serif',
    borderStyle: 'clean'
  },
  {
    id: 'colorful',
    name: 'Colorful',
    primaryColor: '#ff6b6b',
    secondaryColor: '#4ecdc4',
    accentColor: '#45b7d1',
    backgroundPattern: 'rainbow-circle',
    fontFamily: 'sans-serif',
    borderStyle: 'rounded'
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
  tarotCard: {
    title: string;
    subtitle: string;
  };
}

export interface DreamImage {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: Date;
}

export interface CardNameSuggestion {
  title: string;
  subtitle: string;
  reasoning: string;
}
