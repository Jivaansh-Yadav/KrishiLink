import React, { createContext, useContext, useState, ReactNode } from 'react';
import { languages } from '@/data/indianStates';
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  translate: (text: string) => Promise<string>;
  languages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const translate = async (text: string): Promise<string> => {
    if (currentLanguage === 'en') return text;

    try {
      const targetLanguage =
        languages.find((l) => l.code === currentLanguage)?.name || 'Hindi';

      const { data, error } = await supabase.functions.invoke('ai', {
        body: { mode: 'translate', text, targetLanguage },
      });

      if (error) throw error;
      return (data as any)?.content || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
  };

  const value = {
    currentLanguage,
    setLanguage,
    translate,
    languages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
