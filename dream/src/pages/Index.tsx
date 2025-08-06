import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DreamInput } from '@/components/DreamInput';
import { DreamAnalysis } from '@/components/DreamAnalysis';
import { DreamImageGenerator } from '@/components/DreamImageGenerator';
import { DreamGallery } from '@/components/DreamGallery';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { useDreamStorage } from '@/hooks/useDreamStorage';
import { geminiService } from '@/services/geminiService';
import { Dream, TarotCard, DreamAnalysisResponse, DreamImage, CARD_THEMES } from '@/types/dream';
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

  const handleImageGenerated = (image: DreamImage) => {
    if (!currentAnalysis) return;

    // Convert DreamImage to TarotCard
    const card: TarotCard = {
      id: image.id,
      imageUrl: image.imageUrl,
      title: currentAnalysis.tarotCard.title,
      subtitle: currentAnalysis.tarotCard.subtitle,
      analysis: currentAnalysis.analysis,
      theme: CARD_THEMES[0], // Default to minimal theme
      createdAt: image.createdAt
    };

    const dream: Dream = {
      id: `dream-${Date.now()}`,
      content: currentDream,
      analysis: currentAnalysis,
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
          <img src="/icon.png" alt="Dream Journal" className="h-10 w-10" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-16 max-w-8xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-16"
        >
          <div className="flex items-center gap-5">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <img src="/icon.png" alt="Dream Journal" className="h-12 w-12" />
            </motion.div>
            <div>
              <h1 className="text-5xl font-light font-candy">Dream Journal</h1>
              <p className="text-xl text-muted-foreground font-candy">Jungian Dream Analysis & Tarot Cards</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowApiKeyModal(true)}
              className="font-sans"
            >
              <Settings className="h-5 w-5 mr-3" />
              API Settings
            </Button>
          </div>
        </motion.div>

        {/* View Dream Dialog */}
        <AlertDialog open={!!viewingDream} onOpenChange={() => setViewingDream(null)}>
          <AlertDialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <AlertDialogHeader className="pb-6">
              <AlertDialogTitle className="flex items-center gap-3 text-2xl font-sans">
                <Sparkles className="h-6 w-6 text-primary" />
                Dream Analysis
              </AlertDialogTitle>
              <AlertDialogDescription className="text-lg font-sans">
                Recorded on {viewingDream && new Date(viewingDream.createdAt).toLocaleDateString()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {viewingDream && (
              <DreamAnalysis 
                analysis={viewingDream.analysis}
                dreamContent={viewingDream.content}
              />
            )}
          </AlertDialogContent>
        </AlertDialog>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border h-16 text-lg">
            <TabsTrigger value="input" className="flex items-center gap-3 px-6 font-sans">
              <img src="/icon.png" alt="" className="h-5 w-5" />
              New Dream
            </TabsTrigger>
            <TabsTrigger value="analysis" disabled={!currentAnalysis} className="flex items-center gap-3 px-6 font-sans">
              <Sparkles className="h-5 w-5" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-3 px-6 font-sans">
              <BookOpen className="h-5 w-5" />
              Gallery ({dreams.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="input" className="space-y-10">
              <DreamInput 
                onSubmit={handleDreamSubmit}
                isAnalyzing={isAnalyzing}
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-10">
              {currentAnalysis && currentDream && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12"
                >
                  <DreamAnalysis 
                    analysis={currentAnalysis}
                    dreamContent={currentDream}
                  />
                  
                  <div className="border-t border-border pt-12">
                    <DreamImageGenerator
                      dreamAnalysis={currentAnalysis}
                      onImageGenerated={handleImageGenerated}
                    />
                  </div>

                  <div className="flex justify-center pt-8">
                    <Button onClick={createNewDream} variant="outline" size="lg" className="px-8 py-3 text-lg font-sans">
                      Create Another Dream
                    </Button>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="gallery" className="space-y-10">
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
                  <div className="flex justify-center mt-12">
                    <Button onClick={createNewDream} className="mystical-button px-8 py-3 text-lg font-sans" size="lg">
                      <img src="/icon.png" alt="" className="h-5 w-5 mr-3" />
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
