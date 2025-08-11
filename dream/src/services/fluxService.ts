import { DreamAnalysisResponse } from '@/types/dream';

export type FluxGenerationPhase = 'request' | 'polling' | 'downloading' | 'complete' | 'error';
export interface FluxGenerationProgress {
  phase: FluxGenerationPhase;
  message: string;
  percent?: number;
}

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
  details?: unknown | null;
  preview?: unknown | null;
}

export class FluxService {
  private apiKey: string | null = null;
  // Always route through our same-origin proxy to avoid CORS in production
  private baseUrl = '/api/flux';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private ensureConfiguredFromEnv() {
    if (!this.apiKey) {
      const envKey = import.meta.env.VITE_FLUX_API_KEY as string | undefined;
      if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
        this.setApiKey(envKey.trim());
      }
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    this.ensureConfiguredFromEnv();
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
    aspectRatio: string = '2:3',
    onProgress?: (update: FluxGenerationProgress) => void
  ): Promise<{ imageBase64: string; suggestedTitle: string; suggestedSubtitle: string; imageUrl?: string }> {
    console.log('🎨 Starting FLUX dream image generation...');
    
    this.ensureConfiguredFromEnv();
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
      onProgress?.({ phase: 'request', message: 'Calling the canvas to life…', percent: 10 });
      const generateResponse = await this.makeRequest<FluxGenerateResponse>('/flux-kontext-pro', {
        method: 'POST',
        body: JSON.stringify(generateRequest),
      });

      console.log('✅ FLUX generation request sent, task ID:', generateResponse.id);

      // Step 2: Poll for the result
      onProgress?.({ phase: 'polling', message: 'The vision is taking shape…', percent: 12 });
      const result = await this.pollForResult(generateResponse.id, 30, 5000, onProgress);

      console.log('✅ FLUX image generation completed successfully');

      return {
        imageBase64: result.imageBase64,
        imageUrl: result.imageUrl, // Fallback URL if base64 conversion failed
        suggestedTitle: dreamAnalysis.tarotCard?.title || 'Dream Vision',
        suggestedSubtitle: dreamAnalysis.tarotCard?.subtitle || 'A Journey Through the Unconscious'
      };

    } catch (error) {
      console.error('❌ Error in FLUX image generation:', error);
      onProgress?.({ phase: 'error', message: 'The vision faltered before forming.', percent: 0 });
      throw new Error(`Failed to generate FLUX image: ${error.message}`);
    }
  }

  async generateImageFromPrompt(
    optimizedPrompt: string,
    dreamAnalysis: DreamAnalysisResponse,
    aspectRatio: string = '2:3',
    onProgress?: (update: FluxGenerationProgress) => void
  ): Promise<{ imageBase64: string; suggestedTitle: string; suggestedSubtitle: string; imageUrl?: string }> {
    console.log('🎨 Starting FLUX image generation from optimized prompt...');
    
    this.ensureConfiguredFromEnv();
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
      onProgress?.({ phase: 'request', message: 'Calling the canvas to life…', percent: 10 });
      const generateResponse = await this.makeRequest<FluxGenerateResponse>('/flux-kontext-pro', {
        method: 'POST',
        body: JSON.stringify(generateRequest),
      });

      console.log('✅ FLUX generation request sent, task ID:', generateResponse.id);

      // Step 2: Poll for the result
      onProgress?.({ phase: 'polling', message: 'The vision is taking shape…', percent: 12 });
      const result = await this.pollForResult(generateResponse.id, 30, 5000, onProgress);

      console.log('✅ FLUX image generation completed successfully');

      return {
        imageBase64: result.imageBase64,
        imageUrl: result.imageUrl, // Fallback URL if base64 conversion failed
        suggestedTitle: dreamAnalysis.tarotCard?.title || 'Dream Vision',
        suggestedSubtitle: dreamAnalysis.tarotCard?.subtitle || 'A Journey Through the Unconscious'
      };

    } catch (error) {
      console.error('❌ Error in FLUX image generation from prompt:', error);
      onProgress?.({ phase: 'error', message: 'The vision faltered before forming.', percent: 0 });
      throw new Error(`Failed to generate FLUX image from prompt: ${error.message}`);
    }
  }

  private async pollForResult(
    taskId: string,
    maxAttempts: number = 30,
    delayMs: number = 5000,
    onProgress?: (update: FluxGenerationProgress) => void
  ): Promise<{ imageBase64: string; imageUrl?: string }> {
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
              onProgress?.({ phase: 'downloading', message: 'Drawing the final veil…', percent: 85 });
              
              // Download and convert to base64 via server proxy only
              const imageBase64 = await this.downloadImageAsBase64(result.result.sample);
              onProgress?.({ phase: 'complete', message: 'Your vision has arrived.', percent: 90 });
              return { imageBase64 };
            } else {
              throw new Error('Image generation completed but no image data received');
            }

          case 'Pending':
            console.log(`⏳ Still processing... Progress: ${result.progress || 0}%`);
            {
              const reported = typeof result.progress === 'number' ? Math.max(15, Math.min(80, result.progress)) : undefined;
              // If progress is unknown, estimate based on attempts
              const estimated = Math.min(80, Math.max(15, Math.round((attempt / maxAttempts) * 65) + 15));
              const percent = reported ?? estimated;
              onProgress?.({ phase: 'polling', message: 'The vision is taking shape…', percent });
            }
            break;

          case 'Error':
            console.error('❌ FLUX generation failed with error status');
            onProgress?.({ phase: 'error', message: 'The vision faltered before forming.', percent: 0 });
            throw new Error(`Image generation failed: ${JSON.stringify(result.details)}`);

          case 'Request Moderated':
          case 'Content Moderated':
            console.error('❌ Content was moderated by FLUX');
            onProgress?.({ phase: 'error', message: 'The path was barred by the wards.', percent: 0 });
            throw new Error('Image generation was blocked due to content policy');

          case 'Task not found':
            console.error('❌ Task not found');
            onProgress?.({ phase: 'error', message: 'The thread of this vision was lost.', percent: 0 });
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
    console.log('📥 Downloading image through server proxy...');
    console.log('🔗 FLUX temporary URL:', imageUrl);

    // Always use our server-side proxy to avoid CORS and expiring links
    try {
      const proxyEndpoint = `/api/flux-image?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'image/png,image/jpeg,image/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Proxy responded with ${response.status} ${response.statusText}`);
      }

      console.log('✅ Proxy fetch successful');
      return response;
    } catch (error) {
      console.error('❌ Proxy fetch failed:', error);
      throw new Error('Unable to download image through proxy.');
    }
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
