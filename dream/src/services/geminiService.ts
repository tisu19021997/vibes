import { DreamAnalysisRequest, DreamAnalysisResponse, CardNameSuggestion } from '@/types/dream';
import { GoogleGenAI, Modality } from '@google/genai';

const GEMINI_API_KEY = 'your-gemini-api-key-here'; // This will be set by user
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const JUNG_PROMPT = `
You are a wise dream analyst deeply versed in Carl Jung's analytical psychology and dream interpretation theories. 
Analyze the following dream through a Jungian lens, considering:

1. **Collective Unconscious**: Identify archetypal symbols and universal patterns
2. **Personal Unconscious**: Look for repressed emotions, memories, and unresolved conflicts
3. **Shadow Integration**: Explore shadow elements and what they might represent
4. **Anima/Animus**: Identify feminine/masculine archetypes and their significance
5. **Individuation Process**: How this dream might relate to the dreamer's journey toward wholeness
6. **Compensation Theory**: What conscious attitudes might this dream be compensating for

Additionally, based on your analysis, create mystical tarot card title and subtitle suggestions that capture the essence of the dream's meaning.

Provide a thoughtful, nuanced analysis that helps the dreamer understand their psyche's message.
Be empathetic, insightful, and avoid overly clinical language. Speak as a wise guide.

Dream to analyze:
`;

