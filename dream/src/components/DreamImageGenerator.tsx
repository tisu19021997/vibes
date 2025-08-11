import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Palette, Sparkles, Save, Zap, Maximize2, X, RefreshCcw, FlipHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { CARD_THEMES, TarotCard, DreamAnalysisResponse, Dream } from '@/types/dream';
import { format } from 'date-fns';
import { geminiService } from '@/services/geminiService';
import { fluxService, type FluxGenerationProgress } from '@/services/fluxService';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TarotFlipCard from '@/components/TarotFlipCard';
import { Progress } from '@/components/ui/progress';
import { sanitizeFileName } from '@/lib/utils';
import { getAnonIds, trackImageGenerated } from '@/services/analytics';


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
  const [isCustomTheme, setIsCustomTheme] = useState<boolean>(false);
  const [themeName, setThemeName] = useState<string>(CARD_THEMES[0] || 'Minimal');
  const [cardTitle, setCardTitle] = useState('');
  const [cardSubtitle, setCardSubtitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingNames, setIsGeneratingNames] = useState(false);
  const [previewCard, setPreviewCard] = useState<TarotCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const generateNameSuggestions = useCallback(async () => {
    if (!dreamAnalysis) return;
    
    setIsGeneratingNames(true);
    try {
      // Use the tarot card suggestions from the analysis if available
      if (dreamAnalysis.tarotCard) {
        setCardTitle(dreamAnalysis.tarotCard.title);
        setCardSubtitle(dreamAnalysis.tarotCard.subtitle);
        
        toast({
          title: "The veil thins...",
          description: "Whispers from the dream have filled the titles below.",
        });
      } else {
        // Fallback to default names if tarot card suggestions not available
        setCardTitle('My Dream');
        setCardSubtitle('A Beautiful Memory');
        
        toast({
          title: "A simple echo",
          description: "We've added some details. You can refine them below.",
        });
      }
    } catch (error) {
      console.error('Error generating name suggestions:', error);
      toast({
          title: "A whisper lost",
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
    setShowProgress(true);
    setProgressPercent(2);
    setProgressMessage('Preparing your vision…');
    
    try {
      console.log('🎨 Starting FLUX tarot card generation...');
      
      let result: { imageBase64: string; suggestedTitle: string; suggestedSubtitle: string; imageUrl?: string };
      
      // Step 1: Use Gemini to prepare the optimized prompt
      console.log('🎨 Step 1: Preparing optimized prompt with Gemini...');
      setProgressMessage('Weaving your dream\'s symbols…');
      setProgressPercent(8);
      const optimizedPrompt = await geminiService.prepareImagePrompt(
        dreamAnalysis,
        themeName
      );
      setProgressMessage('The circle is drawn. Invoking the vision…');
      setProgressPercent(12);
      
      // Step 2: Use FLUX to generate the image from the optimized prompt
      console.log('🖼️ Step 2: Generating image with FLUX from optimized prompt...');
      const onFluxProgress = (update: FluxGenerationProgress) => {
        setProgressMessage(update.message);
        if (typeof update.percent === 'number') {
          setProgressPercent(update.percent);
        }
      };
      result = await fluxService.generateImageFromPrompt(
        optimizedPrompt,
        dreamAnalysis,
        '2:3',
        onFluxProgress
      );
      
      // Step 3: Upload to Cloudinary and get a permanent CDN URL
      console.log('☁️ Step 3: Uploading image to Cloudinary...');
      setProgressMessage('Preserving your vision in the archives…');
      setProgressPercent(92);
      const dataUrl = `data:image/png;base64,${result.imageBase64}`;
      const { userId, sessionId } = getAnonIds();
      const uploadResp = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl,
          folder: 'oneiroi/dreams',
          publicId: `dream_${Date.now()}`,
          context: { userId, sessionId, title: cardTitle || result.suggestedTitle },
          metadata: {
            userId,
            sessionId,
            theme: themeName,
            dream: dreamContent,
            archetypes: dreamAnalysis.archetypes,
          },
        }),
      });
      if (!uploadResp.ok) {
        const text = await uploadResp.text();
        throw new Error(`Cloudinary upload failed: ${text}`);
      }
      const { secureUrl, publicId } = await uploadResp.json();
      const imageUrl = secureUrl as string;
      setProgressPercent(100);
      setProgressMessage('Your vision is ready.');

      // Step 4: Generate backside content (brief + poem)
      setProgressMessage('Composing your card’s reverse…');
      const backside = await geminiService.generateBacksideContent(dreamContent, optimizedPrompt);
      
      const newCard: TarotCard = {
        id: `card-${Date.now()}`,
        imageUrl,
        cdnPublicId: publicId,
        theme: themeName,
        title: cardTitle || result.suggestedTitle,
        subtitle: cardSubtitle || result.suggestedSubtitle,
        analysis: dreamAnalysis.analysis, // This is the main analysis text
        backside,
        createdAt: new Date()
      };

      setPreviewCard(newCard);
      onCardGenerated(newCard);
      
      // Track generation
      trackImageGenerated({ publicId, theme: themeName });

      toast({
        title: 'Your vision awaits!',
        description: "The dream has been given form. Behold the artifact it has become.",
      });
      
    } catch (error) {
      console.error('Error generating FLUX card:', error);
      toast({
        title: "The vision is clouded",
        description: "Something went wrong. You can try again in a moment.",
        variant: "destructive",
      });
      
      // Fallback to mock SVG card if AI generation fails
      await generateFallbackCard();
    } finally {
      setIsGenerating(false);
      // Let the progress linger briefly then hide
      setTimeout(() => {
        setShowProgress(false);
        setProgressMessage('');
        setProgressPercent(0);
      }, 1200);
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
            <stop offset="0%" style="stop-color:#222222;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e5e5e5;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="textBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#000000;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#000000;stop-opacity:0.1" />
          </linearGradient>
          <pattern id="texture" patternUnits="userSpaceOnUse" width="40" height="40">
            <rect width="40" height="40" fill="#a855f7" opacity="0.08"/>
            <circle cx="20" cy="20" r="1" fill="#e5e5e5" opacity="0.2"/>
          </pattern>
          <filter id="textShadow">
            <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.5"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="400" height="600" fill="url(#bg)"/>
        <rect width="400" height="600" fill="url(#texture)"/>
        
        <!-- Enhanced Border -->
        <rect x="10" y="10" width="380" height="580" fill="none" stroke="#a855f7" stroke-width="2" rx="12" opacity="0.8"/>
        <rect x="20" y="20" width="360" height="560" fill="none" stroke="#a855f7" stroke-width="1" rx="8" opacity="0.6"/>
        
        <!-- Title Area with Background -->
        <rect x="30" y="40" width="340" height="90" fill="url(#textBg)" rx="8"/>
        <rect x="30" y="40" width="340" height="90" fill="none" stroke="#a855f7" stroke-width="1" rx="8" opacity="0.4"/>
        
        <!-- Main Title with Shadow -->
        <text x="200" y="75" font-family="serif" font-size="26" fill="#000000" text-anchor="middle" font-weight="700" opacity="0.3">
          ${cardTitle || 'My Dream'}
        </text>
        <text x="200" y="73" font-family="serif" font-size="26" fill="#a855f7" text-anchor="middle" font-weight="700">
          ${cardTitle || 'My Dream'}
        </text>
        
        <!-- Subtitle with Shadow -->
        <text x="200" y="105" font-family="serif" font-size="14" fill="#000000" text-anchor="middle" opacity="0.4">
          ${cardSubtitle || format(new Date(), 'MMM d, yyyy')}
        </text>
        <text x="200" y="103" font-family="serif" font-size="14" fill="#a855f7" text-anchor="middle" opacity="0.9">
          ${cardSubtitle || format(new Date(), 'MMM d, yyyy')}
        </text>
        
        <!-- Central Symbol Area with Enhanced Background -->
        <rect x="60" y="150" width="280" height="260" fill="url(#textBg)" rx="12"/>
        <rect x="60" y="150" width="280" height="260" fill="none" stroke="#a855f7" stroke-width="1" rx="12" opacity="0.3"/>
        
        <!-- Decorative circles -->
        <circle cx="200" cy="280" r="80" fill="none" stroke="#a855f7" stroke-width="2" opacity="0.4"/>
        <circle cx="200" cy="280" r="60" fill="none" stroke="#a855f7" stroke-width="1" opacity="0.6"/>
        <circle cx="200" cy="280" r="40" fill="none" stroke="#a855f7" stroke-width="1" opacity="0.3"/>
        
        <!-- Central Symbol Enhanced -->
        <text x="200" y="295" font-family="serif" font-size="48" fill="#000000" text-anchor="middle" opacity="0.3">◈</text>
        <text x="200" y="292" font-family="serif" font-size="48" fill="#a855f7" text-anchor="middle" opacity="0.9">◈</text>
        
        <!-- Symbols Section Enhanced -->
        <text x="200" y="340" font-family="serif" font-size="12" fill="#000000" text-anchor="middle" opacity="0.4" font-weight="500">
          ${dreamAnalysis.symbols.slice(0, 3).join(' • ')}
        </text>
        <text x="200" y="338" font-family="serif" font-size="12" fill="#a855f7" text-anchor="middle" opacity="0.9" font-weight="500">
          ${dreamAnalysis.symbols.slice(0, 3).join(' • ')}
        </text>
        
        <!-- Bottom Analysis Section -->
        <rect x="30" y="430" width="340" height="140" fill="url(#textBg)" rx="8"/>
        <rect x="30" y="430" width="340" height="140" fill="none" stroke="#a855f7" stroke-width="1" rx="8" opacity="0.4"/>
        
        <!-- Dream Analysis Label -->
        <text x="200" y="455" font-family="serif" font-size="12" fill="#000000" text-anchor="middle" opacity="0.4" font-weight="600" letter-spacing="2px">
          DREAM ANALYSIS
        </text>
        <text x="200" y="453" font-family="serif" font-size="12" fill="#a855f7" text-anchor="middle" opacity="0.9" font-weight="600" letter-spacing="2px">
          DREAM ANALYSIS
        </text>
        
        <!-- Archetypes -->
        <text x="200" y="480" font-family="serif" font-size="11" fill="#000000" text-anchor="middle" opacity="0.4" font-weight="500">
          ${dreamAnalysis.archetypes.slice(0, 2).join(' • ')}
        </text>
        <text x="200" y="478" font-family="serif" font-size="11" fill="#a855f7" text-anchor="middle" opacity="0.8" font-weight="500">
          ${dreamAnalysis.archetypes.slice(0, 2).join(' • ')}
        </text>
        
        <!-- Analysis Preview (first few words) -->
        <text x="200" y="510" font-family="serif" font-size="9" fill="#000000" text-anchor="middle" opacity="0.3">
          ${dreamAnalysis.analysis.split(' ').slice(0, 8).join(' ')}...
        </text>
        <text x="200" y="508" font-family="serif" font-size="9" fill="#a855f7" text-anchor="middle" opacity="0.7">
          ${dreamAnalysis.analysis.split(' ').slice(0, 8).join(' ')}...
        </text>
        
        <!-- Decorative Elements -->
        <circle cx="80" cy="180" r="2" fill="#a855f7" opacity="0.6"/>
        <circle cx="320" cy="180" r="2" fill="#a855f7" opacity="0.6"/>
        <circle cx="80" cy="380" r="2" fill="#a855f7" opacity="0.6"/>
        <circle cx="320" cy="380" r="2" fill="#a855f7" opacity="0.6"/>
        
        <!-- Footer -->
        <text x="200" y="545" font-family="serif" font-size="8" fill="#a855f7" text-anchor="middle" opacity="0.6" letter-spacing="1px">
          THE SILENT CHRONICLE
        </text>
      </svg>
    `;

    const mockImageUrl = `data:image/svg+xml;base64,${safeBase64Encode(svgContent)}`;

    // Also attempt to generate backside content for fallback
    let backside: { brief: string; poem: string } | undefined;
    try {
      backside = await geminiService.generateBacksideContent(dreamContent);
    } catch (err) {
      backside = { brief: 'A fleeting echo of the night.', poem: 'shadows breathe softly\nbeneath a quiet moon\nI carry the hush\nof what the dark taught\ninto the waking light' };
    }

    const newCard: TarotCard = {
      id: `card-${Date.now()}`,
      imageUrl: mockImageUrl,
      theme: themeName,
      title: cardTitle || 'My Dream',
      subtitle: cardSubtitle || format(new Date(), 'MMM d, yyyy'),
      analysis: dreamAnalysis.analysis, // This is the main analysis text
      backside,
      createdAt: new Date()
    };

    setPreviewCard(newCard);
    onCardGenerated(newCard);
    
    toast({
      title: "An echo of the dream",
      description: "A fallback vision was created with your dream's essence.",
    });
  };

  const downloadCard = async () => {
    if (!previewCard) return;
    
    try {
      const fileName = sanitizeFileName(`dream-card-${previewCard.title}`);
      const imageUrl = previewCard.imageUrl;

      // If hosted on Cloudinary, use attachment to suggest filename
      if (/res\.cloudinary\.com\//.test(imageUrl)) {
        // Insert fl_attachment:<filename> into the transformation part of the URL
        // e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/folder/id.png
        //   -> https://res.cloudinary.com/<cloud>/image/upload/fl_attachment:dream-card-.../v123/folder/id.png
        const withAttachment = imageUrl.replace(
          /(\/image\/upload)(\/)/,
          (_m, p1, p2) => `${p1}/fl_attachment:${fileName}${p2}`
        );
        const link = document.createElement('a');
        link.href = withAttachment;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Downloading vision...', description: 'Your dream artifact is being transcribed.' });
        return;
      }

      // Otherwise just navigate to the URL (PNG data URLs will download in most browsers)
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Downloading vision...', description: 'Your dream artifact is being transcribed.' });
      
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
          title: "Transcription complete (fallback)",
          description: "The vision was downloaded successfully.",
        });
      } catch (fallbackError) {
        console.error('Final fallback also failed:', fallbackError);
        toast({
          title: "Transcription failed",
          description: "Could not transcribe the vision. Please try right-clicking and saving the image manually.",
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
        title: "Dream chronicled!",
        description: "Your vision and its meaning have been saved to your private journal.",
      });
      
    } catch (error) {
      console.error('Failed to save dream:', error);
      toast({
        title: "Chronicle failed",
        description: "Could not save your dream to the journal. Please try again.",
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
      <div className="text-left space-y-2">
        <p className="text-muted-foreground text-sm">Turn this dream into something you can see.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,1fr)_minmax(320px,1fr)] xl:grid-cols-1 gap-8">
        {/* On xl we rely on the page grid width; within this card keep it compact */}
        {/* Customization Panel */}
        <Card className="dream-card">
          <div className="space-y-6">
            {/* AI Generator selection removed; always using FLUX */}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Style
              </Label>
              <Select
                value={isCustomTheme ? 'custom' : themeName}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setIsCustomTheme(true);
                  } else {
                    setIsCustomTheme(false);
                    setThemeName(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_THEMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom…</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isCustomTheme && (
              <div className="space-y-2">
                <Label>Custom Style</Label>
                <Input
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="e.g. Dreamlike Watercolor"
                  className="bg-background/50 border-border/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Title</Label>
              </div>
              <Input
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder="The Silent Chronicle"
                className="bg-background/50 border-border/50"
                disabled={isGeneratingNames}
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={cardSubtitle}
                onChange={(e) => setCardSubtitle(e.target.value)}
                placeholder={format(new Date(), 'MMM d, yyyy')}
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
                  Conjuring your vision...
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Summon
                </div>
              )}
            </Button>
            {showProgress && (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-muted-foreground">{progressMessage}</div>
                <Progress value={progressPercent} />
                {progressPercent === 0 && (
                  <div className="text-xs text-muted-foreground">
                    Having trouble? <button className="underline underline-offset-4" onClick={generateCardImage}>Try again</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Card Preview */}
        <Card className="dream-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Preview
              </Label>
              {previewCard && (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setIsFlipped(!isFlipped)} aria-label="Flip card">
                    <FlipHorizontal className="h-3 w-3 mr-2" /> {isFlipped ? 'Frontside' : 'Backside'}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(true)} aria-label="Expand preview">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {previewCard ? (
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="relative w-full max-w-[32rem] xl:max-w-full mx-auto"
                >
                  <TarotFlipCard
                    card={previewCard}
                    isFlipped={isFlipped}
                    className="aspect-[2/3] w-full"
                    onFrontClick={() => setIsPreviewOpen(true)}
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
                        Chronicling dream...
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Chronicle this Dream
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
                      Transcribe (PNG)
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
                    Your vision will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Fullscreen preview */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between w-full">
                <span className="font-light">Preview</span>
              </DialogTitle>
            </DialogHeader>
            {previewCard && (
              <div className="w-full max-h-[70vh]">
                <img
                  src={previewCard.imageUrl}
                  alt={previewCard.title}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-md"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button onClick={downloadCard} variant="outline">
                <Download className="h-4 w-4 mr-2" /> Download PNG
              </Button>
              <Button onClick={() => setIsPreviewOpen(false)}>
                <X className="h-4 w-4 mr-2" /> Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
};
