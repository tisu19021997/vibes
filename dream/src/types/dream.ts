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
  cdnPublicId?: string;
  theme: string;
  title: string;
  subtitle?: string;
  analysis: string;
  createdAt: Date;
}

export const CARD_THEMES: string[] = [
  'Minimal',
  'Colorful',
];

export interface DreamAnalysisRequest {
  dreamContent: string;
  userId?: string;
  includeJungianElements?: boolean;
  // Up to the last 5 previous dreams' content (most recent first) to provide context
  previousDreams?: string[];
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
