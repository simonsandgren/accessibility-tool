import { collectShadowRoots } from '../dom';
import { registerRescan, unregisterRescan } from '../overlay-watcher';

let disabled = false;

function collectStyleSheets(): CSSStyleSheet[] {
  const sheets = Array.from(document.styleSheets) as CSSStyleSheet[];
  for (const root of collectShadowRoots(document)) {
    sheets.push(...(Array.from(root.styleSheets) as CSSStyleSheet[]));
  }
  return sheets;
}

function apply() {
  for (const sheet of collectStyleSheets()) {
    sheet.disabled = disabled;
  }
}

export function setPageCssDisabled(next: boolean): number {
  if (disabled !== next) {
    disabled = next;
    apply();
    if (disabled) registerRescan(apply);
    else unregisterRescan(apply);
  }
  return collectStyleSheets().length;
}
