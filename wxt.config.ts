import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'Accessibility Audit Panel',
    description: 'Manual accessibility audit tool: exposes structural info and lets you manipulate page presentation for WCAG testing.',
    permissions: ['activeTab', 'sidePanel', 'scripting', 'storage'],
    // No popup entrypoint exists - we rely on browser.action.onClicked
    // firing to open the side panel. Without this, chrome.action is
    // undefined at runtime (manifest has no "action" key at all).
    action: {},
  },
});
