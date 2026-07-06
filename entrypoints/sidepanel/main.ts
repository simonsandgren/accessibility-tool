import type { ContentMessage, ContentResponse } from '@/utils/messages';
import { t, tCount, setLanguageOverride } from '@/utils/i18n';
import { getSettings, updateSettings } from '@/utils/settings';

const headingsToggle = document.querySelector<HTMLInputElement>('#toggle-headings')!;
const cssToggle = document.querySelector<HTMLInputElement>('#toggle-css')!;
const refreshButton = document.querySelector<HTMLButtonElement>('#refresh')!;
const statusEl = document.querySelector<HTMLParagraphElement>('#status')!;
const languageSelect = document.querySelector<HTMLSelectElement>('#language-select')!;

function applyTranslations() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n!);
  });
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
