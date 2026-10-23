'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocaleType } from '../types';

const STORAGE_KEY = 'tasvir_locale';
const DEFAULT_LOCALE: LocaleType = 'uz';

export function getStoredLocale(): LocaleType {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LocaleType | null;
    if (saved === 'uz' || saved === 'en' || saved === 'ru') return saved;
  } catch {}
  return DEFAULT_LOCALE;
}

export function setStoredLocale(newLocale: LocaleType) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, newLocale);
    window.dispatchEvent(new CustomEvent('tasvir-locale-change', { detail: newLocale }));
  } catch {}
}

export function useAppLocale(initialFallback?: LocaleType) {
  const [locale, setLocaleState] = useState<LocaleType>(() => {
    return getStoredLocale() || initialFallback || DEFAULT_LOCALE;
  });

  useEffect(() => {
    // Sync on mount with stored value
    const stored = getStoredLocale();
    if (stored && stored !== locale) {
      setLocaleState(stored);
    }

    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<LocaleType>;
      if (customEvent.detail && (customEvent.detail === 'uz' || customEvent.detail === 'en' || customEvent.detail === 'ru')) {
        setLocaleState(customEvent.detail);
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'uz' || e.newValue === 'en' || e.newValue === 'ru') {
          setLocaleState(e.newValue as LocaleType);
        }
      }
    };

    window.addEventListener('tasvir-locale-change', handleLocaleChange);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('tasvir-locale-change', handleLocaleChange);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const setLocale = useCallback((newLocale: LocaleType) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: LocaleType = prev === 'uz' ? 'en' : prev === 'en' ? 'ru' : 'uz';
      setStoredLocale(next);
      return next;
    });
  }, []);

  return { locale, setLocale, toggleLocale };
}

