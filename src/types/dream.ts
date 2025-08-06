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
    id: 'minimal',
    name: 'Minimal Gray',
    primaryColor: '#5e5e5e',
    secondaryColor: '#000000',
    accentColor: '#f7f7f7',
    backgroundPattern: 'subtle',
    fontFamily: 'sans-serif',
    borderStyle: 'clean'
  },
  {
    id: 'monochrome',
    name: 'Pure Monochrome',
    primaryColor: '#000000',
    secondaryColor: '#5e5e5e',
    accentColor: '#f7f7f7',
    backgroundPattern: 'geometric',
    fontFamily: 'serif',
    borderStyle: 'minimal'
  },
  {
    id: 'light',
    name: 'Light Minimalist',
    primaryColor: '#f7f7f7',
    secondaryColor: '#5e5e5e',
    accentColor: '#000000',
    backgroundPattern: 'clean',
    fontFamily: 'sans-serif',
    borderStyle: 'subtle'
  },
  {
    id: 'contrast',
    name: 'High Contrast',
    primaryColor: '#000000',
    secondaryColor: '#f7f7f7',
    accentColor: '#5e5e5e',
    backgroundPattern: 'bold',
    fontFamily: 'mono',
    borderStyle: 'sharp'
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