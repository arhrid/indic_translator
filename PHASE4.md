# Phase 4: Chat Interface Modification & Bilingual Support

## Overview

Phase 4 implements bilingual chat interface components and state management for seamless translation integration into the Vercel AI Chatbot framework.

**Status:** ✅ Complete  
**Components Created:** 4  
**Hooks Created:** 1  
**Context Providers:** 1

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chat Interface                        │
│  (Existing Vercel Chatbot UI)                           │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Language   │ │  Chat Msg    │ │  Chat Input  │
│  Selector    │ │  w/ Trans    │ │  w/ Trans    │
└──────────────┘ └──────────────┘ └──────────────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────▼────────────┐
        │   Chat Context          │
        │  (State Management)     │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  useTranslation Hook    │
        │  (API Integration)      │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  /api/translate         │
        │  (Backend Endpoint)     │
        └─────────────────────────┘
```

---

## Components Created

### 1. Language Selector Component
**File:** `components/language-selector.tsx`

**Features:**
- Dropdown with 23 languages (English + 22 Indic)
- Shows language names in English and native script
- LocalStorage persistence
- onChange callback
- Tailwind styling

**Usage:**
```typescript
import { LanguageSelector } from '@/components/language-selector';

export function MyComponent() {
  return (
    <LanguageSelector
      value="en"
      onChange={(lang) => console.log('Selected:', lang)}
      label="Select Language"
      storageKey="myLanguagePreference"
    />
  );
}
```

**Props:**
- `value?: LanguageCode` - Currently selected language
- `onChange?: (lang: LanguageCode) => void` - Change callback
- `label?: string` - Label text (default: "Language")
- `placeholder?: string` - Placeholder text
- `className?: string` - Additional CSS classes
- `storageKey?: string` - LocalStorage key (default: "selectedLanguage")

**Exports:**
- `LanguageSelector` - Main component
- `isValidLanguageCode()` - Validate language code
- `getLanguage()` - Get language by code
- `getSupportedLanguages()` - Get all languages
- `getLanguageCodeByName()` - Get code by name

---

### 2. Chat Message with Translation Component
**File:** `components/chat-message-with-translation.tsx`

**Features:**
- Display original message
- Translate button
- Show translated text
- Copy message button
- Speak message button (Web Speech API)
- Loading state during translation
- Error handling

**Usage:**
```typescript
import { ChatMessageWithTranslation } from '@/components/chat-message-with-translation';

export function ChatMessages() {
  const handleTranslate = async (messageId: string, targetLang: LanguageCode) => {
    const response = await fetch('/api/translate', {
      method: 'POST',
      body: JSON.stringify({
        text: messageContent,
        sourceLang: 'en',
        targetLang,
      }),
    });
    const data = await response.json();
    return data.data.translatedText;
  };

  return (
    <ChatMessageWithTranslation
      id="msg-1"
      role="assistant"
      content="Hello, how can I help you?"
      timestamp={new Date()}
      onTranslate={handleTranslate}
      targetLanguage="hi"
    />
  );
}
```

**Props:**
- `id: string` - Unique message ID
- `role: 'user' | 'assistant'` - Message sender
- `content: string` - Message text
- `timestamp?: Date` - Message timestamp
- `translation?: { text, targetLanguage, translatedAt }` - Existing translation
- `onTranslate?: (messageId, targetLang) => Promise<string>` - Translation callback
- `targetLanguage?: LanguageCode` - Target language for translation
- `className?: string` - Additional CSS classes

**Features:**
- Copy button (copies to clipboard)
- Speak button (uses Web Speech API)
- Translation caching
- Error display
- Loading indicator

---

### 3. Chat Context Provider
**File:** `lib/context/chat-context.tsx`

**Features:**
- Manages interface language preference
- Manages input language preference
- Translation caching
- Auto-translate settings
- Translation state tracking
- LocalStorage persistence

**Usage:**
```typescript
import { ChatProvider, useChatContext } from '@/lib/context/chat-context';

// Wrap your app
export function App() {
  return (
    <ChatProvider defaultInterfaceLanguage="en">
      <YourChatApp />
    </ChatProvider>
  );
}

