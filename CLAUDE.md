# CLAUDE.md

Chrome extension (Manifest V3) for manual accessibility audits. Full functional
requirements are in [REQUIREMENTS.md](REQUIREMENTS.md) — read that first for
scope, features, and the reasoning behind design decisions. This file covers
how to work in the codebase day to day.

## Tech stack

- **TypeScript** — the DOM traversal / Shadow DOM / MutationObserver logic has
  enough edge cases (nullable nodes, element vs. node types, tabindex parsing)
  that type checking is worth the setup cost.
- **WXT** (wxt.dev) — extension framework on top of Vite. Generates
  `manifest.json`, handles bundling/dev reload, TypeScript out of the box.
  Entrypoints (background, content script, panel) live under `entrypoints/`.
  Check `package.json` for the exact `dev`/`build` scripts once the project is
  scaffolded — don't assume script names without checking.
- **Vanilla DOM/HTML for the panel UI** — no React/Preact/Lit/etc. The panel
  must use real semantic elements (`<button>`, `<input>`, ...) and a framework
  adds an abstraction layer between the code and that markup for no real
  benefit at this UI's complexity (toggles + a few sliders).
- **No automated test suite.** This is a solo, professional-use tool —
  validation happens by manually testing against real pages during actual
  audits. Don't add test frameworks/config unasked.
- **Biome** for linting + formatting (one tool, one config, replaces
  ESLint + Prettier). Chosen over ESLint/Prettier because this is a solo
  project with no framework-specific plugin needs — one low-config tool beats
  maintaining two that can conflict with each other.

## Non-negotiable constraints (from REQUIREMENTS.md)

These are deliberate scope decisions, not oversights — don't "fix" them
without checking with the user first:

- **Exposure tool, not an assessment tool.** Never add logic that judges
  whether something is a WCAG violation or an "error" (e.g. "this image is
  missing required alt text"). Only expose structural facts (e.g. "this image
  has no alt attribute") and let the user judge.
- **`activeTab` permission only** — no broader `host_permissions`, no
  background execution on all sites.
- **iframes are out of scope for v1** — don't add cross-origin iframe
  traversal.
- **Shadow DOM: open roots only** — traverse and include open shadow roots in
  every exposure feature (alt text, headings, landmarks, ARIA, focus order).
  Closed shadow roots are inaccessible by design; don't try to work around
  that.
- **No external network calls** — everything runs locally in the browser.
- **No Chrome Web Store distribution in v1** — "Load unpacked" only. Don't
  add store-publishing tooling/config.

## Code conventions

- The panel itself must stay fully accessible: keyboard-navigable, correct
  semantics, visible focus indicator. Treat regressions here as bugs, not
  polish.
- Manipulation features (font size, line height, letter spacing, disabling
  page CSS) must verify the effect actually applied via `getComputedStyle()`
  and surface a visible warning in the panel — naming which/how many elements
  didn't update — when it didn't. Don't silently assume a style write
  succeeded.
- Update via `MutationObserver` for dynamic content, plus a manual refresh
  button as a fallback — both are required, not either/or.

## Development workflow

- Package manager: npm (default assumption — flag if the project ends up
  using something else).
- Build, then load unpacked from WXT's output directory (typically
  `.output/`) into Chrome for manual testing.
- No CI/build pipeline exists yet for this solo project — don't add one
  unasked.

## Commit shortcut

When I type exactly `commit`:

1. Always rerun these fresh — never rely on earlier output in the
   conversation:
   - `git status --short`
   - `git diff --cached --name-only`
2. If staged changes exist: run `git diff --cached` and base the suggestion
   solely on that diff.
3. If no staged changes but uncommitted changes exist: run `git diff` and
   base the suggestion on all uncommitted changes.
4. If there are no changes at all: reply that no commit suggestion can be
   generated.

**Format:**

- Subject line in imperative mood, prefixed with `type(scope):` or `type:`.
- Established types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`,
  `chore`. Scope is optional.
- Optional body with bullets — use as many as needed to make the commit
  understandable in hindsight, no more, no fewer. A small tweak often only
  needs a subject. Multiple files or mixed changes warrant bullets.
- Language: English.
- Reply with only the commit message, in a copy-pasteable code block.
