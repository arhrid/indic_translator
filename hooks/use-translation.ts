import { useState, useCallback } from 'react';

type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'gu' | 'mr' | 'pa' | 'or' | 'as' | 'sa';

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (text: string, sourceLang: LanguageCode, targetLang: LanguageCode): Promise<string> => {
    if (!text.trim()) return '';
    
    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch('/api/local-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      return data.data.translatedText || text;
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation failed. Please try again.');
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { translate, isTranslating, error };
};

export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी (Hindi)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'ml', label: 'മലയാളം (Malayalam)' },
  { value: 'bn', label: 'বাংলা (Bengali)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
  { value: 'as', label: 'অসমীয়া (Assamese)' },
  { value: 'sa', label: 'संस्कृत (Sanskrit)' },
];