// Use in components
export function LanguageSettings() {
  const {
    interfaceLanguage,
    setInterfaceLanguage,
    inputLanguage,
    setInputLanguage,
    autoTranslateResponses,
    setAutoTranslateResponses,
  } = useChatContext();

  return (
    <div>
      <select value={interfaceLanguage} onChange={(e) => setInterfaceLanguage(e.target.value)}>
        {/* Options */}
      </select>
    </div>
  );
}
```

**Context Properties:**
- `interfaceLanguage: LanguageCode` - UI language
- `setInterfaceLanguage(lang)` - Set UI language
- `inputLanguage: LanguageCode` - Input language
- `setInputLanguage(lang)` - Set input language
- `translationCache: Map<string, string>` - Translation cache
- `addTranslationToCache(key, translation)` - Add to cache
- `getTranslationFromCache(key)` - Get from cache
- `clearTranslationCache()` - Clear cache
- `isTranslating: Map<string, boolean>` - Translation states
- `setTranslating(messageId, isTranslating)` - Set translation state
- `autoTranslateResponses: boolean` - Auto-translate setting
- `setAutoTranslateResponses(auto)` - Set auto-translate
- `translateText(text, source, target)` - Translate via API

**LocalStorage Keys:**
- `interfaceLanguage` - Saved UI language
- `inputLanguage` - Saved input language
- `autoTranslateResponses` - Auto-translate preference

---

### 4. useTranslation Hook
**File:** `lib/hooks/use-translation.ts`

**Features:**
- Translation API integration
- Automatic caching
- Error handling
- Loading state
- Batch translation
- Callbacks (onSuccess, onError)

**Usage:**
```typescript
import { useTranslation } from '@/lib/hooks/use-translation';

