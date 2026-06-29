/** Persisted UI language preference, shared across the app. */
export const LANG_STORAGE_KEY = 'ai_lang';

const SUPPORTED = ['en', 'fr', 'es', 'it'];

/** Returns the stored language if it is one we support, otherwise null. */
export function storedLang(): string | null {
  try {
    const value = localStorage.getItem(LANG_STORAGE_KEY);
    return value && SUPPORTED.includes(value) ? value : null;
  } catch {
    return null;
  }
}

/** Persists the chosen language. */
export function persistLang(code: string): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, code);
  } catch {
    /* storage unavailable — non-fatal */
  }
}
