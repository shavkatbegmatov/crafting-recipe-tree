import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import uz from './locales/uz.json'
import uzCyr from './locales/uz-cyr.json'
import ru from './locales/ru.json'
import en from './locales/en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      'uz-cyr': { translation: uzCyr },
      ru: { translation: ru },
      en: { translation: en },
    },
    fallbackLng: 'uz',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n

export const LANGUAGES = [
  { code: 'uz', label: 'UZ', name: "O'zbekcha" },
  { code: 'uz-cyr', label: 'УЗ', name: 'Ўзбекча' },
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'en', label: 'EN', name: 'English' },
]
