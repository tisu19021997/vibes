import { DreamAnalysisRequest, DreamAnalysisResponse } from '@/types/dream';

const GEMINI_API_KEY = 'your-gemini-api-key-here'; // This will be set by user
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

const JUNG_PROMPT = `
You are a wise dream analyst deeply versed in Carl Jung's analytical psychology and dream interpretation theories. 
Analyze the following dream through a Jungian lens, considering:

1. **Collective Unconscious**: Identify archetypal symbols and universal patterns
2. **Personal Unconscious**: Look for repressed emotions, memories, and unresolved conflicts
3. **Shadow Integration**: Explore shadow elements and what they might represent
4. **Anima/Animus**: Identify feminine/masculine archetypes and their significance
5. **Individuation Process**: How this dream might relate to the dreamer's journey toward wholeness
6. **Compensation Theory**: What conscious attitudes might this dream be compensating for

Provide a thoughtful, nuanced analysis that helps the dreamer understand their psyche's message.
Be empathetic, insightful, and avoid overly clinical language. Speak as a wise guide.

Dream to analyze:
`;

export class GeminiService {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async analyzeDream(request: DreamAnalysisRequest): Promise<DreamAnalysisResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not set. Please configure your API key.');
    }

    try {
      const prompt = `${JUNG_PROMPT}\n\n"${request.dreamContent}"\n\nPlease provide your analysis in the following JSON format:
      {
        "analysis": "Main interpretation and meaning",
        "jungianInterpretation": "Specific Jungian psychological insights",
        "symbols": ["key", "symbols", "identified"],
        "archetypes": ["archetypes", "present"],
        "emotions": ["underlying", "emotions"],
        "suggestions": ["practical", "suggestions", "for", "integration"]
      }`;

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.candidates[0].content.parts[0].text;
      
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        return analysisData;
      } else {
        // Fallback if JSON extraction fails
        return {
          analysis: analysisText,
          jungianInterpretation: "This dream appears to contain archetypal elements that warrant deeper exploration through the lens of analytical psychology.",
          symbols: ["Unknown symbols require further analysis"],
          archetypes: ["Universal patterns to be explored"],
          emotions: ["Complex emotional undercurrents"],
          suggestions: ["Reflect on the dream's personal significance", "Consider journaling about recurring themes"]
        };
      }
    } catch (error) {
      console.error('Error analyzing dream:', error);
      throw new Error('Failed to analyze dream. Please check your API key and try again.');
    }
  }
}

export const geminiService = new GeminiService();