export function TranslationComponent() {
  const {
    translate,
    translateBatch,
    isLoading,
    error,
    clearCache,
    getCached,
  } = useTranslation({
    onSuccess: (result) => console.log('Translated:', result),
    onError: (error) => console.error('Error:', error),
    cacheResults: true,
  });

  const handleTranslate = async () => {
    try {
      const result = await translate('Hello', 'en', 'hi');
      console.log(result.text); // Translation
      console.log(result.duration); // Time taken
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button onClick={handleTranslate} disabled={isLoading}>
      {isLoading ? 'Translating...' : 'Translate'}
    </button>
  );
}
```

**Hook Options:**
- `onSuccess?: (result) => void` - Success callback
- `onError?: (error) => void` - Error callback
- `cacheResults?: boolean` - Enable caching (default: true)

**Hook Returns:**
- `translate(text, sourceLang, targetLang)` - Translate single text
- `translateBatch(texts, sourceLang, targetLang)` - Translate multiple texts
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error state
- `clearCache()` - Clear translation cache
- `getCached(text, sourceLang, targetLang)` - Get cached translation
- `cacheSize: number` - Number of cached translations

---

## Integration Guide

### Step 1: Wrap App with ChatProvider

```typescript
// app/layout.tsx or root component
import { ChatProvider } from '@/lib/context/chat-context';

export default function RootLayout({ children }) {
  return (
    <ChatProvider defaultInterfaceLanguage="en">
      {children}
    </ChatProvider>
  );
}
```

### Step 2: Add Language Selector to UI

```typescript
// components/chat-header.tsx
import { LanguageSelector } from '@/components/language-selector';
import { useChatContext } from '@/lib/context/chat-context';

export function ChatHeader() {
  const { interfaceLanguage, setInterfaceLanguage } = useChatContext();

  return (
    <div className="flex justify-between items-center p-4">
      <h1>Chat</h1>
      <LanguageSelector
        value={interfaceLanguage}
        onChange={setInterfaceLanguage}
        label="Interface Language"
      />
    </div>
  );
}
```

### Step 3: Use Enhanced Chat Messages

```typescript
// components/chat-messages.tsx
import { ChatMessageWithTranslation } from '@/components/chat-message-with-translation';
import { useChatContext } from '@/lib/context/chat-context';

export function ChatMessages({ messages }) {
  const { interfaceLanguage, translateText } = useChatContext();

  const handleTranslate = async (messageId: string, targetLang: LanguageCode) => {
    const message = messages.find(m => m.id === messageId);
    return await translateText(message.content, 'en', targetLang);
  };

  return (
    <div>
      {messages.map(msg => (
        <ChatMessageWithTranslation
          key={msg.id}
          id={msg.id}
          role={msg.role}
          content={msg.content}
          timestamp={msg.timestamp}
          onTranslate={handleTranslate}
          targetLanguage={interfaceLanguage}
        />
      ))}
    </div>
  );
}
```

### Step 4: Auto-Translate Responses (Optional)

```typescript
// hooks/use-auto-translate.ts
import { useEffect } from 'react';
import { useChatContext } from '@/lib/context/chat-context';

export function useAutoTranslate(messages) {
  const { autoTranslateResponses, translateText, interfaceLanguage } = useChatContext();

  useEffect(() => {
    if (!autoTranslateResponses) return;

    // Auto-translate new assistant messages
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage?.content) {
      translateText(lastMessage.content, 'en', interfaceLanguage).catch(err => {
        console.error('Auto-translation failed:', err);
      });
    }
  }, [messages, autoTranslateResponses, translateText, interfaceLanguage]);
}
```

---

## Supported Languages

All 22 official Indian languages (8th Schedule) + English:

| Code | Language | Native Name |
|------|----------|------------|
| `en` | English | English |
| `hi` | Hindi | हिन्दी |
| `ta` | Tamil | தமிழ் |
| `te` | Telugu | తెలుగు |
| `kn` | Kannada | ಕನ್ನಡ |
| `ml` | Malayalam | മലയാളം |
| `mr` | Marathi | मराठी |
| `gu` | Gujarati | ગુજરાતી |
| `bn` | Bengali | বাংলা |
| `pa` | Punjabi | ਪੰਜਾਬੀ |
| `or` | Odia | ଓଡ଼ିଆ |
| `as` | Assamese | অসমীয়া |
| `ur` | Urdu | اردو |
| `sa` | Sanskrit | संस्कृतम् |
| `kok` | Konkani | कोंकणी |
| `mni` | Manipuri | ମଣିପୁରୀ |
| `mai` | Maithili | मैथिली |
| `sd` | Sindhi | سندھی |
| `ks` | Kashmiri | کٲشُر |
| `dg` | Dogri | डोगरी |
| `bodo` | Bodo | बड़ो |
| `sat` | Santali | ᱥᱟᱱᱛᱟᱲᱤ |

---

## Features

### Translation Caching
- Automatic caching of translations
- Reduces API calls
- Improves performance
- LocalStorage persistence option

### Error Handling
- Graceful error messages
- Retry mechanism
- User-friendly error display
- Console logging for debugging

### Accessibility
- Web Speech API support
- Copy to clipboard
- Keyboard navigation
- ARIA labels

### Performance
- Lazy loading of components
- Efficient state management
- Optimized re-renders
- Batch translation support

---

## Styling

All components use Tailwind CSS and are compatible with:
- Light/Dark mode
- Responsive design
- Custom themes
- Existing Vercel UI components

---

## Testing

Components are designed to work with the existing test suite:
- Unit tests for hooks
- Integration tests for components
- Mock API responses
- Accessibility testing

---

## Future Enhancements

1. **Language Detection**
   - Auto-detect input language
   - Suggest translations

2. **Translation Quality**
   - Confidence scoring
   - Alternative translations
   - User feedback

3. **Performance**
   - Service Worker caching
   - Offline support
   - Batch API optimization

4. **Analytics**
   - Track translation usage
   - Monitor performance
   - User preferences

---

## Troubleshooting

### Translations Not Showing
- Verify API endpoint is working
- Check browser console for errors
- Ensure language codes are valid

### Cache Not Working
- Check localStorage is enabled
- Verify cache key format
- Clear cache manually

### Web Speech Not Working
- Check browser support
- Verify language locale is correct
- Check microphone permissions

---

## References

- [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Context API](https://react.dev/reference/react/useContext)

---

**Status:** ✅ Phase 4 Complete  
**Components:** 4  
**Hooks:** 1  
**Context Providers:** 1  
**Total Lines:** 1,000+
