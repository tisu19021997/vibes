import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Heart, Lightbulb, Palette, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { DreamAnalysisResponse } from '@/types/dream';

interface DreamAnalysisProps {
  analysis: DreamAnalysisResponse;
  dreamContent: string;
}

export const DreamAnalysis: React.FC<DreamAnalysisProps> = ({ analysis, dreamContent }) => {
  const iconVariants = {
    hover: { scale: 1.1, rotate: 5 },
    tap: { scale: 0.95 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Dream Content */}
      <Card className="dream-card user-dream">
        <div className="space-y-4 reading-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="uppercase tracking-wide text-xs bg-primary text-primary-foreground border-transparent">Your dream</Badge>
            <h3 className="text-2xl font-normal text-foreground">The dream</h3>
          </div>
          <p className="dream-quote italic reading-prose">{dreamContent}</p>
        </div>
      </Card>

      {/* Main Analysis */}
      <Card className="dream-card">
        <div className="space-y-4 reading-wrap">
          <h3 className="text-2xl font-normal text-foreground">What the dream reveals</h3>
          <div className="reading-prose text-muted-foreground">
            {analysis.analysis}
          </div>
        </div>
      </Card>

      {/* Jungian Interpretation */}
      <Card className="dream-card">
        <div className="space-y-4 reading-wrap">
          <h3 className="text-2xl font-normal text-foreground">Deeper currents</h3>
          <div className="reading-prose text-muted-foreground">
            {analysis.jungianInterpretation}
          </div>
        </div>
      </Card>

      {/* Symbols and Themes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dream-card">
          <div className="space-y-4">
            <h4 className="text-xl font-normal text-foreground">Symbols that surfaced</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.symbols.map((symbol, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge variant="outline" className="bg-accent/5 border-accent/20">
                    {symbol}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="dream-card">
          <div className="space-y-4">
            <h4 className="text-xl font-normal text-foreground">Emotions & motifs</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.archetypes.map((archetype, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge variant="outline" className="bg-accent/5 border-accent/20">
                    {archetype}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Emotions */}
      <Card className="dream-card">
        <div className="space-y-4">
          <h4 className="text-xl font-normal text-foreground">Emotional echoes</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.emotions.map((emotion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Badge variant="outline" className="bg-accent/5 border-accent/20">
                  {emotion}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* Suggestions */}
      <Card className="dream-card">
        <div className="space-y-4">
          <h4 className="text-xl font-normal text-foreground">Ways to keep it close</h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-base text-foreground flex items-start gap-2"
              >
                <span className="text-primary font-bold">•</span>
                {suggestion}
              </motion.li>
            ))}
          </ul>
        </div>
      </Card>
    </motion.div>
  );
};
