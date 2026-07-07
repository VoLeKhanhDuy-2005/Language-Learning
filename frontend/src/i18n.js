import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import translationVI from './locales/vi.json'
import translationEN from './locales/en.json'

const resources = {
  vi: {
    translation: translationVI
  },
  en: {
    translation: translationEN
  }
}

// Lấy ngôn ngữ đã lưu hoặc mặc định là tiếng Việt
const savedLanguage = localStorage.getItem('lng') || 'vi'

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  })

localStorage.setItem('lng', i18n.language)

export default i18n
