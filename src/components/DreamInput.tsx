import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Moon, Sparkles } from 'lucide-react';
import { useSpeechSynthesis } from 'react-speech-kit';
import { motion, AnimatePresence } from 'framer-motion';

interface DreamInputProps {
  onSubmit: (dreamContent: string) => void;
  isAnalyzing: boolean;
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const DreamInput: React.FC<DreamInputProps> = ({ onSubmit, isAnalyzing }) => {
  const [dreamText, setDreamText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { speak, cancel, speaking } = useSpeechSynthesis();

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setDreamText(prev => prev + finalTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognition);
      return recognition;
    }
    return null;
  };

  const startRecording = () => {
    const speechRecognition = recognition || initializeSpeechRecognition();
    if (speechRecognition) {
      speechRecognition.start();
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (dreamText.trim()) {
      onSubmit(dreamText.trim());
    }
  };

  const handleClear = () => {
    setDreamText('');
    if (speaking) {
      cancel();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          <Moon className="h-12 w-12 text-primary mx-auto" />
        </motion.div>
        <h1 className="text-4xl font-light tracking-wide">Dream Journal</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Share your dreams with our AI analyst, inspired by Carl Jung's depth psychology. 
          Transform your subconscious visions into beautiful, personalized tarot cards.
        </p>
      </div>

      <Card className="dream-card max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Describe your dream
            </label>
            <Textarea
              placeholder="I was walking through a mystical forest when suddenly..."
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              className="min-h-[200px] resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
              disabled={isAnalyzing}
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className="transition-all duration-300"
                disabled={isAnalyzing}
              >
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.div
                      key="recording"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <MicOff className="h-4 w-4" />
                      </motion.div>
                      Stop Recording
                    </motion.div>
                  ) : (
                    <motion.div
                      key="start"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      Voice Input
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isAnalyzing || !dreamText}
              >
                Clear
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!dreamText.trim() || isAnalyzing}
              className="mystical-button"
            >
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                    Analyzing Dream...
                  </motion.div>
                ) : (
                  <motion.div
                    key="analyze"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Analyze Dream
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </Card>

      {isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="h-2 w-2 bg-red-500 rounded-full"
            />
            <span className="text-sm text-primary">Listening to your dream...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};