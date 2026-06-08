import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('krishilink:lang') || 'en';
  });

  useEffect(() => {
    try { localStorage.setItem('krishilink:lang', currentLanguage); } catch {}
  }, [currentLanguage]);

  const translate = async (text: string): Promise<string> => {
    if (currentLanguage === 'en') return text;

    try {
      const { data, error } = await supabase.functions.invoke('bhashini-transliterate', {
        body: {
          text,
          sourceLanguage: 'en',
          targetLanguage: currentLanguage,
          isSentence: true,
          numSuggestions: 1,
        },
      });
      if (error) throw error;
      return (data as any)?.output || text;
    } catch (error) {
      console.error('Transliteration error:', error);
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
