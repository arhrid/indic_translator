import { TranslationChat } from '@/components/translation-chat';

export default function TranslationPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-6xl">
        <TranslationChat />
      </div>
    </main>
  );
}
