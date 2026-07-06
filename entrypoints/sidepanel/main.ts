import type { ContentMessage, ContentResponse } from '@/utils/messages';
import { t, tCount, setLanguageOverride } from '@/utils/i18n';
import { getSettings, updateSettings } from '@/utils/settings';

// Phosphor Icons "gear" and "x", regular weight - embedded inline so the
// panel never needs a runtime fetch (no external network calls allowed).
const GEAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M41.43,178.09A99.14,99.14,0,0,1,31.36,153.8l16.78-21a81.59,81.59,0,0,1,0-9.64l-16.77-21a99.43,99.43,0,0,1,10.05-24.3l26.71-3a81,81,0,0,1,6.81-6.81l3-26.7A99.14,99.14,0,0,1,102.2,31.36l21,16.78a81.59,81.59,0,0,1,9.64,0l21-16.77a99.43,99.43,0,0,1,24.3,10.05l3,26.71a81,81,0,0,1,6.81,6.81l26.7,3a99.14,99.14,0,0,1,10.07,24.29l-16.78,21a81.59,81.59,0,0,1,0,9.64l16.77,21a99.43,99.43,0,0,1-10,24.3l-26.71,3a81,81,0,0,1-6.81,6.81l-3,26.7a99.14,99.14,0,0,1-24.29,10.07l-21-16.78a81.59,81.59,0,0,1-9.64,0l-21,16.77a99.43,99.43,0,0,1-24.3-10l-3-26.71a81,81,0,0,1-6.81-6.81Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;
const X_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true"><rect width="256" height="256" fill="none"/><line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="200" y1="200" x2="56" y2="56" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;

const headingsToggle = document.querySelector<HTMLInputElement>('#toggle-headings')!;
const cssToggle = document.querySelector<HTMLInputElement>('#toggle-css')!;
const refreshButton = document.querySelector<HTMLButtonElement>('#refresh')!;
const statusEl = document.querySelector<HTMLParagraphElement>('#status')!;
const languageSelect = document.querySelector<HTMLSelectElement>('#language-select')!;
const settingsToggleButton = document.querySelector<HTMLButtonElement>('#settings-toggle')!;
const mainView = document.querySelector<HTMLElement>('#main-view')!;
const settingsView = document.querySelector<HTMLElement>('#settings-view')!;

let settingsOpen = false;

function renderSettingsToggleButton() {
  settingsToggleButton.innerHTML = settingsOpen ? X_ICON : GEAR_ICON;
  settingsToggleButton.setAttribute('aria-expanded', String(settingsOpen));
  settingsToggleButton.setAttribute('aria-label', t(settingsOpen ? 'closeSettingsLabel' : 'openSettingsLabel'));
}

function setSettingsOpen(next: boolean) {
  settingsOpen = next;
  mainView.hidden = settingsOpen;
  settingsView.hidden = !settingsOpen;
  renderSettingsToggleButton();
}

settingsToggleButton.addEventListener('click', () => setSettingsOpen(!settingsOpen));

function applyTranslations() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n!);
  });
  renderSettingsToggleButton();
}

async function initSettings() {
  const settings = await getSettings();
  languageSelect.value = settings.language;
  setLanguageOverride(settings.language);
  applyTranslations();
}

languageSelect.addEventListener('change', async () => {
  const language = languageSelect.value as 'auto' | 'en' | 'sv';
  await updateSettings({ language });
  setLanguageOverride(language);
  applyTranslations();
});

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

async function sendToContentScript(message: ContentMessage): Promise<ContentResponse | undefined> {
  const tabId = await getActiveTabId();
  if (tabId === undefined) {
    statusEl.textContent = t('statusNoActiveTab');
    return undefined;
  }
  try {
    return await browser.tabs.sendMessage(tabId, message);
  } catch {
    statusEl.textContent = t('statusUnreachable');
    return undefined;
  }
}

headingsToggle.addEventListener('change', async () => {
  const response = await sendToContentScript({ type: 'toggle-headings', enabled: headingsToggle.checked });
  if (response) {
    statusEl.textContent = headingsToggle.checked
      ? tCount('statusHeadingsShown', response.count)
      : t('statusHeadingsHidden');
  }
});

cssToggle.addEventListener('change', async () => {
  const response = await sendToContentScript({ type: 'toggle-css', enabled: cssToggle.checked });
  if (response) {
    statusEl.textContent = cssToggle.checked ? tCount('statusCssDisabled', response.count) : t('statusCssEnabled');
  }
});

refreshButton.addEventListener('click', async () => {
  const response = await sendToContentScript({ type: 'refresh' });
  if (response) {
    statusEl.textContent = tCount('statusRefreshed', response.count);
  }
});

initSettings();
