import { create } from 'zustand';
import i18n from '@/i18n/i18n';

export type Language = 'en' | 'zh';

interface LanguageStore {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  currentLanguage: (i18n.locale as Language) || 'en',
  setLanguage: (lang: Language) => {
    i18n.locale = lang;
    set({ currentLanguage: lang });
  },
}));
