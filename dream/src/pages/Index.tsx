import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DreamInput } from '@/components/DreamInput';
import { DreamAnalysis } from '@/components/DreamAnalysis';
import { DreamImageGenerator } from '@/components/DreamImageGenerator';
import { DreamGallery } from '@/components/DreamGallery';
import { useDreamStorage } from '@/hooks/useDreamStorage';
import { geminiService } from '@/services/geminiService';
import { fluxService } from '@/services/fluxService';
import { Dream, TarotCard, DreamAnalysisResponse, DreamImage, CARD_THEMES } from '@/types/dream';
import { useToast } from '@/hooks/use-toast';
import { APP_CONFIG, APP_NAME, APP_TAGLINE } from '@/config/app';
import { Sparkles, BookOpen, Download } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sanitizeFileName } from '@/lib/utils';

interface ApiKeys {
  gemini?: string;
  flux?: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('input');
  const [currentDream, setCurrentDream] = useState<string>('');
  const [currentAnalysis, setCurrentAnalysis] = useState<DreamAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewingDream, setViewingDream] = useState<Dream | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini: import.meta.env.VITE_GEMINI_API_KEY,
    flux: import.meta.env.VITE_FLUX_API_KEY,
  });
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  
  const { dreams, saveDream, deleteDream, isLoading } = useDreamStorage();
  const { toast } = useToast();

  // Initialize API clients from env and update document title
  useEffect(() => {
    if (apiKeys.gemini) {
      geminiService.setApiKey(apiKeys.gemini);
    }
    if (apiKeys.flux) {
      fluxService.setApiKey(apiKeys.flux);
    }
    document.title = APP_NAME;
  }, []);

  const handleDreamSubmit = async (dreamContent: string) => {
    if (!apiKeys.gemini) {
      throw new Error('Gemini API key missing. Please set VITE_GEMINI_API_KEY in your environment.');
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

  // Removed API key modal flow; keys are read from env

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

  const downloadImage = async (imageUrl: string, title?: string) => {
    try {
      const fileName = sanitizeFileName(`dream-card-${title || 'image'}`);

      if (/res\.cloudinary\.com\//.test(imageUrl)) {
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
        return;
      }

      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `dream-card-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error('Final fallback also failed:', fallbackError);
      }
    }
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
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
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
              <h1 className="text-5xl font-light font-candy tracking-tight">{APP_NAME.toLowerCase()}</h1>
              <p className="text-base text-muted-foreground font-sans">{APP_TAGLINE.toLowerCase()}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={createNewDream} className="mystical-button px-5 py-2 font-sans" size="sm">
              New Dream
            </Button>
          </div>
        </motion.div>

        {/* View Dream Dialog */}
        <AlertDialog open={!!viewingDream} onOpenChange={() => setViewingDream(null)}>
          <AlertDialogContent className="max-w-5xl">
            <div className="max-h-[85vh] overflow-y-auto">
              <AlertDialogHeader className="pb-6">
                <AlertDialogDescription className="text-sm font-sans">
                  {viewingDream && format(new Date(viewingDream.createdAt), 'MMM d, yyyy')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              {viewingDream && (
                <div className={viewingDream.tarotCard?.imageUrl ? 'grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-8' : ''}>
                  {viewingDream.tarotCard?.imageUrl && (
                    <div className="xl:self-start">
                      <div className="space-y-3 xl:sticky xl:top-8">
                        <div className="relative aspect-[2/3] w-full max-w-[320px] mx-auto xl:mx-0">
                          <img
                            src={viewingDream.tarotCard.imageUrl}
                            alt={viewingDream.tarotCard.title || 'Dream card'}
                            className="w-full h-full object-cover rounded-md shadow-dream cursor-zoom-in"
                            onClick={() => setIsImagePreviewOpen(true)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <DreamAnalysis 
                    analysis={viewingDream.analysis}
                    dreamContent={viewingDream.content}
                  />
                </div>
              )}
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Image Fullscreen Preview */}
        <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
          <DialogContent className="max-w-4xl">
            {viewingDream?.tarotCard?.imageUrl && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                className="relative w-full max-h-[75vh]"
              >
                <img
                  src={viewingDream.tarotCard.imageUrl}
                  alt={viewingDream.tarotCard.title || 'Dream card'}
                  className="w-full h-auto max-h-[75vh] object-contain rounded-md"
                />
                <Button
                  onClick={() => downloadImage(viewingDream.tarotCard!.imageUrl, viewingDream.tarotCard!.title)}
                  variant="outline"
                  className="absolute bottom-4 left-4"
                >
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <TabsList className="grid w-full grid-cols-3 bg-transparent border-border h-12 text-sm">
            <TabsTrigger value="input" className="flex items-center gap-2 px-4 font-sans data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none">
              Add Dream
            </TabsTrigger>
            <TabsTrigger value="analysis" disabled={!currentAnalysis} className="flex items-center gap-2 px-4 font-sans data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none">
              My Reading
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2 px-4 font-sans data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none">
              Gallery ({dreams.length})
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
                >
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_520px] gap-10">
                    {/* Reading column */}
                    <div className="space-y-12">
                      <DreamAnalysis 
                        analysis={currentAnalysis}
                        dreamContent={currentDream}
                      />
                    </div>

                    {/* Sticky tools column */}
                    <div>
                      <div className="xl:sticky xl:top-8 space-y-12">
                        <div className="border-t xl:border-0 border-border pt-12 xl:pt-0">
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
                      </div>
                    </div>
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

              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
        </div>
      </main>
      <footer className="h-16 border-t border-border">
        <div className="container mx-auto px-8 h-full flex items-center justify-center">
          <a
            href="https://github.com/tisu19021997"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 font-sans"
            aria-label="GitHub profile"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
