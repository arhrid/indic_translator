/**
 * Chat Message Component with Translation Support
 * Displays messages with optional translation capability
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Volume2 } from 'lucide-react';
import { LanguageCode } from './language-selector';

export interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  translation?: {
    text: string;
    targetLanguage: LanguageCode;
    translatedAt: Date;
  };
  onTranslate?: (messageId: string, targetLanguage: LanguageCode) => Promise<string>;
  targetLanguage?: LanguageCode;
  className?: string;
}

/**
 * ChatMessageWithTranslation Component
 * 
 * Displays a chat message with:
 * - Original message text
 * - Translate button
 * - Translated text (when available)
 * - Copy and speak buttons
 */
export function ChatMessageWithTranslation({
  id,
  role,
  content,
  timestamp,
  translation,
  onTranslate,
  targetLanguage = 'en',
  className = '',
}: ChatMessageProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(!!translation);
  const [currentTranslation, setCurrentTranslation] = useState(translation);
  const [error, setError] = useState<string | null>(null);

  // Handle translation request
  const handleTranslate = useCallback(async () => {
    if (!onTranslate || !targetLanguage) return;

    setIsTranslating(true);
    setError(null);

    try {
      const translatedText = await onTranslate(id, targetLanguage);
      setCurrentTranslation({
        text: translatedText,
        targetLanguage,
        translatedAt: new Date(),
      });
      setShowTranslation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  }, [id, onTranslate, targetLanguage]);

  // Copy text to clipboard
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Copy failed:', err);
    });
  }, []);

  // Speak text using Web Speech API
  const handleSpeak = useCallback((text: string, lang: LanguageCode = 'en') => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageLocale(lang);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }, []);

  const isUser = role === 'user';
  const bgColor = isUser ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800';
  const textColor = isUser ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${bgColor} rounded-lg p-4 ${textColor}`}>
        {/* Original Message */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm leading-relaxed break-words">{content}</p>
            
            {timestamp && (
              <p className="text-xs opacity-70 mt-1">
                {timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 ml-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCopy(content)}
              title="Copy message"
              className="h-6 w-6 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSpeak(content, 'en')}
              title="Speak message"
              className="h-6 w-6 p-0"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Translation Section */}
        {onTranslate && targetLanguage && (
          <div className="mt-3 pt-3 border-t border-current border-opacity-20">
            {!showTranslation ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="w-full text-xs"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Translating...
                  </>
                ) : (
                  `Translate to ${getLanguageName(targetLanguage)}`
                )}
              </Button>
            ) : currentTranslation ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold opacity-70">
                  {getLanguageName(currentTranslation.targetLanguage)}:
                </p>
                <p className="text-sm leading-relaxed break-words">
                  {currentTranslation.text}
                </p>

                {/* Translation Action Buttons */}
                <div className="flex gap-1 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(currentTranslation.text)}
                    title="Copy translation"
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSpeak(currentTranslation.text, currentTranslation.targetLanguage)}
                    title="Speak translation"
                    className="h-6 w-6 p-0"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowTranslation(false)}
                    className="ml-auto text-xs"
                  >
                    Hide
                  </Button>
                </div>
              </div>
            ) : null}

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Error: {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get language name by code
 */
function getLanguageName(code: LanguageCode): string {
  const languages: Record<LanguageCode, string> = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    kn: 'Kannada',
    ml: 'Malayalam',
    mr: 'Marathi',
    gu: 'Gujarati',
    bn: 'Bengali',
    pa: 'Punjabi',
    or: 'Odia',
    as: 'Assamese',
    ur: 'Urdu',
    sa: 'Sanskrit',
    kok: 'Konkani',
    mni: 'Manipuri',
    mai: 'Maithili',
    sd: 'Sindhi',
    ks: 'Kashmiri',
    dg: 'Dogri',
    bodo: 'Bodo',
    sat: 'Santali',
  };

  return languages[code] || code;
}

/**
 * Get language locale for Web Speech API
 */
function getLanguageLocale(code: LanguageCode): string {
  const locales: Record<LanguageCode, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    bn: 'bn-IN',
    pa: 'pa-IN',
    or: 'or-IN',
    as: 'as-IN',
    ur: 'ur-IN',
    sa: 'sa-IN',
    kok: 'kok-IN',
    mni: 'mni-IN',
    mai: 'mai-IN',
    sd: 'sd-IN',
    ks: 'ks-IN',
    dg: 'dg-IN',
    bodo: 'bodo-IN',
    sat: 'sat-IN',
  };

  return locales[code] || 'en-US';
}

export default ChatMessageWithTranslation;
