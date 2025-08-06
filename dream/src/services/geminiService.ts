import { DreamAnalysisRequest, DreamAnalysisResponse, CardNameSuggestion } from '@/types/dream';
import { GoogleGenAI } from '@google/genai';

const JUNG_PROMPT = `
You are an intuitive dream guide with deep knowledge of Carl Jung's analytical psychology. Analyze this dream as a compassionate mentor would, revealing the psyche's hidden wisdom.

**YOUR ANALYSIS APPROACH:**

**1. MAIN INTERPRETATION (analysis field)**
- Write 2-3 paragraphs in warm, accessible language
- Focus on the dream's core message and meaning for the dreamer
- Avoid clinical jargon; speak as a wise friend would
- Connect symbols to the dreamer's potential life situation
- End with an empowering insight about growth or understanding
- Use line breaks between paragraphs to make the text more readable
- Never use markdown, only plain text and bullet points

**2. JUNGIAN INSIGHTS (jungianInterpretation field)**
Explore these specific elements:
- **Shadow Work**: What rejected aspects of self appear? How can they be integrated?
- **Archetypes**: Which universal patterns emerge (Mother, Father, Wise Old Man/Woman, Trickster, Hero)?
- **Anima/Animus**: How do masculine/feminine energies manifest?
- **Compensation**: What conscious attitudes might this dream be balancing?
- **Individuation**: How does this dream support the journey toward wholeness?

Write 2-3 paragraphs weaving these concepts naturally into practical insights.

**3. SYMBOLS IDENTIFICATION (symbols array)**
List 4-8 key dream symbols as single words or short phrases:
- Focus on the most emotionally charged or prominent elements
- Include both obvious symbols (animals, objects) and subtle ones (colors, actions)
- Examples: "Water", "Flying", "Dark Forest", "Golden Key", "Childhood Home"

**4. ARCHETYPES (archetypes array)**
Identify 2-5 archetypal energies present:
- Use accessible names: "The Wise Guide", "The Inner Child", "The Shadow", "The Protector"
- Focus on archetypes that clearly manifest in the dream's characters or themes
- Include both positive and challenging archetypal energies

**5. EMOTIONS (emotions array)**
Capture 3-6 core emotional undercurrents:
- Include both felt emotions (fear, joy) and hidden ones (longing, anger)
- Use evocative single words: "Yearning", "Liberation", "Anxiety", "Wonder", "Grief", "Hope"
- Focus on emotions that drive the dream's meaning

**6. INTEGRATION SUGGESTIONS (suggestions array)**
Provide 3-5 practical, actionable suggestions:
- Begin each with an action verb: "Reflect on...", "Journal about...", "Notice when..."
- Make suggestions specific and achievable
- Connect directly to the dream's themes and symbols
- Balance inner work with outer world applications

**7. TAROT CARD CREATION (tarotCard object)**
Design a mystical tarot card that captures the dream's essence:

**Title Requirements:**
- 2-4 evocative words maximum
- Use poetic, mystical language
- Capture the dream's primary archetype or theme
- Examples: "The Dreaming Waters", "Shadow's Gift", "The Inner Compass"

**Subtitle Requirements:**
- One compelling phrase describing the card's wisdom
- 4-8 words that feel like ancient wisdom
- Connect to the dreamer's growth journey
- Examples: "Embracing the depths within", "When darkness becomes teacher", "Following intuition's true north"

**TONE AND STYLE:**
- Write with warmth and wisdom, not clinical detachment
- Use "you" to speak directly to the dreamer
- Include metaphorical language that resonates emotionally
- Balance psychological insight with spiritual wisdom
- Avoid overwhelming jargon; make Jung accessible

**OUTPUT FORMAT:**
Return properly formatted JSON with all required fields. Ensure arrays contain strings, and the tarotCard object has both title and subtitle fields.

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

    if (!this.genAI) {
      console.error('❌ API key not set');
      throw new Error('Gemini API key not set. Please configure your API key.');
    }

    try {
      const prompt = `${JUNG_PROMPT}\n\n"${request.dreamContent}"`;
      console.log('📝 Prepared prompt length:', prompt.length);

      const config = {
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
      };

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      console.log('🚀 Making API request to Gemini using SDK...');
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        config,
        contents,
      });

      console.log('✅ Received response from API');
      console.log('Response structure:', {
        candidates: response.candidates?.length || 0,
        hasContent: !!response.candidates?.[0]?.content,
        hasParts: !!response.candidates?.[0]?.content?.parts,
        partsCount: response.candidates?.[0]?.content?.parts?.length || 0
      });

      if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('Invalid response structure from Gemini API');
      }

      const analysisText = response.candidates[0].content.parts[0].text;
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

  async generateVisualConcept(analysis: string, jungianInterpretation: string, symbols: string[], archetypes: string[], emotions: string[], tarotCard: { title: string; subtitle: string }, theme: string): Promise<string> {
    console.log('🎨 Generating visual concept for tarot card...');
    
    if (!this.genAI) {
      throw new Error('Gemini API key not configured for visual concept generation');
    }

    const conceptPrompt = `You are an expert visual concept artist specializing in mystical tarot card design. Transform the provided dream analysis into a comprehensive visual concept for a tarot card.

