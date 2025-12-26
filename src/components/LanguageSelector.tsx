import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, languages } = useLanguage();

  return (
    <Select value={currentLanguage} onValueChange={setLanguage}>
      <SelectTrigger className="w-auto min-w-[140px] border-border/50 bg-transparent">
        <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              {lang.nativeName} <span className="text-muted-foreground text-xs">({lang.name})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
