import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Trash2, Eye, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dream } from '@/types/dream';
import { format } from 'date-fns';

interface DreamGalleryProps {
  dreams: Dream[];
  onDeleteDream: (dreamId: string) => void;
  onViewDream: (dream: Dream) => void;
}

export const DreamGallery: React.FC<DreamGalleryProps> = ({ 
  dreams, 
  onDeleteDream, 
  onViewDream 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'with-cards' | 'analysis-only'>('all');

  const filteredDreams = dreams
    .filter(dream => {
      const matchesSearch = dream.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dream.analysis.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filterBy === 'all' || 
        (filterBy === 'with-cards' && dream.tarotCard) ||
        (filterBy === 'analysis-only' && !dream.tarotCard);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.content.localeCompare(b.content);
    });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 20
      }
    }
  };

  if (dreams.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium">No Dreams Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start your dream journal by sharing your first dream. Each dream will be analyzed and can be transformed into a beautiful tarot card.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light">Dream Gallery</h2>
          <Badge variant="outline" className="bg-primary/5 border-primary/20">
            {dreams.length} Dreams
          </Badge>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your dreams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterBy === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBy('all')}
            >
              All
            </Button>
            <Button
              variant={filterBy === 'with-cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBy('with-cards')}
            >
              With Cards
            </Button>
            <Button
              variant={filterBy === 'analysis-only' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBy('analysis-only')}
            >
              Analysis Only
            </Button>
          </div>
        </div>
      </div>

      {/* Dreams Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredDreams.map((dream) => (
            <motion.div
              key={dream.id}
              variants={itemVariants}
              layout
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ y: -5 }}
              transition={{ type: "spring" as const, damping: 20 }}
            >
              <Card className="dream-card h-full flex flex-col">
                <div className="flex-1 space-y-4">
                  {/* Tarot Card Preview */}
                  {dream.tarotCard && (
                    <div className="aspect-[2/3] w-24 mx-auto">
                      <img
                        src={dream.tarotCard.imageUrl}
                        alt={dream.tarotCard.title}
                        className="w-full h-full object-cover rounded-md shadow-sm"
                      />
                    </div>
                  )}

                  {/* Dream Content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(dream.createdAt), 'MMM dd, yyyy')}
                    </div>
                    
                    <p className="text-sm line-clamp-3 leading-relaxed">
                      {dream.content}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1">
                    {dream.tarotCard && (
                      <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                        Card Created
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs bg-accent/5 border-accent/20">
                      Analyzed
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDream(dream)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteDream(dream.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredDreams.length === 0 && searchTerm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <p className="text-muted-foreground">
            No dreams found matching "{searchTerm}"
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};