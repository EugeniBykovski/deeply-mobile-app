import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import enCommon from './locales/en/common.json';
import enOnboarding from './locales/en/onboarding.json';
import enAuth from './locales/en/auth.json';
import enTabs from './locales/en/tabs.json';

import ruCommon from './locales/ru/common.json';
import ruOnboarding from './locales/ru/onboarding.json';
import ruAuth from './locales/ru/auth.json';
import ruTabs from './locales/ru/tabs.json';

export const SUPPORTED_LANGUAGES = ['en', 'ru'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const defaultLanguage: SupportedLanguage = deviceLocale.startsWith('ru')
  ? 'ru'
  : 'en';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: defaultLanguage,
  fallbackLng: 'en',
  resources: {
    en: {
      common: enCommon,
      onboarding: enOnboarding,
      auth: enAuth,
      tabs: enTabs,
    },
    ru: {
      common: ruCommon,
      onboarding: ruOnboarding,
      auth: ruAuth,
      tabs: ruTabs,
    },
  },
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
export default i18n;