**Input:**
- Dream Analysis: ${analysis}
- Jungian Interpretation: ${jungianInterpretation}
- Symbols: ${symbols.join(', ')}
- Archetypes: ${archetypes.join(', ')}
- Emotions: ${emotions.join(', ')}
- Visual Theme: ${theme}
- Card Title: ${tarotCard.title}
- Card Subtitle: ${tarotCard.subtitle}

**Requirements:**
Create an illustrated tarot card (2:3 portrait ratio) with:

1. **Central Figure**: Main archetypal character or symbol representing the dream's core meaning
2. **Key Symbols**: Integrate 3-4 dream symbols naturally into the composition
3. **Traditional Elements**: Ornate decorative border, mystical background elements
4. **Theme Adaptation**: 
   - Minimal theme: Clean lines, simple palette, elegant restraint
   - Colorful theme: Vibrant colors, rich details, dynamic composition
   - Other themes: Interpret creatively while keeping mystical essence

5. **Illustration Style**: Hand-drawn/painted aesthetic (no photography), suitable for the chosen theme

**Output Format:**
1. **Main Image** (100-150 words): Central figure and overall composition
2. **Symbol Placement**: How dream symbols are integrated
3. **Color Palette**: 3-5 colors that match the theme and emotions
4. **Border Design**: Decorative frame style
5. **Artistic Style**: Illustration technique (watercolor, pen & ink, digital painting, etc.)

Keep it mystical, symbolic, and true to traditional tarot card aesthetics.`;

    try {
      const config = {
        temperature: 1.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 10000,
        responseMimeType: "text/plain"
      };

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: conceptPrompt,
            },
          ],
        },
      ];

      console.log('🚀 Generating visual concept using SDK...');
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        config,
        contents,
      });

      console.log('✅ Received response from visual concept generation');
      console.log('Response structure:', {
        candidates: response.candidates?.length || 0,
        hasContent: !!response.candidates?.[0]?.content,
        hasParts: !!response.candidates?.[0]?.content?.parts,
        partsCount: response.candidates?.[0]?.content?.parts?.length || 0
      });

      if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('Invalid response structure from Gemini API for visual concept generation');
      }

      const conceptText = response.candidates[0].content.parts[0].text;
      console.log('📄 Visual concept text:', conceptText);
      console.log('✅ Visual concept generated successfully');

      return conceptText;

    } catch (error) {
      console.error('❌ Error generating visual concept:', error);
      throw new Error(`Failed to generate visual concept: ${error.message}`);
    }
  }

  async optimizeImagePrompt(visualConcept: string): Promise<string> {
    console.log('🔧 Optimizing visual concept for image generation...');
    
    if (!this.genAI) {
      throw new Error('Gemini API key not configured for prompt optimization');
    }

    const optimizerPrompt = `You are a master art director and prompt engineer, an expert in translating conceptual narratives into sophisticated prompts for Google's Imagen3. Your specialty is generating breathtaking, print-quality artistic illustrations and paintings. Your task is to transform the provided visual concept into a single, highly-detailed, and evocative prompt.

