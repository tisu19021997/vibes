import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

interface DreamInputProps {
  onSubmit: (dreamContent: string) => void;
  isAnalyzing: boolean;
}

// NOTE: The speech recognition interfaces are complex and browser-specific.
// For simplicity, we'll use `any` for the recognition object.
// A more robust implementation would define these more strictly.

export const DreamInput: React.FC<DreamInputProps> = ({ onSubmit, isAnalyzing }) => {
  const [dreamText, setDreamText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Try Chrome or Edge.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = dreamText;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event: any) => console.error('Speech recognition error:', event.error);
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setDreamText(finalTranscript + interimTranscript);
    };

    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSubmit = () => {
    if (dreamText.trim()) {
      onSubmit(dreamText.trim());
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-light tracking-tight font-candy">tell your dream</h1>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto font-sans">
          Capture what unfolded and how it felt.
        </p>
      </div>

      <Card className="p-6 space-y-4 max-w-3xl mx-auto">
        <Textarea
          placeholder="I was walking through a peaceful garden..."
          value={dreamText}
          onChange={(e) => setDreamText(e.target.value)}
          className="min-h-[200px] resize-none text-base"
          disabled={isAnalyzing}
        />
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMicClick}
            disabled={isAnalyzing}
            className="font-sans"
          >
            {isRecording ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button onClick={handleSubmit} disabled={!dreamText.trim() || isAnalyzing} className="font-sans mystical-button" variant='default' title={!dreamText.trim() ? 'Write a few words to begin' : undefined}>
            {isAnalyzing ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Revealing...
              </>
            ) : (
              "Reveal"
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
