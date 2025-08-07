import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, ExternalLink, Shield, Sparkles, Wand2 } from 'lucide-react';

interface ApiKeys {
  gemini?: string;
  flux?: string;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onApiKeysSet: (keys: ApiKeys) => void;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onApiKeysSet, 
  onClose 
}) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [fluxKey, setFluxKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load existing keys on open
  useEffect(() => {
    if (isOpen) {
      const savedGeminiKey = localStorage.getItem('gemini_api_key');
      const savedFluxKey = localStorage.getItem('flux_api_key');
      if (savedGeminiKey) setGeminiKey(savedGeminiKey);
      if (savedFluxKey) setFluxKey(savedFluxKey);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      const keys: ApiKeys = {};
      
      if (geminiKey.trim()) {
        keys.gemini = geminiKey.trim();
        localStorage.setItem('gemini_api_key', geminiKey.trim());
      }
      
      if (fluxKey.trim()) {
        keys.flux = fluxKey.trim();
        localStorage.setItem('flux_api_key', fluxKey.trim());
      }
      
      onApiKeysSet(keys);
      onClose();
    } catch (error) {
      console.error('Error setting API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAtLeastOneKey = geminiKey.trim() || fluxKey.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Setup AI Services
          </DialogTitle>
          <DialogDescription>
            Configure your API keys to enable AI-powered dream analysis and image generation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="gemini" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gemini" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Gemini AI
              </TabsTrigger>
              <TabsTrigger value="flux" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                FLUX
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gemini" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="geminiKey">Gemini API Key</Label>
                <Input
                  id="geminiKey"
                  type="password"
                  placeholder="AIza..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Used for dream analysis and Gemini image generation
                </p>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <strong>Gemini AI</strong> provides dream analysis and can generate images. 
                  Great for artistic interpretations.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Get your Gemini API key:
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Gemini API Key
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="flux" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fluxKey">FLUX API Key</Label>
                <Input
                  id="fluxKey"
                  type="password"
                  placeholder="your-flux-api-key"
                  value={fluxKey}
                  onChange={(e) => setFluxKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Used for high-quality FLUX image generation
                </p>
              </div>

              <Alert>
                <Wand2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>FLUX</strong> specializes in high-quality, detailed image generation. 
                  Perfect for professional-grade artwork.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Get your FLUX API key:
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://docs.bfl.ml/', '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get FLUX API Key
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your API keys are stored securely on your device. We never see them.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!hasAtLeastOneKey || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Setting up...' : 'Save Keys'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
