import { DreamAnalysisResponse } from '@/types/dream';

interface FluxGenerateRequest {
  prompt: string;
  input_image?: string;
  input_image_2?: string;
  input_image_3?: string;
  input_image_4?: string;
  seed?: number;
  aspect_ratio?: string;
  output_format?: 'jpeg' | 'png';
  webhook_url?: string;
  webhook_secret?: string;
  prompt_upsampling?: boolean;
  safety_tolerance?: number;
}

interface FluxGenerateResponse {
  id: string;
  status: string;
}

interface FluxResultResponse {
  id: string;
  status: 'Task not found' | 'Pending' | 'Request Moderated' | 'Content Moderated' | 'Ready' | 'Error';
  result?: {
    sample?: string; // URL to the generated image
    prompt?: string;
    seed?: number;
    start_time?: number;
    end_time?: number;
    duration?: number;
  };
  progress?: number | null;
  details?: any | null;
  preview?: any | null;
}

export class FluxService {
  private apiKey: string | null = null;
  private baseUrl = import.meta.env.DEV ? '/api/flux' : 'https://api.bfl.ai/v1';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('FLUX API key not set. Please configure your API key.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FLUX API request failed (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  private async generateImagePrompt(dreamAnalysis: DreamAnalysisResponse, theme: string): Promise<string> {
    // Create a descriptive prompt based on the dream analysis
    const symbols = dreamAnalysis.symbols.slice(0, 3).join(', ');
    const emotions = dreamAnalysis.emotions.slice(0, 2).join(' and ');
    const mainArchetype = dreamAnalysis.archetypes[0] || 'mysterious figure';
    
    // Extract key themes from the analysis
    const analysisWords = dreamAnalysis.analysis.split(' ').slice(0, 20).join(' ');
    
    const prompt = `A mystical tarot card illustration featuring ${mainArchetype.toLowerCase()}, incorporating ${symbols}. The scene evokes feelings of ${emotions}. ${analysisWords}. The artwork should be in a ${theme.toLowerCase()} style with intricate details, symbolic elements, and a portrait orientation suitable for a tarot card. The image should be artistic and ethereal, with rich colors and mystical atmosphere.`;

    return prompt;
  }

  async generateDreamImage(
    dreamAnalysis: DreamAnalysisResponse, 
    theme: string,
    aspectRatio: string = '2:3'
  ): Promise<{ imageBase64: string; suggestedTitle: string; suggestedSubtitle: string; imageUrl?: string }> {
    console.log('🎨 Starting FLUX dream image generation...');
    
    if (!this.apiKey) {
      throw new Error('FLUX API key not configured');
    }

    try {
      // Generate optimized prompt for FLUX
      const prompt = await this.generateImagePrompt(dreamAnalysis, theme);
      console.log('📝 Generated FLUX prompt:', prompt);

      // Step 1: Create the image generation request
      const generateRequest: FluxGenerateRequest = {
        prompt,
        aspect_ratio: aspectRatio,
        output_format: 'png',
        prompt_upsampling: false,
        safety_tolerance: 2,
      };

      console.log('🚀 Sending FLUX generation request...');
      const generateResponse = await this.makeRequest<FluxGenerateResponse>('/flux-kontext-pro', {
        method: 'POST',
        body: JSON.stringify(generateRequest),
      });

      console.log('✅ FLUX generation request sent, task ID:', generateResponse.id);

      // Step 2: Poll for the result
      const result = await this.pollForResult(generateResponse.id);

      console.log('✅ FLUX image generation completed successfully');

      return {
        imageBase64: result.imageBase64,
        imageUrl: result.imageUrl, // Fallback URL if base64 conversion failed
        suggestedTitle: dreamAnalysis.tarotCard?.title || 'Dream Vision',
        suggestedSubtitle: dreamAnalysis.tarotCard?.subtitle || 'A Journey Through the Unconscious'
      };

    } catch (error) {
      console.error('❌ Error in FLUX image generation:', error);
      throw new Error(`Failed to generate FLUX image: ${error.message}`);
    }
  }

  async generateImageFromPrompt(
    optimizedPrompt: string,
    dreamAnalysis: DreamAnalysisResponse,
    aspectRatio: string = '2:3'
  ): Promise<{ imageBase64: string; suggestedTitle: string; suggestedSubtitle: string; imageUrl?: string }> {
    console.log('🎨 Starting FLUX image generation from optimized prompt...');
    
    if (!this.apiKey) {
      throw new Error('FLUX API key not configured');
    }

    try {
      console.log('📝 Using provided optimized prompt:', optimizedPrompt.substring(0, 200) + '...');

      // Step 1: Create the image generation request
      const generateRequest: FluxGenerateRequest = {
        prompt: optimizedPrompt,
        aspect_ratio: aspectRatio,
        output_format: 'png',
        prompt_upsampling: false,
        safety_tolerance: 2,
      };

      console.log('🚀 Sending FLUX generation request...');
      const generateResponse = await this.makeRequest<FluxGenerateResponse>('/flux-kontext-pro', {
        method: 'POST',
        body: JSON.stringify(generateRequest),
      });

      console.log('✅ FLUX generation request sent, task ID:', generateResponse.id);

      // Step 2: Poll for the result
      const result = await this.pollForResult(generateResponse.id);

      console.log('✅ FLUX image generation completed successfully');

      return {
        imageBase64: result.imageBase64,
        imageUrl: result.imageUrl, // Fallback URL if base64 conversion failed
        suggestedTitle: dreamAnalysis.tarotCard?.title || 'Dream Vision',
        suggestedSubtitle: dreamAnalysis.tarotCard?.subtitle || 'A Journey Through the Unconscious'
      };

    } catch (error) {
      console.error('❌ Error in FLUX image generation from prompt:', error);
      throw new Error(`Failed to generate FLUX image from prompt: ${error.message}`);
    }
  }

