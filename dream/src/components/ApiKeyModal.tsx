import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink, Shield } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onApiKeySet: (apiKey: string) => void;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onApiKeySet, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    
    setIsLoading(true);
    try {
      onApiKeySet(apiKey.trim());
      onClose();
    } catch (error) {
      console.error('Error setting API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Quick Setup
          </DialogTitle>
          <DialogDescription>
            Add your key so we can help create beautiful images from your dreams.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Your Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your key stays safe on your device. We never see it.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Need a key? Get one here:
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Get Your Key
            </Button>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!apiKey.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Setting up...' : 'Save Key'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
