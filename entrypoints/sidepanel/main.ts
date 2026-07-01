type ContentMessage =
  | { type: 'toggle-headings'; enabled: boolean }
  | { type: 'toggle-css'; enabled: boolean }
  | { type: 'refresh' };
type ContentResponse = { count: number };

const headingsToggle = document.querySelector<HTMLInputElement>('#toggle-headings')!;
const cssToggle = document.querySelector<HTMLInputElement>('#toggle-css')!;
const refreshButton = document.querySelector<HTMLButtonElement>('#refresh')!;
const statusEl = document.querySelector<HTMLParagraphElement>('#status')!;

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

async function sendToContentScript(message: ContentMessage): Promise<ContentResponse | undefined> {
  const tabId = await getActiveTabId();
  if (tabId === undefined) {
    statusEl.textContent = 'No active tab found.';
    return undefined;
  }
  try {
    return await browser.tabs.sendMessage(tabId, message);
  } catch {
    statusEl.textContent = 'Could not reach this page. Click the extension icon again to re-activate it.';
    return undefined;
  }
}

headingsToggle.addEventListener('change', async () => {
  const response = await sendToContentScript({ type: 'toggle-headings', enabled: headingsToggle.checked });
  if (response) {
    statusEl.textContent = headingsToggle.checked
      ? `Showing ${response.count} heading${response.count === 1 ? '' : 's'}.`
      : 'Heading levels hidden.';
  }
});

cssToggle.addEventListener('change', async () => {
  const response = await sendToContentScript({ type: 'toggle-css', enabled: cssToggle.checked });
  if (response) {
    statusEl.textContent = cssToggle.checked
      ? `Page CSS disabled (${response.count} stylesheet${response.count === 1 ? '' : 's'}).`
      : 'Page CSS re-enabled.';
  }
});

refreshButton.addEventListener('click', async () => {
  const response = await sendToContentScript({ type: 'refresh' });
  if (response) {
    statusEl.textContent = `Refreshed: ${response.count} heading${response.count === 1 ? '' : 's'} found.`;
  }
});
