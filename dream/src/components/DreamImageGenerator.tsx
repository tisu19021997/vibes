import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Palette, Sparkles, Save, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { CARD_THEMES, CardTheme, TarotCard, DreamAnalysisResponse, Dream } from '@/types/dream';
import { format } from 'date-fns';
import { geminiService } from '@/services/geminiService';
import { fluxService } from '@/services/fluxService';
import { toast } from '@/hooks/use-toast';


interface TarotCardGeneratorProps {
  dreamAnalysis: DreamAnalysisResponse;
  dreamContent: string;
  onCardGenerated: (card: TarotCard) => void;
  onSaveDream: (dream: Dream) => Promise<void>;
  apiKeys?: {
    gemini?: string;
    flux?: string;
  };
}

export const DreamImageGenerator: React.FC<TarotCardGeneratorProps> = ({ 
  dreamAnalysis,
  dreamContent,
  onCardGenerated,
  onSaveDream,
  apiKeys 
}) => {
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(CARD_THEMES[0]);
  const [cardTitle, setCardTitle] = useState('');
  const [cardSubtitle, setCardSubtitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingNames, setIsGeneratingNames] = useState(false);
  const [previewCard, setPreviewCard] = useState<TarotCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const generateNameSuggestions = useCallback(async () => {
    if (!dreamAnalysis) return;
    
    setIsGeneratingNames(true);
    try {
      // Use the tarot card suggestions from the analysis if available
      if (dreamAnalysis.tarotCard) {
        setCardTitle(dreamAnalysis.tarotCard.title);
        setCardSubtitle(dreamAnalysis.tarotCard.subtitle);
        
        toast({
          title: "Dream details added",
          description: "We've filled in some lovely details for your dream.",
        });
      } else {
        // Fallback to default names if tarot card suggestions not available
        setCardTitle('My Dream');
        setCardSubtitle('A Beautiful Memory');
        
        toast({
          title: "Details added",
          description: "We've added some details. You can change them below.",
        });
      }
    } catch (error) {
      console.error('Error generating name suggestions:', error);
              toast({
          title: "Details added",
          description: "We've added some simple details. You can change them.",
          variant: "destructive",
        });
      setCardTitle('My Dream');
      setCardSubtitle('A Beautiful Memory');
    } finally {
      setIsGeneratingNames(false);
    }
  }, [dreamAnalysis]);

  // Only auto-generate names if we don't have them yet
  useEffect(() => {
    if (!cardTitle && !cardSubtitle && dreamAnalysis) {
      generateNameSuggestions();
    }
  }, [cardTitle, cardSubtitle, dreamAnalysis, generateNameSuggestions]);

  const generateCardImage = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🎨 Starting FLUX tarot card generation...');
      
      let result: { imageBase64: string; suggestedTitle: string; suggestedSubtitle: string; imageUrl?: string };
      
      // Step 1: Use Gemini to prepare the optimized prompt
      console.log('🎨 Step 1: Preparing optimized prompt with Gemini...');
      const optimizedPrompt = await geminiService.prepareImagePrompt(
        dreamAnalysis,
        selectedTheme.name
      );
      
      // Step 2: Use FLUX to generate the image from the optimized prompt
      console.log('🖼️ Step 2: Generating image with FLUX from optimized prompt...');
      result = await fluxService.generateImageFromPrompt(
        optimizedPrompt,
        dreamAnalysis,
        '2:3'
      );
      
      // Handle image URL - prefer base64, fallback to direct URL
      let imageUrl: string;
      if (result.imageBase64) {
        // Convert base64 to data URL for display
        imageUrl = `data:image/png;base64,${result.imageBase64}`;
      } else {
        throw new Error('No image data received from the service');
      }
      
      const newCard: TarotCard = {
        id: `card-${Date.now()}`,
        imageUrl: imageUrl,
        theme: selectedTheme,
        title: cardTitle || result.suggestedTitle,
        subtitle: cardSubtitle || result.suggestedSubtitle,
        analysis: dreamAnalysis.analysis, // This is the main analysis text
        createdAt: new Date()
      };

      setPreviewCard(newCard);
      onCardGenerated(newCard);
      
      toast({
        title: 'Your FLUX dream image is ready!',
        description: "We've created something beautiful for you to keep.",
      });
      
    } catch (error) {
      console.error('Error generating FLUX card:', error);
      toast({
        title: "Couldn't create image",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      
      // Fallback to mock SVG card if AI generation fails
      await generateFallbackCard();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackCard = async () => {
    console.log('🎨 Generating fallback SVG card...');
    
    // Helper function to safely encode Unicode strings to base64
    const safeBase64Encode = (str: string) => {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
    };
    
    const svgContent = `
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${selectedTheme.primaryColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${selectedTheme.secondaryColor};stop-opacity:1" />
          </linearGradient>
          <linearGradient id="textBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#000000;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#000000;stop-opacity:0.1" />
          </linearGradient>
          <pattern id="texture" patternUnits="userSpaceOnUse" width="40" height="40">
            <rect width="40" height="40" fill="${selectedTheme.accentColor}" opacity="0.08"/>
            <circle cx="20" cy="20" r="1" fill="${selectedTheme.secondaryColor}" opacity="0.2"/>
          </pattern>
          <filter id="textShadow">
            <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.5"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="400" height="600" fill="url(#bg)"/>
        <rect width="400" height="600" fill="url(#texture)"/>
        
        <!-- Enhanced Border -->
        <rect x="10" y="10" width="380" height="580" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="2" rx="12" opacity="0.8"/>
        <rect x="20" y="20" width="360" height="560" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="1" rx="8" opacity="0.6"/>
        
        <!-- Title Area with Background -->
        <rect x="30" y="40" width="340" height="90" fill="url(#textBg)" rx="8"/>
        <rect x="30" y="40" width="340" height="90" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="1" rx="8" opacity="0.4"/>
        
        <!-- Main Title with Shadow -->
        <text x="200" y="75" font-family="${selectedTheme.fontFamily}" font-size="26" fill="#000000" text-anchor="middle" font-weight="700" opacity="0.3">
          ${cardTitle || 'My Dream'}
        </text>
        <text x="200" y="73" font-family="${selectedTheme.fontFamily}" font-size="26" fill="${selectedTheme.accentColor}" text-anchor="middle" font-weight="700">
          ${cardTitle || 'My Dream'}
        </text>
        
        <!-- Subtitle with Shadow -->
        <text x="200" y="105" font-family="${selectedTheme.fontFamily}" font-size="14" fill="#000000" text-anchor="middle" opacity="0.4">
          ${cardSubtitle || format(new Date(), 'MMMM dd, yyyy')}
        </text>
        <text x="200" y="103" font-family="${selectedTheme.fontFamily}" font-size="14" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.9">
          ${cardSubtitle || format(new Date(), 'MMMM dd, yyyy')}
        </text>
        
        <!-- Central Symbol Area with Enhanced Background -->
        <rect x="60" y="150" width="280" height="260" fill="url(#textBg)" rx="12"/>
        <rect x="60" y="150" width="280" height="260" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="1" rx="12" opacity="0.3"/>
        
        <!-- Decorative circles -->
        <circle cx="200" cy="280" r="80" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="2" opacity="0.4"/>
        <circle cx="200" cy="280" r="60" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="1" opacity="0.6"/>
        <circle cx="200" cy="280" r="40" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="1" opacity="0.3"/>
        
        <!-- Central Symbol Enhanced -->
        <text x="200" y="295" font-family="serif" font-size="48" fill="#000000" text-anchor="middle" opacity="0.3">◈</text>
        <text x="200" y="292" font-family="serif" font-size="48" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.9">◈</text>
        
        <!-- Symbols Section Enhanced -->
        <text x="200" y="340" font-family="${selectedTheme.fontFamily}" font-size="12" fill="#000000" text-anchor="middle" opacity="0.4" font-weight="500">
          ${dreamAnalysis.symbols.slice(0, 3).join(' • ')}
        </text>
        <text x="200" y="338" font-family="${selectedTheme.fontFamily}" font-size="12" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.9" font-weight="500">
          ${dreamAnalysis.symbols.slice(0, 3).join(' • ')}
        </text>
        
        <!-- Bottom Analysis Section -->
        <rect x="30" y="430" width="340" height="140" fill="url(#textBg)" rx="8"/>
        <rect x="30" y="430" width="340" height="140" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="1" rx="8" opacity="0.4"/>
        
        <!-- Dream Analysis Label -->
        <text x="200" y="455" font-family="${selectedTheme.fontFamily}" font-size="12" fill="#000000" text-anchor="middle" opacity="0.4" font-weight="600" letter-spacing="2px">
          DREAM ANALYSIS
        </text>
        <text x="200" y="453" font-family="${selectedTheme.fontFamily}" font-size="12" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.9" font-weight="600" letter-spacing="2px">
          DREAM ANALYSIS
        </text>
        
        <!-- Archetypes -->
        <text x="200" y="480" font-family="${selectedTheme.fontFamily}" font-size="11" fill="#000000" text-anchor="middle" opacity="0.4" font-weight="500">
          ${dreamAnalysis.archetypes.slice(0, 2).join(' • ')}
        </text>
        <text x="200" y="478" font-family="${selectedTheme.fontFamily}" font-size="11" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.8" font-weight="500">
          ${dreamAnalysis.archetypes.slice(0, 2).join(' • ')}
        </text>
        
        <!-- Analysis Preview (first few words) -->
        <text x="200" y="510" font-family="${selectedTheme.fontFamily}" font-size="9" fill="#000000" text-anchor="middle" opacity="0.3">
          ${dreamAnalysis.analysis.split(' ').slice(0, 8).join(' ')}...
        </text>
        <text x="200" y="508" font-family="${selectedTheme.fontFamily}" font-size="9" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.7">
          ${dreamAnalysis.analysis.split(' ').slice(0, 8).join(' ')}...
        </text>
        
        <!-- Decorative Elements -->
        <circle cx="80" cy="180" r="2" fill="${selectedTheme.accentColor}" opacity="0.6"/>
        <circle cx="320" cy="180" r="2" fill="${selectedTheme.accentColor}" opacity="0.6"/>
        <circle cx="80" cy="380" r="2" fill="${selectedTheme.accentColor}" opacity="0.6"/>
        <circle cx="320" cy="380" r="2" fill="${selectedTheme.accentColor}" opacity="0.6"/>
        
        <!-- Footer -->
        <text x="200" y="545" font-family="${selectedTheme.fontFamily}" font-size="8" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.6" letter-spacing="1px">
          THE SILENT CHRONICLE
        </text>
      </svg>
    `;

    const mockImageUrl = `data:image/svg+xml;base64,${safeBase64Encode(svgContent)}`;

    const newCard: TarotCard = {
      id: `card-${Date.now()}`,
      imageUrl: mockImageUrl,
      theme: selectedTheme,
      title: cardTitle || 'My Dream',
      subtitle: cardSubtitle || format(new Date(), 'MMMM dd, yyyy'),
      analysis: dreamAnalysis.analysis, // This is the main analysis text
      createdAt: new Date()
    };

    setPreviewCard(newCard);
    onCardGenerated(newCard);
    
    toast({
      title: "Dream image created",
      description: "We've made a beautiful image with your dream details.",
    });
  };

  const downloadCard = async () => {
    if (!previewCard) return;
    
    try {
      const fileName = `dream-card-${previewCard.title.toLowerCase().replace(/\s+/g, '-')}`;
      const imageUrl = previewCard.imageUrl;
      
      // Check if the image is already a base64 PNG (from AI generation)
      if (imageUrl.startsWith('data:image/png;base64,')) {
        console.log('Downloading AI-generated PNG image...');
        
        // Direct download of base64 PNG
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${fileName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download complete",
          description: "Your dream card has been saved as PNG.",
        });
        return;
      }
      
      // Handle SVG images (fallback cards) - convert to PNG
      if (imageUrl.startsWith('data:image/svg+xml')) {
        console.log('Converting SVG to PNG for download...');
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not create canvas context');
        }
        
        const img = new Image();
        canvas.width = 400;
        canvas.height = 600;
        
        // Set up success handler
        img.onload = () => {
          try {
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to blob and download
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${fileName}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                toast({
                  title: "Download complete",
                  description: "Your dream card has been saved as PNG.",
                });
              } else {
                throw new Error('Failed to create image blob');
              }
            }, 'image/png', 1.0);
          } catch (canvasError) {
            console.error('Canvas conversion failed:', canvasError);
            throw canvasError;
          }
        };
        
        // Set up error handler
        img.onerror = (imgError) => {
          console.error('Image load error:', imgError);
          throw new Error('Failed to load image for conversion');
        };
        
        // Set CORS to anonymous to handle data URLs properly
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        return;
      }
      
      // Fallback for any other image type
      console.log('Downloading image directly...');
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download complete",
        description: "Your dream card has been downloaded.",
      });
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Final fallback: try to download the original image as-is
      try {
        console.log('Attempting final fallback download...');
        const link = document.createElement('a');
        link.href = previewCard.imageUrl;
        link.download = `dream-card-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download complete (fallback)",
          description: "Image downloaded successfully.",
        });
      } catch (fallbackError) {
        console.error('Final fallback also failed:', fallbackError);
        toast({
          title: "Download failed",
          description: "Could not download the image. Please try right-clicking and saving the image manually.",
          variant: "destructive"
        });
      }
    }
  };

  const saveDreamToStorage = async () => {
    if (!previewCard || !dreamContent) return;
    
    setIsSaving(true);
    
    try {
      const dreamToSave: Dream = {
        id: `dream-${Date.now()}`,
        content: dreamContent,
        analysis: dreamAnalysis,
        tarotCard: previewCard,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await onSaveDream(dreamToSave);
      
      toast({
        title: "Dream saved!",
        description: "Your dream and image have been saved to your collection.",
      });
      
    } catch (error) {
      console.error('Failed to save dream:', error);
      toast({
        title: "Save failed",
        description: "Could not save your dream. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light">Create Your Dream Image</h2>
        <p className="text-muted-foreground">
          Turn your dream into a beautiful image you can print and keep
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customization Panel */}
        <Card className="dream-card">
          <div className="space-y-6">
            {/* AI Generator selection removed; always using FLUX */}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Theme
              </Label>
              <Select
                value={selectedTheme.id}
                onValueChange={(value) => {
                  const theme = CARD_THEMES.find(t => t.id === value) || CARD_THEMES[0];
                  setSelectedTheme(theme);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_THEMES.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        {theme.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Card Title</Label>
              </div>
              <Input
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder="My Dream"
                className="bg-background/50 border-border/50"
                disabled={isGeneratingNames}
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={cardSubtitle}
                onChange={(e) => setCardSubtitle(e.target.value)}
                placeholder={format(new Date(), 'MMMM dd, yyyy')}
                className="bg-background/50 border-border/50"
                disabled={isGeneratingNames}
              />
            </div>

            <Button
              onClick={generateCardImage}
              disabled={
                isGenerating || 
                isGeneratingNames || 
                !cardTitle.trim() || 
                !apiKeys?.gemini ||
                !apiKeys?.flux
              }
              className="mystical-button w-full"
            >
              {isGenerating ? (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="h-4 w-4" />
                  </motion.div>
                  Generating with FLUX...
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Create with FLUX
                </div>
              )}
            </Button>
          </div>
        </Card>

        {/* Card Preview */}
        <Card className="dream-card">
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Preview
            </Label>
            
            {previewCard ? (
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="relative max-w-sm mx-auto"
                >
                  <img
                    src={previewCard.imageUrl}
                    alt={previewCard.title}
                    className="w-full h-full object-cover rounded-lg shadow-dream"
                  />
                </motion.div>
                
                <div className="space-y-3">
                  {/* Save Button - Primary Action */}
                  <Button
                    onClick={saveDreamToStorage}
                    disabled={isSaving}
                    className="mystical-button w-full"
                  >
                    {isSaving ? (
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Save className="h-4 w-4" />
                        </motion.div>
                        Saving dream...
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Dream to Collection
                      </div>
                    )}
                  </Button>
                  
                  {/* Secondary Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={downloadCard}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PNG
                    </Button>
                    <Button
                      onClick={() => {
                        // Future: Print to home functionality
                        alert('Print at home feature coming soon!');
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Print at Home
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-[2/3] max-w-sm mx-auto bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Zap className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Create your image to see it here
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
