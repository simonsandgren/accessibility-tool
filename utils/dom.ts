export function collectShadowRoots(root: ParentNode): ShadowRoot[] {
  const roots: ShadowRoot[] = [];
  for (const el of root.querySelectorAll<HTMLElement>('*')) {
    if (el.shadowRoot) {
      roots.push(el.shadowRoot);
      roots.push(...collectShadowRoots(el.shadowRoot));
    }
  }
  return roots;
}

/** Elements matching `selector`, including inside open shadow roots. */
export function queryAllDeep<E extends Element = Element>(root: ParentNode, selector: string): E[] {
  const found = Array.from(root.querySelectorAll<E>(selector));
  for (const shadowRoot of collectShadowRoots(root)) {
    found.push(...Array.from(shadowRoot.querySelectorAll<E>(selector)));
  }
  return found;
}
