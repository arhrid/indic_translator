'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslation, languageOptions } from '@/hooks/use-translation';

// Simple UI components to avoid external dependencies
const Select = ({ value, onValueChange, children, ...props }: any) => (
  <select 
    value={value} 
    onChange={(e) => onValueChange(e.target.value)}
    className="w-48 p-2 border rounded-md bg-white dark:bg-gray-800"
    {...props}
  >
    {children}
  </select>
);

const Button = ({ children, ...props }: any) => (
  <button 
    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
    {...props}
  >
    {children}
  </button>
);

const Textarea = ({ className, ...props }: any) => (
  <textarea 
    className={`w-full p-2 border rounded-md min-h-[200px] ${className}`}
    {...props} 
  />
);

const Card = ({ children, className, ...props }: any) => (
  <div 
    className={`border rounded-lg p-6 shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className, ...props }: any) => (
  <div className="mb-4" {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className, ...props }: any) => (
  <h2 className="text-2xl font-bold text-center" {...props}>
    {children}
  </h2>
);

const CardContent = ({ children, className, ...props }: any) => (
  <div className="space-y-4" {...props}>
    {children}
  </div>
);

export function TranslationChat() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const { translate, isTranslating, error } = useTranslation();
  
  // Get language name by code
  const getLanguageName = (code: string) => {
    return languageOptions.find(lang => lang.value === code)?.label || code;
  };

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return;
    
    try {
      const result = await translate(sourceText, sourceLang as any, targetLang as any);
      setTranslatedText(result);
    } catch (err) {
      console.error('Translation error:', err);
      setTranslatedText('Error: Could not translate text');
    }
  }, [sourceText, sourceLang, targetLang, translate]);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  // Auto-translate when source text changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim()) {
        handleTranslate();
      } else {
        setTranslatedText('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [sourceText, handleTranslate]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bidirectional Indic Translator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-48">
                <label className="block text-sm font-medium mb-1">Source Language</label>
                <Select 
                  value={sourceLang} 
                  onValueChange={setSourceLang}
                  disabled={isTranslating}
                >
                  {languageOptions.map((lang) => (
                    <option key={`source-${lang.value}`} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </Select>
              </div>

              <button 
                onClick={handleSwapLanguages}
                disabled={isTranslating}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Swap languages"
              >
                ⇄
              </button>

              <div className="w-full md:w-48">
                <label className="block text-sm font-medium mb-1">Target Language</label>
                <Select 
                  value={targetLang} 
                  onValueChange={setTargetLang}
                  disabled={isTranslating}
                >
                  {languageOptions.map((lang) => (
                    <option key={`target-${lang.value}`} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Textarea
                  value={sourceText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSourceText(e.target.value)}
                  placeholder={`Enter text in ${getLanguageName(sourceLang)}`}
                  disabled={isTranslating}
                />
              </div>
              <div className="space-y-2">
                <Textarea
                  value={isTranslating ? 'Translating...' : translatedText}
                  readOnly
                  placeholder="Translation will appear here"
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <Button 
                onClick={handleTranslate} 
                disabled={!sourceText.trim() || isTranslating}
                className="w-full md:w-auto"
              >
                {isTranslating ? 'Translating...' : 'Translate'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Powered by TinyLlama running locally with Ollama</p>
        <p className="text-xs mt-1">First translation may take a moment as the model loads</p>
      </div>
    </div>
  );
}
