import { i18n } from '@/i18n';
import type { SupportedLanguage } from '@/i18n';

export function useLang(): SupportedLanguage {
  return i18n.language.startsWith('ru') ? 'ru' : 'en';
}
