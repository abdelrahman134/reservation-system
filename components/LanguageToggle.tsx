'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
      title="Switch Language / تغيير اللغة"
    >
      <Languages className="w-4 h-4 text-blue-600" />
      <span>{language === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}