**Input:** ${visualConcept}

**--- CORE PRINCIPLES FOR PROMPT GENERATION ---**

**1. PHILOSOPHY: PAINTING, NOT PHOTOGRAPHY**
Your entire vocabulary must be that of a master painter and illustrator. Avoid any photographic, cinematic, or digital art terminology (e.g., no "photorealistic," "4K," "octane render," "lens flare"). Focus exclusively on the language of physical art media, emphasizing texture, brushwork, and traditional pigments.

**2. THE UNBREAKABLE RULE: ZERO TEXT**
The final image must be PURELY visual. Under no circumstances should the prompt include or allude to:
- Letters, words, numbers, sentences, or typography of any kind.
- Text on banners, scrolls, signs, or books.
- Any form of written language or symbolic characters that resemble letters.
This is a non-negotiable directive. The output is a fine art image, not a poster.

**3. STRUCTURE: A NARRATIVE FLOW**
Construct the prompt as a single, flowing paragraph (under 280 words). Follow this logical progression for maximum clarity and impact:
**Artistic Style -> Central Subject -> Environment & Lighting -> Color Palette -> Symbolic Details -> Final Composition & Print Specifications.**

**--- PALETTE OF ARTISTIC STYLES (CHOOSE ONE & BE SPECIFIC) ---**

Your prompt must be anchored in a specific, well-defined artistic style. Refer to specific movements or artists.

* **Classical & Renaissance:** "In the style of a High Renaissance oil painting," "with the dramatic chiaroscuro of Caravaggio," "sfumato haze reminiscent of Leonardo da Vinci."
* **Symbolism & Visionary Art:** "A visionary symbolist painting in the style of Odilon Redon," "ornamental detail and flattened perspective like a Gustav Klimt masterpiece," "mystical ink illustration with the intricate linework of Aubrey Beardsley."
* **Art Nouveau & Golden Age Illustration:** "An elegant Art Nouveau illustration in the style of Alphonse Mucha," "a whimsical watercolor and ink illustration reminiscent of Arthur Rackham," "a fairy tale painting with the luminous quality of Edmund Dulac."
* **Surrealism:** "A dreamlike surrealist oil painting like Remedios Varo," "an allegorical scene with the uncanny precision of Salvador Dalí."
* **Pre-Raphaelite Brotherhood:** "A Pre-Raphaelite painting with jewel-toned colors and meticulous detail, in the style of John Everett Millais."
* **Folk & Mystical Traditions:** "Style of a medieval illuminated manuscript with gold leaf," "a Byzantine icon painted with egg tempera on a wood panel," "vibrant traditional folk art painting."

**--- TECHNICAL DIRECTIVES FOR PRINTABLE CARDS ---**

Incorporate these specifications at the end of the prompt to ensure a high-quality, usable final asset.

* **Format:** "A full-bleed, portrait-oriented illustration with a 2:3 aspect ratio."
* **Quality:** "Museum-quality fine art with sharp, crisp details and rich, saturated colors suitable for 300 DPI print reproduction."
* **Composition:** "A balanced composition with a clear focal point, designed for clarity at a standard playing card size."
* **Finish:** "The final image should have the texture and depth of a physical painting, with visible brushwork or linework."

**--- FINAL OUTPUT INSTRUCTIONS ---**

Synthesize the visual concept into a single, comprehensive paragraph (under 280 words) adhering to all rules above. The prompt should be a vivid description that guides Imagen3 to create a work of art.

