import type { ContentMessage, ContentResponse } from '@/utils/messages';
import { enableHeadings, disableHeadings, refreshHeadings } from '@/utils/features/headings';
import { setPageCssDisabled } from '@/utils/features/page-css';

export default defineContentScript({
  registration: 'runtime',
  // Empty on purpose: with registration: 'runtime', a non-empty `matches`
  // gets added to the manifest's host_permissions, which would silently
  // grant this extension access to every site - defeating the activeTab-only
  // permission model. Injection happens exclusively via
  // browser.scripting.executeScript, scoped by activeTab at click time.
  matches: [],
  main() {
    // executeScript re-runs this file on every icon click; guard against
    // double-initialization if the tab was already instrumented.
    if ((window as any).__a11yAuditToolInjected) return;
    (window as any).__a11yAuditToolInjected = true;

    browser.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
      let response: ContentResponse;
      switch (message.type) {
        case 'toggle-headings':
          response = { count: message.enabled ? enableHeadings() : disableHeadings() };
          break;
        case 'refresh':
          response = { count: refreshHeadings() };
          break;
        case 'toggle-css':
          response = { count: setPageCssDisabled(message.enabled) };
          break;
      }
      sendResponse(response);
    });
  },
});
