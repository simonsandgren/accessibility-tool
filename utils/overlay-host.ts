// Single shared shadow-DOM root that every exposure feature renders its
// visuals into, instead of each feature creating its own host element. Keeps
// z-index/layering consistent when multiple features are visible at once.

let host: HTMLElement | null = null;
let shadow: ShadowRoot | null = null;
const layers = new Map<string, HTMLElement>();
const addedStyleIds = new Set<string>();

function ensureHost(): ShadowRoot {
  if (shadow) return shadow;
  host = document.createElement('div');
  host.id = 'a11y-audit-overlay-root';
  shadow = host.attachShadow({ mode: 'open' });
  document.documentElement.appendChild(host);
  return shadow;
}

/** Get (creating if needed) this feature's own container inside the shared overlay host. */
export function getOverlayLayer(id: string): HTMLElement {
  const root = ensureHost();
  let layer = layers.get(id);
  if (!layer) {
    layer = document.createElement('div');
    layer.dataset.layer = id;
    root.appendChild(layer);
    layers.set(id, layer);
  }
  return layer;
}

export function removeOverlayLayer(id: string) {
  layers.get(id)?.remove();
  layers.delete(id);
  if (layers.size === 0) {
    host?.remove();
    host = null;
    shadow = null;
    addedStyleIds.clear();
  }
}

/** Add a <style> block to the shared host once per `id`, regardless of how many times it's called. */
export function addOverlayStyle(id: string, css: string) {
  if (addedStyleIds.has(id)) return;
  addedStyleIds.add(id);
  const root = ensureHost();
  const style = document.createElement('style');
  style.textContent = css;
  root.prepend(style);
}
