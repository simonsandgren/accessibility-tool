import type { Language } from './i18n';

export type Theme = 'system' | 'light' | 'dark';

// A single object under one storage key, so adding more settings later
// doesn't require a migration - missing fields just fall back to
// DEFAULT_SETTINGS.
export type Settings = {
  language: Language | 'auto';
  theme: Theme;
};

const DEFAULT_SETTINGS: Settings = { language: 'auto', theme: 'system' };
const STORAGE_KEY = 'settings';

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[STORAGE_KEY] as Partial<Settings> | undefined) };
}

export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...partial };
  await browser.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}