**Example Structure:**
"An elegant Art Nouveau illustration in the style of Alphonse Mucha, depicting [central figure description]. The figure is set against a [background description] illuminated by [lighting description, e.g., soft, ethereal light]. The color palette is dominated by [3-4 specific pigment colors, e.g., deep ochre, muted lavender, and burnished gold], creating a mood of [emotional tone]. Symbolic elements, such as [symbol 1] and [symbol 2], are woven into the decorative, flowing lines of the composition. This is a full-bleed, portrait-oriented illustration with a 2:3 aspect ratio, rendered as a museum-quality fine art piece with sharp details suitable for 300 DPI print reproduction, capturing the texture of ink and watercolor on paper."`;

    try {
      const config = {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 10000,
        responseMimeType: "text/plain"
      };

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: optimizerPrompt,
            },
          ],
        },
      ];

      console.log('🚀 Optimizing image prompt using SDK...');
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        config,
        contents,
      });

      console.log('✅ Received response from prompt optimization');
      console.log('Response structure:', {
        candidates: response.candidates?.length || 0,
        hasContent: !!response.candidates?.[0]?.content,
        hasParts: !!response.candidates?.[0]?.content?.parts,
        partsCount: response.candidates?.[0]?.content?.parts?.length || 0
      });

      if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('Invalid response structure from Gemini API for prompt optimization');
      }

      const optimizedPrompt = response.candidates[0].content.parts[0].text;
      
      console.log('✅ Image prompt optimized successfully');
      return optimizedPrompt;

    } catch (error) {
      console.error('❌ Error optimizing image prompt:', error);
      throw new Error(`Failed to optimize image prompt: ${error.message}`);
    }
  }

  async generateDreamImage(dreamAnalysis: DreamAnalysisResponse, theme: string): Promise<{ imageBase64: string; suggestedTitle: string; suggestedSubtitle: string }> {
    console.log('🎨 Starting optimized two-stage tarot card generation...');
    
    if (!this.genAI) {
      throw new Error('Gemini API key not configured for image generation');
    }

    try {
      // Stage 1: Generate detailed visual concept
      console.log('🎨 Stage 1: Generating visual concept...');
      const visualConcept = await this.generateVisualConcept(
        dreamAnalysis.analysis,
        dreamAnalysis.jungianInterpretation,
        dreamAnalysis.symbols,
        dreamAnalysis.archetypes,
        dreamAnalysis.emotions,
        dreamAnalysis.tarotCard,
        theme
      );

      // Stage 2: Optimize the visual concept into API-ready prompt
      console.log('🔧 Stage 2: Optimizing image generation prompt...');
      const optimizedPrompt = await this.optimizeImagePrompt(visualConcept);

      console.log('📝 Final optimized prompt for image generation:', optimizedPrompt);

      // Stage 3: Generate the actual image using SDK
      console.log('🖼️ Stage 3: Generating final tarot card image...');
      
      const config = {
        responseModalities: ['IMAGE', 'TEXT'],
      };
      
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: optimizedPrompt,
            },
          ],
        },
      ];

      const response = await this.genAI.models.generateContentStream({
        model: 'gemini-2.0-flash-preview-image-generation',
        config,
        contents,
      });

      console.log('✅ Received streaming response from image generation API');

      let imageBase64 = '';
      let suggestedTitle = dreamAnalysis.tarotCard.title || 'Dream Vision';
      let suggestedSubtitle = dreamAnalysis.tarotCard.subtitle || 'A Journey Through the Unconscious';

      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          continue;
        }
        
        for (const part of chunk.candidates[0].content.parts) {
          if (part.inlineData) {
            imageBase64 = part.inlineData.data || '';
            console.log('🖼️ Generated image data received, size:', imageBase64.length);
          } else if (part.text) {
            console.log('📄 AI response text:', part.text);
          }
        }
      }

      if (!imageBase64) {
        throw new Error('No image data received from Gemini');
      }

      console.log('✅ Optimized tarot card generation completed successfully');
      console.log('Using title from analysis:', suggestedTitle);
      console.log('Using subtitle from analysis:', suggestedSubtitle);

      return {
        imageBase64,
        suggestedTitle,
        suggestedSubtitle
      };

    } catch (error) {
      console.error('❌ Error in optimized tarot card generation:', error);
      throw new Error(`Failed to generate optimized tarot card: ${error.message}`);
    }
  }
}

export const geminiService = new GeminiService();
