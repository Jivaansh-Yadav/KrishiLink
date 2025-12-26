import React, { createContext, useContext, useState, ReactNode } from 'react';
import { languages } from '@/data/indianStates';

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

const GEMINI_API_KEY = 'AIzaSyAaLMiiX484qSbgmI06i-W4UKW4TaM3LNU';

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const translate = async (text: string): Promise<string> => {
    if (currentLanguage === 'en') return text;
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Translate the following text to ${languages.find(l => l.code === currentLanguage)?.name || 'Hindi'}. Only return the translated text, nothing else:\n\n${text}`
              }]
            }]
          }),
        }
      );

      if (!response.ok) {
        console.error('Translation API error:', response.status);
        return text;
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || text;
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
