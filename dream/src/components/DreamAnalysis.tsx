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
      <Card className="dream-card">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <motion.div
              variants={iconVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Eye className="h-5 w-5 text-primary" />
            </motion.div>
            <h3 className="text-lg font-medium">Your Dream</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed italic">
            "{dreamContent}"
          </p>
        </div>
      </Card>

      {/* Main Analysis */}
      <Card className="dream-card">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <motion.div
              variants={iconVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Brain className="h-5 w-5 text-primary" />
            </motion.div>
            <h3 className="text-lg font-medium">Dream Analysis</h3>
          </div>
          <p className="text-foreground leading-relaxed">
            {analysis.analysis}
          </p>
        </div>
      </Card>

      {/* Jungian Interpretation */}
      <Card className="dream-card">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <motion.div
              variants={iconVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Palette className="h-5 w-5 text-primary" />
            </motion.div>
            <h3 className="text-lg font-medium">Jungian Insights</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {analysis.jungianInterpretation}
          </p>
        </div>
      </Card>

      {/* Symbols and Archetypes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dream-card">
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <motion.div
                variants={iconVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Eye className="h-4 w-4 text-primary" />
              </motion.div>
              Symbols
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.symbols.map((symbol, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge variant="outline" className="bg-primary/5 border-primary/20">
                    {symbol}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="dream-card">
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <motion.div
                variants={iconVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Brain className="h-4 w-4 text-primary" />
              </motion.div>
              Archetypes
            </h4>
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
          <h4 className="font-medium flex items-center gap-2">
            <motion.div
              variants={iconVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Heart className="h-4 w-4 text-primary" />
            </motion.div>
            Emotional Undercurrents
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.emotions.map((emotion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Badge variant="outline" className="bg-secondary/20 border-secondary/30">
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
          <h4 className="font-medium flex items-center gap-2">
            <motion.div
              variants={iconVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Lightbulb className="h-4 w-4 text-primary" />
            </motion.div>
            Integration Suggestions
          </h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-muted-foreground flex items-start gap-2"
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