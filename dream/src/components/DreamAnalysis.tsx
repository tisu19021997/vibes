import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { DreamAnalysisResponse } from '@/types/dream';

interface DreamAnalysisProps {
  analysis: DreamAnalysisResponse;
  dreamContent: string;
}

export const DreamAnalysis: React.FC<DreamAnalysisProps> = ({ analysis, dreamContent }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-10"
    >
      {/* Header and dream text */}
      <section className="reading-wrap space-y-5">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="uppercase tracking-wide text-[10px] bg-primary text-primary-foreground border-transparent">your dream</Badge>
          <h3 className="text-[22px] font-normal lowercase tracking-tight">the dream</h3>
        </div>
        <p className="dream-quote italic reading-prose">{dreamContent}</p>
      </section>
      <div className="divider" />

      {/* Main analysis */}
      <section className="reading-wrap space-y-5">
        <h3 className="text-[22px] font-normal lowercase tracking-tight">what the dream reveals</h3>
        <div className="reading-prose text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.analysis}</ReactMarkdown>
        </div>
      </section>
      <div className="divider" />

      {/* Jungian */}
      <section className="reading-wrap space-y-5">
        <h3 className="text-[22px] font-normal lowercase tracking-tight">deeper currents</h3>
        <div className="reading-prose text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.jungianInterpretation}</ReactMarkdown>
        </div>
      </section>
      <div className="divider" />

      {/* Symbols and archetypes */}
      <section className="reading-wrap grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-3">
          <h4 className="text-lg font-normal lowercase tracking-tight">symbols that surfaced</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.symbols.map((symbol, index) => (
              <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
                <Badge variant="outline" className="bg-accent/5 border-accent/20">{symbol}</Badge>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-lg font-normal lowercase tracking-tight">emotions & motifs</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.archetypes.map((archetype, index) => (
              <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
                <Badge variant="outline" className="bg-accent/5 border-accent/20">{archetype}</Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <div className="divider" />

      {/* Emotions */}
      <section className="reading-wrap space-y-3">
        <h4 className="text-lg font-normal lowercase tracking-tight">emotional echoes</h4>
        <div className="flex flex-wrap gap-2">
          {analysis.emotions.map((emotion, index) => (
            <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
              <Badge variant="outline" className="bg-accent/5 border-accent/20">{emotion}</Badge>
            </motion.div>
          ))}
        </div>
      </section>
      <div className="divider" />

      {/* Suggestions */}
      <section className="reading-wrap space-y-4">
        <h4 className="text-lg font-normal lowercase tracking-tight">ways to keep it close</h4>
        <ul className="space-y-2">
          {analysis.suggestions.map((suggestion, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="text-base text-foreground flex items-start gap-2"
            >
              <span className="text-primary font-bold">•</span>
              {suggestion}
            </motion.li>
          ))}
        </ul>
      </section>
    </motion.article>
  );
};
