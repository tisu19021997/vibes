import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DreamInput } from '@/components/DreamInput';
import { DreamAnalysis } from '@/components/DreamAnalysis';
import { TarotCardGenerator } from '@/components/TarotCardGenerator';
import { DreamGallery } from '@/components/DreamGallery';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { useDreamStorage } from '@/hooks/useDreamStorage';
import { geminiService } from '@/services/geminiService';
import { Dream, TarotCard, DreamAnalysisResponse } from '@/types/dream';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sparkles, BookOpen, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Index = () => {
  const [activeTab, setActiveTab] = useState('input');
  const [currentDream, setCurrentDream] = useState<string>('');
  const [currentAnalysis, setCurrentAnalysis] = useState<DreamAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [viewingDream, setViewingDream] = useState<Dream | null>(null);
  
  const { dreams, saveDream, deleteDream, isLoading } = useDreamStorage();
  const { toast } = useToast();

  // Check if API key is set on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      geminiService.setApiKey(savedApiKey);
    }
  }, []);

  const handleDreamSubmit = async (dreamContent: string) => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (!savedApiKey) {
      setShowApiKeyModal(true);
      setCurrentDream(dreamContent);
      return;
    }

    setIsAnalyzing(true);
    setCurrentDream(dreamContent);

    try {
      const analysis = await geminiService.analyzeDream({ dreamContent });
      setCurrentAnalysis(analysis);
      setActiveTab('analysis');
      
      toast({
        title: "Dream Analyzed",
        description: "Your dream has been analyzed using Jungian psychology principles.",
      });
    } catch (error) {
      console.error('Error analyzing dream:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze your dream. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApiKeySet = async (apiKey: string) => {
    try {
      geminiService.setApiKey(apiKey);
      localStorage.setItem('gemini_api_key', apiKey);
      
      toast({
        title: "API Key Set",
        description: "Gemini API key has been configured successfully.",
      });

      // If there's a pending dream, analyze it now
      if (currentDream) {
        handleDreamSubmit(currentDream);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to configure API key.",
        variant: "destructive",
      });
    }
  };

  const handleCardGenerated = (card: TarotCard) => {
    if (!currentAnalysis) return;

    const dream: Dream = {
      id: `dream-${Date.now()}`,
      content: currentDream,
      analysis: currentAnalysis.analysis,
      tarotCard: card,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    saveDream(dream);
    setActiveTab('gallery');
    
    toast({
      title: "Dream Card Created",
      description: "Your dream has been transformed into a beautiful tarot card.",
    });
  };

  const handleViewDream = (dream: Dream) => {
    setViewingDream(dream);
  };

  const handleDeleteDream = (dreamId: string) => {
    deleteDream(dreamId);
    toast({
      title: "Dream Deleted",
      description: "The dream has been removed from your gallery.",
    });
  };

  const createNewDream = () => {
    setCurrentDream('');
    setCurrentAnalysis(null);
    setViewingDream(null);
    setActiveTab('input');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Moon className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Moon className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-light">Dream Journal</h1>
              <p className="text-sm text-muted-foreground">Jungian Dream Analysis & Tarot Cards</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeyModal(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              API Settings
            </Button>
          </div>
        </motion.div>

        {/* View Dream Dialog */}
        <AlertDialog open={!!viewingDream} onOpenChange={() => setViewingDream(null)}>
          <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Dream Analysis
              </AlertDialogTitle>
              <AlertDialogDescription>
                Recorded on {viewingDream && new Date(viewingDream.createdAt).toLocaleDateString()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {viewingDream && (
              <DreamAnalysis 
                analysis={{
                  analysis: viewingDream.analysis,
                  jungianInterpretation: "This dream contains archetypal elements worth exploring.",
                  symbols: ["Extracted from original analysis"],
                  archetypes: ["Universal patterns"],
                  emotions: ["Complex emotional undercurrents"],
                  suggestions: ["Reflect on the dream's significance"]
                }}
                dreamContent={viewingDream.content}
              />
            )}
          </AlertDialogContent>
        </AlertDialog>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
            <TabsTrigger value="input" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              New Dream
            </TabsTrigger>
            <TabsTrigger value="analysis" disabled={!currentAnalysis} className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Gallery ({dreams.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="input" className="space-y-6">
              <DreamInput 
                onSubmit={handleDreamSubmit}
                isAnalyzing={isAnalyzing}
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {currentAnalysis && currentDream && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <DreamAnalysis 
                    analysis={currentAnalysis}
                    dreamContent={currentDream}
                  />
                  
                  <div className="border-t border-border pt-8">
                    <TarotCardGenerator
                      dreamAnalysis={currentAnalysis.analysis}
                      onCardGenerated={handleCardGenerated}
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={createNewDream} variant="outline">
                      Create Another Dream
                    </Button>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <DreamGallery
                  dreams={dreams}
                  onDeleteDream={handleDeleteDream}
                  onViewDream={handleViewDream}
                />
                
                {dreams.length > 0 && (
                  <div className="flex justify-center mt-8">
                    <Button onClick={createNewDream} className="mystical-button">
                      <Moon className="h-4 w-4 mr-2" />
                      Record New Dream
                    </Button>
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onApiKeySet={handleApiKeySet}
          onClose={() => setShowApiKeyModal(false)}
        />
      </div>
    </div>
  );
};

export default Index;