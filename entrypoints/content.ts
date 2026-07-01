type ContentMessage =
  | { type: 'toggle-headings'; enabled: boolean }
  | { type: 'toggle-css'; enabled: boolean }
  | { type: 'refresh' };

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

    const BADGE_CLASS = 'a11y-audit-heading-badge';

    let enabled = false;
    let overlayHost: HTMLElement | null = null;
    let badgeContainer: HTMLDivElement | null = null;
    let pairs: Array<{ el: HTMLElement; badge: HTMLDivElement }> = [];
    const mutationObservers: MutationObserver[] = [];
    const observedRoots = new Set<Node>();
    let rescanScheduled = false;

    function collectHeadings(root: ParentNode): HTMLElement[] {
      const headings = Array.from(root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'));
      for (const el of root.querySelectorAll<HTMLElement>('*')) {
        if (el.shadowRoot) headings.push(...collectHeadings(el.shadowRoot));
      }
      return headings;
    }

    function collectShadowRoots(root: ParentNode): ShadowRoot[] {
      const roots: ShadowRoot[] = [];
      for (const el of root.querySelectorAll<HTMLElement>('*')) {
        if (el.shadowRoot) {
          roots.push(el.shadowRoot);
          roots.push(...collectShadowRoots(el.shadowRoot));
        }
      }
      return roots;
    }

    function levelOf(el: HTMLElement): number {
      return Number(el.tagName.slice(1));
    }

    function ensureOverlay() {
      if (overlayHost) return;
      overlayHost = document.createElement('div');
      overlayHost.id = 'a11y-audit-overlay-root';
      const shadow = overlayHost.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `
        .${BADGE_CLASS} {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 2147483647;
          background: #7c3aed;
          color: #fff;
          font: bold 11px/1.4 system-ui, sans-serif;
          padding: 1px 5px;
          border-radius: 3px;
          pointer-events: none;
          transform: translateY(-100%);
        }
      `;
      badgeContainer = document.createElement('div');
      shadow.append(style, badgeContainer);
      document.documentElement.appendChild(overlayHost);
    }

    function removeOverlay() {
      overlayHost?.remove();
      overlayHost = null;
      badgeContainer = null;
      pairs = [];
    }

    function renderBadges() {
      if (!badgeContainer) return;
      const headings = collectHeadings(document);
      badgeContainer.innerHTML = '';
      pairs = headings.map((el) => {
        const badge = document.createElement('div');
        badge.className = BADGE_CLASS;
        badge.textContent = `H${levelOf(el)}`;
        badgeContainer!.appendChild(badge);
        return { el, badge };
      });
      positionBadges();
    }

    function positionBadges() {
      for (const { el, badge } of pairs) {
        const rect = el.getBoundingClientRect();
        badge.style.top = `${rect.top}px`;
        badge.style.left = `${rect.left}px`;
      }
    }

    function attachObserver(root: Node) {
      if (observedRoots.has(root)) return;
      observedRoots.add(root);
      const obs = new MutationObserver(() => scheduleRescan());
      obs.observe(root, { childList: true, subtree: true });
      mutationObservers.push(obs);
    }

    function attachAllObservers() {
      attachObserver(document.body);
      for (const root of collectShadowRoots(document)) attachObserver(root);
    }

    function disconnectAllObservers() {
      for (const obs of mutationObservers) obs.disconnect();
      mutationObservers.length = 0;
      observedRoots.clear();
    }

    function scheduleRescan() {
      if (!enabled || rescanScheduled) return;
      rescanScheduled = true;
      requestAnimationFrame(() => {
        rescanScheduled = false;
        renderBadges();
        attachAllObservers();
      });
    }

    function onScrollOrResize() {
      if (enabled) positionBadges();
    }

    function enable() {
      if (enabled) return;
      enabled = true;
      ensureOverlay();
      renderBadges();
      attachAllObservers();
      window.addEventListener('scroll', onScrollOrResize, { capture: true, passive: true });
      window.addEventListener('resize', onScrollOrResize, { passive: true });
    }

    function disable() {
      if (!enabled) return;
      enabled = false;
      disconnectAllObservers();
      removeOverlay();
      window.removeEventListener('scroll', onScrollOrResize, { capture: true });
      window.removeEventListener('resize', onScrollOrResize);
    }

    let pageCssDisabled = false;
    let cssMutationObserver: MutationObserver | null = null;

    function collectStyleSheets(root: Document | ShadowRoot): CSSStyleSheet[] {
      const sheets = Array.from(root.styleSheets) as CSSStyleSheet[];
      for (const el of root.querySelectorAll<HTMLElement>('*')) {
        if (el.shadowRoot) sheets.push(...collectStyleSheets(el.shadowRoot));
      }
      return sheets;
    }

    function applyPageCssDisabled() {
      for (const sheet of collectStyleSheets(document)) {
        sheet.disabled = pageCssDisabled;
      }
    }

    function setPageCssDisabled(next: boolean) {
      if (pageCssDisabled === next) return;
      pageCssDisabled = next;
      applyPageCssDisabled();
      if (pageCssDisabled) {
        // Re-apply to stylesheets added after the toggle (SPA navigation, etc.)
        cssMutationObserver = new MutationObserver(() => applyPageCssDisabled());
        cssMutationObserver.observe(document.documentElement, { childList: true, subtree: true });
      } else {
        cssMutationObserver?.disconnect();
        cssMutationObserver = null;
      }
    }

    browser.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
      if (message.type === 'toggle-headings') {
        if (message.enabled) enable();
        else disable();
        sendResponse({ count: pairs.length });
      } else if (message.type === 'toggle-css') {
        setPageCssDisabled(message.enabled);
        sendResponse({ count: collectStyleSheets(document).length });
      } else if (message.type === 'refresh') {
        if (enabled) renderBadges();
        sendResponse({ count: pairs.length });
      }
    });
  },
});
