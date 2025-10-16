/**
 * Language Selector Component
 * Displays a dropdown with 23 languages (English + 22 Indic)
 * Shows language names in both English and native script
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type LanguageCode =
  | 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'mr' | 'gu' | 'bn' | 'pa'
  | 'or' | 'as' | 'ur' | 'sa' | 'kok' | 'mni' | 'mai' | 'sd' | 'ks' | 'dg'
  | 'bodo' | 'sat';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

interface LanguageSelectorProps {
  value?: LanguageCode;
  onChange?: (languageCode: LanguageCode) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  storageKey?: string;
}

// All supported languages
const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'mni', name: 'Manipuri', nativeName: 'ମଣିପୁରୀ' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سندھی' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر' },
  { code: 'dg', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'bodo', name: 'Bodo', nativeName: 'बड़ो' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
];

/**
 * LanguageSelector Component
 * 
 * @param value - Currently selected language code
 * @param onChange - Callback when language is changed
 * @param label - Optional label text
 * @param placeholder - Placeholder text
 * @param className - Additional CSS classes
 * @param storageKey - LocalStorage key for persistence (default: 'selectedLanguage')
 */
export function LanguageSelector({
  value,
  onChange,
  label = 'Language',
  placeholder = 'Select a language',
  className = '',
  storageKey = 'selectedLanguage',
}: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | undefined>(value);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    if (!value && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored && isValidLanguageCode(stored)) {
        setSelectedLanguage(stored as LanguageCode);
      } else {
        setSelectedLanguage('en');
      }
    }
  }, [value, storageKey]);

  // Handle language change
  const handleChange = (newLanguage: string) => {
    if (isValidLanguageCode(newLanguage)) {
      const languageCode = newLanguage as LanguageCode;
      setSelectedLanguage(languageCode);
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, languageCode);
      }
      
      // Call onChange callback
      onChange?.(languageCode);
    }
  };

  // Get language display text
  const getLanguageDisplay = (code: LanguageCode | undefined) => {
    if (!code) return placeholder;
    const lang = LANGUAGES.find(l => l.code === code);
    return lang ? `${lang.name} (${lang.nativeName})` : placeholder;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <Select value={selectedLanguage || 'en'} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        
        <SelectContent className="max-h-96">
          {LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <span className="flex items-center gap-2">
                <span>{language.name}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  ({language.nativeName})
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Validate if a string is a valid language code
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return LANGUAGES.some(lang => lang.code === code);
}

/**
 * Get language by code
 */
export function getLanguage(code: LanguageCode): Language | undefined {
  return LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Language[] {
  return [...LANGUAGES];
}

/**
 * Get language code by name
 */
export function getLanguageCodeByName(name: string): LanguageCode | undefined {
  const lang = LANGUAGES.find(l => l.name.toLowerCase() === name.toLowerCase());
  return lang?.code;
}

export default LanguageSelector;