export class GeminiService {
  private apiKey: string | null = null;
  private genAI: GoogleGenAI | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
    this.genAI = new GoogleGenAI({ apiKey: key });
  }

  async analyzeDream(request: DreamAnalysisRequest): Promise<DreamAnalysisResponse> {
    console.log('🔮 Starting dream analysis...');
    console.log('Dream content length:', request.dreamContent.length);
    console.log('API key configured:', this.apiKey ? 'Yes (***...)' : 'No');

    if (!this.apiKey) {
      console.error('❌ API key not set');
      throw new Error('Gemini API key not set. Please configure your API key.');
    }

    try {
      const prompt = `${JUNG_PROMPT}\n\n"${request.dreamContent}"`;
      console.log('📝 Prepared prompt length:', prompt.length);

      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 1.5,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              analysis: {
                type: "string",
                description: "Main interpretation and meaning"
              },
              jungianInterpretation: {
                type: "string",
                description: "Specific Jungian psychological insights"
              },
              symbols: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Key symbols identified"
              },
              archetypes: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Archetypes present"
              },
              emotions: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Underlying emotions"
              },
              suggestions: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Practical suggestions for integration"
              },
              tarotCard: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Mystical tarot card title (2-4 words, evocative)"
                  },
                  subtitle: {
                    type: "string",
                    description: "Meaningful subtitle describing the card's essence"
                  }
                },
                required: ["title", "subtitle"],
                description: "Tarot card name suggestions based on dream analysis"
              }
            },
            required: ["analysis", "jungianInterpretation", "symbols", "archetypes", "emotions", "suggestions", "tarotCard"]
          }
        }
      };

      console.log('🚀 Making API request to Gemini...');
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Gemini API error (${response.status}): ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Received response from API');
      console.log('Response structure:', {
        candidates: data.candidates?.length || 0,
        hasContent: !!data.candidates?.[0]?.content,
        hasParts: !!data.candidates?.[0]?.content?.parts,
        partsCount: data.candidates?.[0]?.content?.parts?.length || 0
      });

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response structure from Gemini API');
      }

      const analysisText = data.candidates[0].content.parts[0].text;
      console.log('📄 Raw analysis text length:', analysisText.length);
      console.log('📄 Raw analysis text preview:', analysisText.substring(0, 200) + '...');

      try {
        // Clean the text if it has markdown code block markers
        let cleanText = analysisText;
        if (cleanText.startsWith('```json\n')) {
          cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (cleanText.startsWith('```\n')) {
          cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        console.log('🧹 Cleaned text for parsing:', cleanText.substring(0, 200) + '...');
        
        const parsedResult = JSON.parse(cleanText);
        console.log('✅ Successfully parsed JSON response');
        console.log('Parsed keys:', Object.keys(parsedResult));

        return parsedResult;
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Problematic text:', analysisText);
        
        // Try to extract JSON from the text if it's embedded
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            console.log('🔧 Attempting to extract JSON from text...');
            const extractedJson = JSON.parse(jsonMatch[0]);
            console.log('✅ Successfully extracted and parsed JSON');
            return extractedJson;
          } catch (extractError) {
            console.error('❌ Failed to extract JSON:', extractError);
          }
        }
        
        throw new Error(`Failed to parse API response as JSON: ${parseError.message}. Response: ${analysisText.substring(0, 500)}...`);
      }
    } catch (error) {
      console.error('❌ Error analyzing dream:', error);
      if (error.message.includes('API key')) {
        throw new Error('Invalid API key. Please check your Gemini API key and try again.');
      }
      if (error.message.includes('JSON')) {
        throw error; // Re-throw JSON parsing errors with more context
      }
      throw new Error('Failed to analyze dream. Please try again or check your internet connection.');
    }
  }

  async generateDreamImage(analysis: string, symbols: string[], archetypes: string[], theme: string): Promise<{ imageBase64: string; suggestedTitle: string; suggestedSubtitle: string }> {
    console.log('🎨 Starting tarot card image generation...');
    
    if (!this.genAI) {
      throw new Error('Gemini API key not configured for image generation');
    }

    try {
      // Create a detailed prompt for tarot card image generation
      const imagePrompt = `Create a mystical tarot card illustration with these specifications:

STYLE: Traditional tarot card art style, medieval mystical aesthetic, ornate borders, ethereal atmosphere

THEME: ${theme}

DREAM SYMBOLS TO INCLUDE: ${symbols.join(', ')}
JUNGIAN ARCHETYPES: ${archetypes.join(', ')}

LAYOUT REQUIREMENTS:
- Portrait orientation (2:3 ratio)
- Ornate decorative border frame
- Central symbolic imagery related to the dream analysis
- Mystical, otherworldly atmosphere
- Rich colors and intricate details
- Space for title at the top and subtitle at the bottom
- Traditional tarot card composition

ARTISTIC ELEMENTS:
- Incorporate dream symbolism naturally into the composition
- Use archetypal imagery that resonates with the dream analysis
- Create a sense of depth and mystery
- Include celestial elements (stars, moon, cosmic patterns)
- Use traditional tarot color palettes with modern artistic flair

The card should feel both ancient and timeless, capturing the essence of the dream analysis: "${analysis.substring(0, 200)}..."

Make it suitable for a physical tarot card that could be printed and used for reflection.`;

      console.log('📝 Prepared image generation prompt: ', imagePrompt);

      const response = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: imagePrompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      console.log('✅ Received response from image generation API');

      let imageBase64 = '';
      let suggestedTitle = '';
      let suggestedSubtitle = '';

      if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            console.log('📄 AI suggested text:', part.text);
            // Extract suggested title and subtitle from the text response if provided
            const textResponse = part.text;
            if (textResponse.toLowerCase().includes('title') || textResponse.toLowerCase().includes('name')) {
              // Try to extract suggestions from the text
              const lines = textResponse.split('\n');
              for (const line of lines) {
                if (line.toLowerCase().includes('title:') || line.toLowerCase().includes('name:')) {
                  suggestedTitle = line.split(':')[1]?.trim() || '';
                }
                if (line.toLowerCase().includes('subtitle:') || line.toLowerCase().includes('meaning:')) {
                  suggestedSubtitle = line.split(':')[1]?.trim() || '';
                }
              }
            }
          } else if (part.inlineData) {
            imageBase64 = part.inlineData.data;
            console.log('🖼️ Generated image data received, size:', imageBase64.length);
          }
        }
      }

      if (!imageBase64) {
        throw new Error('No image data received from Gemini');
      }

      console.log('✅ Tarot card generation completed successfully');
      console.log('Suggested title:', suggestedTitle);
      console.log('Suggested subtitle:', suggestedSubtitle);

      return {
        imageBase64,
        suggestedTitle: suggestedTitle || 'Dream Vision',
        suggestedSubtitle: suggestedSubtitle || 'A Journey Through the Unconscious'
      };

    } catch (error) {
      console.error('❌ Error generating tarot card image:', error);
      throw new Error(`Failed to generate tarot card image: ${error.message}`);
    }
  }
}

export const geminiService = new GeminiService();
