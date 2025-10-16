/**
 * Chat Context for Bilingual State Management
 * Manages language preferences and translation state
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LanguageCode } from '@/components/language-selector';

export interface ChatContextType {
  // Language preferences
  interfaceLanguage: LanguageCode;
  setInterfaceLanguage: (lang: LanguageCode) => void;
  
  // Input language
  inputLanguage: LanguageCode;
  setInputLanguage: (lang: LanguageCode) => void;
  
  // Translation cache
  translationCache: Map<string, string>;
  addTranslationToCache: (key: string, translation: string) => void;
  getTranslationFromCache: (key: string) => string | undefined;
  clearTranslationCache: () => void;
  
  // Translation state
  isTranslating: Map<string, boolean>;
  setTranslating: (messageId: string, isTranslating: boolean) => void;
  
  // Auto-translate settings
  autoTranslateResponses: boolean;
  setAutoTranslateResponses: (auto: boolean) => void;
  
  // Translate function
  translateText: (text: string, sourceLang: LanguageCode, targetLang: LanguageCode) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
  defaultInterfaceLanguage?: LanguageCode;
  defaultInputLanguage?: LanguageCode;
}

/**
 * ChatProvider Component
 * Provides bilingual chat context to child components
 */
export function ChatProvider({
  children,
  defaultInterfaceLanguage = 'en',
  defaultInputLanguage = 'en',
}: ChatProviderProps) {
  const [interfaceLanguage, setInterfaceLanguage] = useState<LanguageCode>(defaultInterfaceLanguage);
  const [inputLanguage, setInputLanguage] = useState<LanguageCode>(defaultInputLanguage);
  const [translationCache, setTranslationCache] = useState<Map<string, string>>(new Map());
  const [isTranslating, setIsTranslatingState] = useState<Map<string, boolean>>(new Map());
  const [autoTranslateResponses, setAutoTranslateResponses] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInterfaceLanguage = localStorage.getItem('interfaceLanguage') as LanguageCode;
      const savedInputLanguage = localStorage.getItem('inputLanguage') as LanguageCode;
      const savedAutoTranslate = localStorage.getItem('autoTranslateResponses') === 'true';

      if (savedInterfaceLanguage) setInterfaceLanguage(savedInterfaceLanguage);
      if (savedInputLanguage) setInputLanguage(savedInputLanguage);
      setAutoTranslateResponses(savedAutoTranslate);
    }
  }, []);

  // Save interface language to localStorage
  const handleSetInterfaceLanguage = useCallback((lang: LanguageCode) => {
    setInterfaceLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('interfaceLanguage', lang);
    }
  }, []);

  // Save input language to localStorage
  const handleSetInputLanguage = useCallback((lang: LanguageCode) => {
    setInputLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('inputLanguage', lang);
    }
  }, []);

  // Save auto-translate preference to localStorage
  const handleSetAutoTranslateResponses = useCallback((auto: boolean) => {
    setAutoTranslateResponses(auto);
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoTranslateResponses', auto.toString());
    }
  }, []);

  // Add translation to cache
  const addTranslationToCache = useCallback((key: string, translation: string) => {
    setTranslationCache(prev => new Map(prev).set(key, translation));
  }, []);

  // Get translation from cache
  const getTranslationFromCache = useCallback((key: string) => {
    return translationCache.get(key);
  }, [translationCache]);

  // Clear translation cache
  const clearTranslationCache = useCallback(() => {
    setTranslationCache(new Map());
  }, []);

  // Set translating state
  const setTranslating = useCallback((messageId: string, isTranslating: boolean) => {
    setIsTranslatingState(prev => {
      const newMap = new Map(prev);
      if (isTranslating) {
        newMap.set(messageId, true);
      } else {
        newMap.delete(messageId);
      }
      return newMap;
    });
  }, []);

  // Translate text via API
  const translateText = useCallback(
    async (text: string, sourceLang: LanguageCode, targetLang: LanguageCode): Promise<string> => {
      // Create cache key
      const cacheKey = `${text}|${sourceLang}|${targetLang}`;

      // Check cache first
      const cached = getTranslationFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            sourceLang,
            targetLang,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Translation failed');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error?.message || 'Translation failed');
        }

        const translatedText = data.data.translatedText;

        // Cache the translation
        addTranslationToCache(cacheKey, translatedText);

        return translatedText;
      } catch (error) {
        console.error('Translation error:', error);
        throw error;
      }
    },
    [getTranslationFromCache, addTranslationToCache]
  );

  const value: ChatContextType = {
    interfaceLanguage,
    setInterfaceLanguage: handleSetInterfaceLanguage,
    inputLanguage,
    setInputLanguage: handleSetInputLanguage,
    translationCache,
    addTranslationToCache,
    getTranslationFromCache,
    clearTranslationCache,
    isTranslating,
    setTranslating,
    autoTranslateResponses,
    setAutoTranslateResponses: handleSetAutoTranslateResponses,
    translateText,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook to use chat context
 */
export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}

export default ChatProvider;
