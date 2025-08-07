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
import { fluxService } from '@/services/fluxService';
import { Dream, TarotCard, DreamAnalysisResponse, DreamImage, CARD_THEMES } from '@/types/dream';
import { useToast } from '@/hooks/use-toast';
import { APP_CONFIG, APP_NAME, APP_TAGLINE } from '@/config/app';
import { Moon, Sparkles, BookOpen, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiKeys {
  gemini?: string;
  flux?: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('input');
  const [currentDream, setCurrentDream] = useState<string>('');
  const [currentAnalysis, setCurrentAnalysis] = useState<DreamAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [viewingDream, setViewingDream] = useState<Dream | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  
  const { dreams, saveDream, deleteDream, isLoading } = useDreamStorage();
  const { toast } = useToast();

  // Check if API keys are set on mount and update document title
  useEffect(() => {
    const savedGeminiKey = localStorage.getItem('gemini_api_key');
    const savedFluxKey = localStorage.getItem('flux_api_key');
    
    const keys: ApiKeys = {};
    
    if (savedGeminiKey) {
      keys.gemini = savedGeminiKey;
      geminiService.setApiKey(savedGeminiKey);
    }
    
    if (savedFluxKey) {
      keys.flux = savedFluxKey;
      fluxService.setApiKey(savedFluxKey);
    }
    
    setApiKeys(keys);
    
    // Update document title dynamically
    document.title = APP_NAME;
  }, []);

  const handleDreamSubmit = async (dreamContent: string) => {
    if (!apiKeys.gemini) {
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
        title: "Dream Saved",
        description: "Your dream is now safely kept.",
      });
    } catch (error) {
      console.error('Error analyzing dream:', error);
      toast({
        title: "Something went wrong",
        description: "We couldn't create your dream. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApiKeysSet = async (keys: ApiKeys) => {
    try {
      if (keys.gemini) {
        geminiService.setApiKey(keys.gemini);
        localStorage.setItem('gemini_api_key', keys.gemini);
      }
      
      if (keys.flux) {
        fluxService.setApiKey(keys.flux);
        localStorage.setItem('flux_api_key', keys.flux);
      }
      
      setApiKeys(keys);
      
      toast({
        title: "Setup complete",
        description: "Your AI services are configured and ready to use.",
      });

      // If there's a pending dream, analyze it now (only if Gemini key is provided)
      if (currentDream && keys.gemini) {
        handleDreamSubmit(currentDream);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to configure API keys.",
        variant: "destructive",
      });
    }
  };

  const handleCardGenerated = async (card: TarotCard) => {
    if (!currentAnalysis) return;

    // Just show success toast - no automatic saving or tab switching
    toast({
      title: "Dream image created",
      description: "Your beautiful dream image is ready! Click 'Save Dream to Collection' to keep it.",
    });
  };

  const handleViewDream = (dream: Dream) => {
    setViewingDream(dream);
  };

  const handleDeleteDream = (dreamId: string) => {
    deleteDream(dreamId);
    toast({
      title: "Dream removed",
      description: "The dream has been removed from your collection.",
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
          <img src="/icon.png" alt={APP_NAME} className={APP_CONFIG.ui.loadingIconSize.small} />
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
              transition={{ duration: APP_CONFIG.ui.animationDuration, repeat: Infinity, ease: "linear" }}
            >
              <img src="/icon.png" alt={APP_NAME} className={APP_CONFIG.ui.loadingIconSize.large} />
            </motion.div>
            <div>
              <h1 className="text-5xl font-light font-candy">{APP_NAME}</h1>
              <p className="text-xl text-muted-foreground font-candy">{APP_TAGLINE}</p>
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
              Setup
            </Button>
          </div>
        </motion.div>

        {/* View Dream Dialog */}
        <AlertDialog open={!!viewingDream} onOpenChange={() => setViewingDream(null)}>
          <AlertDialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <AlertDialogHeader className="pb-6">
              <AlertDialogTitle className="flex items-center gap-3 text-2xl font-sans">
                <Sparkles className="h-6 w-6 text-primary" />
                Your Dream
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
              Add Dream
            </TabsTrigger>
            <TabsTrigger value="analysis" disabled={!currentAnalysis} className="flex items-center gap-3 px-6 font-sans">
              <Sparkles className="h-5 w-5" />
              My Reading
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-3 px-6 font-sans">
              <BookOpen className="h-5 w-5" />
              My Dreams ({dreams.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent key="input" value="input" className="space-y-10">
              <DreamInput 
                onSubmit={handleDreamSubmit}
                isAnalyzing={isAnalyzing}
              />
            </TabsContent>

            <TabsContent key="analysis" value="analysis" className="space-y-10">
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
                      dreamContent={currentDream}
                      onCardGenerated={handleCardGenerated}
                      apiKeys={apiKeys}
                      onSaveDream={async (dream: Dream) => {
                        await saveDream(dream);
                        toast({
                          title: "Dream saved!",
                          description: "Your dream has been added to your collection.",
                        });
                      }}
                    />
                  </div>

                  <div className="flex justify-center pt-8">
                    <Button onClick={createNewDream} variant="outline" size="lg" className="px-8 py-3 text-lg font-sans">
                      Add Another Dream
                    </Button>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent key="gallery" value="gallery" className="space-y-10">
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
                      Save New Dream
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
          onApiKeysSet={handleApiKeysSet}
          onClose={() => setShowApiKeyModal(false)}
        />
      </div>
    </div>
  );
};

export default Index;
