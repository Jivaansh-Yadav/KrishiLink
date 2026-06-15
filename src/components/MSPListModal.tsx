import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, IndianRupee } from 'lucide-react';
import { mspRates } from '@/data/Crops';

interface MSPListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MSPListModal: React.FC<MSPListModalProps> = ({ open, onOpenChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRates = mspRates.filter(item =>
    item.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(mspRates.map(item => item.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[35rem] max-h-[38rem] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            Minimum Support Prices (MSP) 2025-26
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search crops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {categories.map(category => {
            const categoryItems = filteredRates.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category}>
                <Badge variant="outline" className="mb-2 bg-primary/10">
                  {category}
                </Badge>
                <div className="grid gap-2">
                  {categoryItems.map(item => (
                    <div
                      key={item.crop}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="font-medium">{item.crop}</span>
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <IndianRupee className="h-4 w-4" />
                        {item.msp.toLocaleString('en-IN')}
                        <span className="text-xs text-muted-foreground font-normal">/quintal</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredRates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No crops found matching "{searchTerm}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