  private async pollForResult(taskId: string, maxAttempts: number = 30, delayMs: number = 2000): Promise<{ imageBase64: string; imageUrl?: string }> {
    console.log(`⏳ Starting to poll for FLUX result, task ID: ${taskId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 Polling attempt ${attempt}/${maxAttempts}...`);
        
        const url = `/get_result?id=${encodeURIComponent(taskId)}`;
        const result = await this.makeRequest<FluxResultResponse>(url, {
          method: 'GET',
        });

        console.log(`📊 Poll result:`, { 
          status: result.status, 
          progress: result.progress,
          hasResult: !!result.result 
        });

        switch (result.status) {
          case 'Ready':
            if (result.result?.sample) {
              console.log('✅ FLUX image is ready! Attempting to download...');
              
              try {
                // Try to download and convert to base64
                const imageBase64 = await this.downloadImageAsBase64(result.result.sample);
                return { imageBase64 };
              } catch (downloadError) {
                console.log('⚠️ Base64 conversion failed, using direct URL:', downloadError.message);
                // Fallback: return the direct URL for display
                return { 
                  imageBase64: '', // Empty base64 
                  imageUrl: result.result.sample 
                };
              }
            } else {
              throw new Error('Image generation completed but no image data received');
            }

          case 'Pending':
            console.log(`⏳ Still processing... Progress: ${result.progress || 0}%`);
            break;

          case 'Error':
            console.error('❌ FLUX generation failed with error status');
            throw new Error(`Image generation failed: ${JSON.stringify(result.details)}`);

          case 'Request Moderated':
          case 'Content Moderated':
            console.error('❌ Content was moderated by FLUX');
            throw new Error('Image generation was blocked due to content policy');

          case 'Task not found':
            console.error('❌ Task not found');
            throw new Error('Generation task not found');

          default:
            console.warn('⚠️ Unknown status:', result.status);
            break;
        }

        // Wait before next poll
        if (attempt < maxAttempts) {
          console.log(`⏳ Waiting ${delayMs}ms before next poll...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        
        console.warn(`⚠️ Poll attempt ${attempt} failed:`, error.message);
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw new Error(`Image generation timed out after ${maxAttempts} attempts. Please try again.`);
  }

  private async downloadImage(imageUrl: string): Promise<Response> {
    console.log('📥 Downloading image from FLUX URL...');
    console.log('🔗 Original URL:', imageUrl);
    
    // Try multiple approaches to handle CORS
    
    // Approach 1: Try direct fetch first (sometimes FLUX allows it)
    try {
      console.log('🎯 Attempting direct fetch...');
      const response = await fetch(imageUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'image/png,image/jpeg,image/*',
        },
      });
      
      if (response.ok) {
        console.log('✅ Direct fetch successful');
        return response;
      }
      
      console.log('⚠️ Direct fetch failed:', response.status, response.statusText);
    } catch (error) {
      console.log('⚠️ Direct fetch error:', error.message);
    }
    
    // Approach 2: Use proxy in development
    if (import.meta.env.DEV) {
      try {
        // Properly encode the URL for proxy
        const urlObj = new URL(imageUrl);
        const proxyPath = `/api/flux-images${urlObj.pathname}${urlObj.search}`;
        
        console.log('🔄 Trying proxy URL:', proxyPath);
        
        const response = await fetch(proxyPath, {
          method: 'GET',
          headers: {
            'Accept': 'image/png,image/jpeg,image/*',
          },
        });
        
        if (response.ok) {
          console.log('✅ Proxy fetch successful');
          return response;
        }
        
        console.log('⚠️ Proxy fetch failed:', response.status, response.statusText);
      } catch (error) {
        console.log('⚠️ Proxy fetch error:', error.message);
      }
    }
    
    // If we get here, all methods failed - suggest alternative approaches
    console.log('⚠️ All download methods failed. Falling back to direct image display.');
    
    // Instead of failing completely, let's use the image URL directly
    // This works for display but won't work for base64 conversion
    throw new Error('Unable to download image due to CORS restrictions. The image URL will be used directly for display.');
  }

  private async downloadImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await this.downloadImage(imageUrl);
      
      const arrayBuffer = await response.arrayBuffer();
      const base64String = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      console.log('✅ Image downloaded and converted to base64');
      console.log('📊 Image size:', Math.round(base64String.length / 1024), 'KB');
      
      return base64String;
    } catch (error) {
      console.error('❌ Failed to download image from URL:', error);
      throw new Error(`Failed to download generated image: ${error.message}`);
    }
  }
}

export const fluxService = new FluxService();
