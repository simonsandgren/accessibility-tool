import { queryAllDeep } from '../dom';
import { getOverlayLayer, removeOverlayLayer, addOverlayStyle } from '../overlay-host';
import { registerRescan, unregisterRescan, registerReposition, unregisterReposition } from '../overlay-watcher';

const LAYER_ID = 'headings';
const BADGE_CLASS = 'a11y-audit-heading-badge';

let enabled = false;
let pairs: Array<{ el: HTMLElement; badge: HTMLDivElement }> = [];

function levelOf(el: HTMLElement): number {
  return Number(el.tagName.slice(1));
}

function render() {
  const layer = getOverlayLayer(LAYER_ID);
  layer.innerHTML = '';
  const headings = queryAllDeep<HTMLElement>(document, 'h1, h2, h3, h4, h5, h6');
  pairs = headings.map((el) => {
    const badge = document.createElement('div');
    badge.className = BADGE_CLASS;
    badge.textContent = `H${levelOf(el)}`;
    layer.appendChild(badge);
    return { el, badge };
  });
  reposition();
}

function reposition() {
  for (const { el, badge } of pairs) {
    const rect = el.getBoundingClientRect();
    badge.style.top = `${rect.top}px`;
    badge.style.left = `${rect.left}px`;
  }
}

export function enableHeadings(): number {
  if (!enabled) {
    enabled = true;
    addOverlayStyle(
      LAYER_ID,
      `
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
      `,
    );
    render();
    registerRescan(render);
    registerReposition(reposition);
  }
  return pairs.length;
}

export function disableHeadings(): number {
  if (enabled) {
    enabled = false;
    unregisterRescan(render);
    unregisterReposition(reposition);
    removeOverlayLayer(LAYER_ID);
    pairs = [];
  }
  return 0;
}

export function refreshHeadings(): number {
  if (enabled) render();
  return pairs.length;
}
