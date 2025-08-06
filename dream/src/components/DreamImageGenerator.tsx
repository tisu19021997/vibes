import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, Download, Palette, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { CARD_THEMES, CardTheme, TarotCard, DreamAnalysisResponse } from '@/types/dream';
import { format } from 'date-fns';
import { geminiService } from '@/services/geminiService';
import { toast } from '@/hooks/use-toast';

interface TarotCardGeneratorProps {
  dreamAnalysis: DreamAnalysisResponse;
  onCardGenerated: (card: TarotCard) => void;
}

export const DreamImageGenerator: React.FC<TarotCardGeneratorProps> = ({ 
  dreamAnalysis, 
  onCardGenerated 
}) => {
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(CARD_THEMES[0]);
  const [cardTitle, setCardTitle] = useState('');
  const [cardSubtitle, setCardSubtitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingNames, setIsGeneratingNames] = useState(false);
  const [previewCard, setPreviewCard] = useState<TarotCard | null>(null);

  const generateNameSuggestions = useCallback(async () => {
    if (!dreamAnalysis) return;
    
    setIsGeneratingNames(true);
    try {
      // Use the tarot card suggestions from the analysis if available
      if (dreamAnalysis.tarotCard) {
        setCardTitle(dreamAnalysis.tarotCard.title);
        setCardSubtitle(dreamAnalysis.tarotCard.subtitle);
        
        toast({
          title: "Card Names Loaded",
          description: "Using names generated with your dream analysis.",
        });
      } else {
        // Fallback to separate generation if not available
        const suggestions = await geminiService.generateCardNameSuggestions(
          dreamAnalysis.analysis, 
          dreamAnalysis.symbols, 
          dreamAnalysis.archetypes
        );
        setCardTitle(suggestions.title);
        setCardSubtitle(suggestions.subtitle);
        
        toast({
          title: "Card Names Generated",
          description: suggestions.reasoning,
        });
      }
    } catch (error) {
      console.error('Error generating name suggestions:', error);
      toast({
        title: "Name Generation Failed",
        description: "Using default names. You can edit them manually.",
        variant: "destructive",
      });
      setCardTitle('Dream Vision');
      setCardSubtitle('A Journey Through the Unconscious');
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
      console.log('🎨 Starting AI tarot card generation...');
      
      // Use Gemini to generate the actual tarot card image
      const result = await geminiService.generateDreamImage(
        dreamAnalysis.analysis,
        dreamAnalysis.symbols,
        dreamAnalysis.archetypes,
        selectedTheme.name
      );
      
      // Convert base64 to data URL for display
      const imageUrl = `data:image/png;base64,${result.imageBase64}`;
      
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
        title: "Tarot Card Generated!",
        description: "Your AI-generated dream tarot card is ready.",
      });
      
    } catch (error) {
      console.error('Error generating AI card:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI card. Please check your API key and try again.",
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
    
    const mockImageUrl = `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${selectedTheme.primaryColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${selectedTheme.secondaryColor};stop-opacity:1" />
          </linearGradient>
          <pattern id="texture" patternUnits="userSpaceOnUse" width="40" height="40">
            <rect width="40" height="40" fill="${selectedTheme.accentColor}" opacity="0.02"/>
            <circle cx="20" cy="20" r="1" fill="${selectedTheme.secondaryColor}" opacity="0.1"/>
          </pattern>
        </defs>
        
        <!-- Background -->
        <rect width="400" height="600" fill="url(#bg)"/>
        <rect width="400" height="600" fill="url(#texture)"/>
        
        <!-- Border -->
        <rect x="15" y="15" width="370" height="570" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="1" rx="8"/>
        <rect x="25" y="25" width="350" height="550" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="0.5" rx="4"/>
        
        <!-- Title Area -->
        <rect x="40" y="50" width="320" height="70" fill="${selectedTheme.accentColor}" opacity="0.1" rx="4"/>
        <text x="200" y="75" font-family="${selectedTheme.fontFamily}" font-size="22" fill="${selectedTheme.accentColor}" text-anchor="middle" font-weight="600">
          ${cardTitle || 'Dream Vision'}
        </text>
        <text x="200" y="95" font-family="${selectedTheme.fontFamily}" font-size="12" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.7">
          ${cardSubtitle || format(new Date(), 'MMMM dd, yyyy')}
        </text>
        
        <!-- Central Symbol Area -->
        <rect x="80" y="140" width="240" height="240" fill="${selectedTheme.accentColor}" opacity="0.05" rx="8"/>
        <circle cx="200" cy="260" r="60" fill="none" stroke="${selectedTheme.accentColor}" stroke-width="1" opacity="0.3"/>
        <text x="200" y="275" font-family="serif" font-size="36" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.8">◈</text>
        
        <!-- Symbols -->
        <text x="200" y="320" font-family="${selectedTheme.fontFamily}" font-size="10" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.6">
          ${dreamAnalysis.symbols.slice(0, 3).join(' • ')}
        </text>
        
        <!-- Bottom Section -->
        <rect x="40" y="420" width="320" height="120" fill="${selectedTheme.accentColor}" opacity="0.03" rx="4"/>
        <text x="200" y="440" font-family="${selectedTheme.fontFamily}" font-size="10" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.6">
          DREAM ANALYSIS
        </text>
        <text x="200" y="460" font-family="${selectedTheme.fontFamily}" font-size="8" fill="${selectedTheme.accentColor}" text-anchor="middle" opacity="0.5">
          ${dreamAnalysis.archetypes.slice(0, 2).join(' • ')}
        </text>
      </svg>
    `)}`;

    const newCard: TarotCard = {
      id: `card-${Date.now()}`,
      imageUrl: mockImageUrl,
      theme: selectedTheme,
      title: cardTitle || 'Dream Vision',
      subtitle: cardSubtitle || format(new Date(), 'MMMM dd, yyyy'),
      analysis: dreamAnalysis.analysis, // This is the main analysis text
      createdAt: new Date()
    };

    setPreviewCard(newCard);
    onCardGenerated(newCard);
    
    toast({
      title: "Fallback Card Generated",
      description: "Created a styled card with your dream symbols (AI generation unavailable).",
    });
  };

  const downloadCard = () => {
    if (!previewCard) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = previewCard.imageUrl;
    link.download = `dream-card-${previewCard.title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light">Create Your Dream Card</h2>
        <p className="text-muted-foreground">
          Transform your dream analysis into a beautiful, personalized tarot card
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customization Panel */}
        <Card className="dream-card">
          <div className="space-y-6">
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateNameSuggestions}
                  disabled={isGeneratingNames}
                  className="h-6 text-xs"
                >
                  {isGeneratingNames ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </motion.div>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Suggest
                    </>
                  )}
                </Button>
              </div>
              <Input
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder="Dream Vision"
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
              disabled={isGenerating || isGeneratingNames || !cardTitle.trim()}
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
                    <Wand2 className="h-4 w-4" />
                  </motion.div>
                  Generating AI Card...
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Generate AI Tarot Card
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
                  className="relative aspect-[2/3] max-w-sm mx-auto"
                >
                  <img
                    src={previewCard.imageUrl}
                    alt={previewCard.title}
                    className="w-full h-full object-cover rounded-lg shadow-dream"
                  />
                </motion.div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={downloadCard}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => {
                      // Future: Print to home functionality
                      alert('Print-to-home feature coming soon!');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Print & Ship
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-[2/3] max-w-sm mx-auto bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Wand2 className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Generate your card to see preview
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
