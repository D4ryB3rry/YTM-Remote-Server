import { en } from './languages/en.js';
import { de } from './languages/de.js';
import { es } from './languages/es.js';
import type {
  SupportedLanguage,
  TranslationDictionary,
  TranslationValue,
} from './types.js';

const fallbackLanguage: SupportedLanguage = 'en';

const dictionaries: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  de,
  es,
};

let currentLanguage: SupportedLanguage = detectLanguage();

function detectLanguage(): SupportedLanguage {
  const preferences = [getStoredLanguage(), ...getNavigatorLanguages()];

  for (const preference of preferences) {
    const normalized = normalizeLanguage(preference);
    if (normalized) {
      return normalized;
    }
  }

  return fallbackLanguage;
}

function getStoredLanguage(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('ytm-language');
    }
  } catch (error) {
    console.warn('[i18n] Failed to read stored language preference:', error);
  }
  return null;
}

function getNavigatorLanguages(): string[] {
  if (typeof navigator === 'undefined') {
    return [];
  }

  const languages = navigator.languages && navigator.languages.length > 0
    ? Array.from(navigator.languages)
    : navigator.language
      ? [navigator.language]
      : [];

  return languages;
}

function normalizeLanguage(code: string | null | undefined): SupportedLanguage | null {
  if (!code) return null;
  const normalized = code.toLowerCase().split('-')[0];
  if (isSupportedLanguage(normalized)) {
    return normalized;
  }
  return null;
}

function isSupportedLanguage(language: string): language is SupportedLanguage {
  return language === 'en' || language === 'de' || language === 'es';
}

function getNestedValue(dictionary: TranslationDictionary, keyParts: string[]): TranslationValue | undefined {
  return keyParts.reduce<TranslationValue | undefined>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return current[part];
    }
    return undefined;
  }, dictionary);
}

function resolveTranslation(language: SupportedLanguage, key: string): string | undefined {
  const dictionary = dictionaries[language];
  const parts = key.split('.');
  const value = getNestedValue(dictionary, parts);

  if (typeof value === 'string') {
    return value;
  }

  return undefined;
}

function applyReplacements(template: string, replacements?: Record<string, string | number>): string {
  if (!replacements) {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (match, token) => {
    const key = token.trim();
    if (key in replacements) {
      return String(replacements[key]);
    }
    return match;
  });
}

export function t(key: string, replacements?: Record<string, string | number>): string {
  const template =
    resolveTranslation(currentLanguage, key) ??
    resolveTranslation(fallbackLanguage, key) ??
    key;

  return applyReplacements(template, replacements);
}

export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function setLanguage(language: SupportedLanguage): void {
  if (!isSupportedLanguage(language)) {
    console.warn('[i18n] Unsupported language:', language);
    return;
  }

  currentLanguage = language;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ytm-language', language);
    }
  } catch (error) {
    console.warn('[i18n] Failed to store language preference:', error);
  }

  applyTranslations();
}

export function applyTranslations(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.lang = currentLanguage;
  document.title = t('app.title');

  const textNodes = document.querySelectorAll<HTMLElement>('[data-i18n]');
  textNodes.forEach((element) => {
    const key = element.dataset.i18n;
    if (key) {
      element.textContent = t(key);
    }
  });

  const titleNodes = document.querySelectorAll<HTMLElement>('[data-i18n-title]');
  titleNodes.forEach((element) => {
    const key = element.dataset.i18nTitle;
    if (key) {
      element.setAttribute('title', t(key));
    }
  });

  const placeholderNodes = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    '[data-i18n-placeholder]'
  );
  placeholderNodes.forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (key) {
      element.placeholder = t(key);
    }
  });
}

// Apply translations on module load so static text updates immediately
applyTranslations();
