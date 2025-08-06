import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dream } from '@/types/dream';
import { format } from 'date-fns';

interface DreamGalleryProps {
  dreams: Dream[];
  onDeleteDream: (dreamId: string) => void;
  onViewDream: (dream: Dream) => void;
}

export const DreamGallery: React.FC<DreamGalleryProps> = ({ dreams, onDeleteDream, onViewDream }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDreams = dreams
    .filter(dream => 
      dream.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dream.analysis.analysis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dream.analysis.symbols.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (dreams.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium">No dreams yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Add your first dream and start collecting beautiful memories.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light">My Dreams</h2>
          <Badge variant="outline">{dreams.length} Dreams</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Find a dream..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <motion.div
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredDreams.map((dream) => (
            <motion.div
              key={dream.id}
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
              layout
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ y: -5 }}
            >
              <Card className="dream-card h-full flex flex-col p-4">
                <div className="flex-1 space-y-4">
                  {dream.tarotCard?.imageUrl && (
                    <div className="aspect-square w-full">
                      <img
                        src={dream.tarotCard.imageUrl}
                        alt="Dream visualization"
                        className="w-full h-full object-cover rounded-md shadow-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(dream.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <p className="text-sm line-clamp-3 leading-relaxed">{dream.content}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t mt-4">
                  <Button variant="outline" size="sm" onClick={() => onViewDream(dream)} className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteDream(dream.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
