export type TranslationValue = string | TranslationDictionary;

export interface TranslationDictionary {
  [key: string]: TranslationValue;
}

export type SupportedLanguage = 'en' | 'de' | 'es';
