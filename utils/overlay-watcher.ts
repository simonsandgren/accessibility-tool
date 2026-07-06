import { collectShadowRoots } from './dom';

// One shared MutationObserver set + one scroll/resize listener pair for the
// whole page, regardless of how many exposure/manipulation features are
// active. Avoids each feature setting up its own observers, which would not
// scale on pages with heavy DOM activity (see REQUIREMENTS.md performance
// requirement).

type Callback = () => void;

const rescanCallbacks = new Set<Callback>();
const repositionCallbacks = new Set<Callback>();
const observedRoots = new Set<Node>();
const mutationObservers: MutationObserver[] = [];
let rescanScheduled = false;
let listenersAttached = false;

function observeRoot(root: Node) {
  if (observedRoots.has(root)) return;
  observedRoots.add(root);
  const observer = new MutationObserver(() => scheduleRescan());
  observer.observe(root, { childList: true, subtree: true });
  mutationObservers.push(observer);
}

function watchAllShadowRoots() {
  observeRoot(document.body);
  for (const root of collectShadowRoots(document)) observeRoot(root);
}

function scheduleRescan() {
  if (rescanScheduled) return;
  rescanScheduled = true;
  requestAnimationFrame(() => {
    rescanScheduled = false;
    for (const cb of rescanCallbacks) cb();
    watchAllShadowRoots(); // pick up shadow roots created by the mutation
  });
}

function onScrollOrResize() {
  for (const cb of repositionCallbacks) cb();
}

function ensureActive() {
  if (listenersAttached) return;
  listenersAttached = true;
  watchAllShadowRoots();
  window.addEventListener('scroll', onScrollOrResize, { capture: true, passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
}

function teardownIfIdle() {
  if (rescanCallbacks.size > 0 || repositionCallbacks.size > 0) return;
  listenersAttached = false;
  for (const observer of mutationObservers) observer.disconnect();
  mutationObservers.length = 0;
  observedRoots.clear();
  window.removeEventListener('scroll', onScrollOrResize, { capture: true });
  window.removeEventListener('resize', onScrollOrResize);
}

/** Call `cb` whenever the DOM changes in a way that might affect overlays. */
export function registerRescan(cb: Callback) {
  rescanCallbacks.add(cb);
  ensureActive();
}

export function unregisterRescan(cb: Callback) {
  rescanCallbacks.delete(cb);
  teardownIfIdle();
}

/** Call `cb` on scroll/resize, to reposition already-rendered overlays. */
export function registerReposition(cb: Callback) {
  repositionCallbacks.add(cb);
  ensureActive();
}

export function unregisterReposition(cb: Callback) {
  repositionCallbacks.delete(cb);
  teardownIfIdle();
}
