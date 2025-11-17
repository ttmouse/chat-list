# Repository Guidelines

## Project Structure & Module Organization
Source files live at the repository root for quick iteration. `manifest.json` declares permissions and entry points. `content.js` coordinates runtime behavior, delegating focused features to the `modules/` directory (e.g., `group-management.js`, `input-manager.js`, `data-import-export.js`). UI assets sit in `styles/`, `content.css`, and `popup.html`, while shared helpers are in `utils.js` and `preview-module.js`. Icons required by the Chrome Web Store live under `icons/`. Keep new modules self-contained and registered via `modules/module-loader.js` to avoid wiring code inside `content.js`.

## Build, Test, and Development Commands
- `npx web-ext run --target=chromium --source-dir .` launches the extension in a temporary Chromium profile for quick manual QA.
- `npx web-ext lint --source-dir .` validates the manifest and flags common MV3 issues before publishing.
- `zip -r dist/chat-list.zip *` packages the current workspace for upload; exclude editor junk by running from a clean tree.
Reloading via `chrome://extensions` remains the fallback if `web-ext` is unavailable.

## Coding Style & Naming Conventions
JavaScript uses ES2020 syntax, 2-space indentation, trailing semicolons, and single quotes for strings. File names employ kebab-case (`input-detector.js`) and should reflect the module’s responsibility. Prefer small classes or plain objects that expose explicit methods rather than ad-hoc global functions. Document non-obvious logic with concise inline comments; keep user-facing text and existing Chinese copy consistent.

## Testing Guidelines
The project currently relies on manual verification. Before submitting changes, run `npx web-ext lint` and exercise the core flows: load the assistant on a blank form page, add/edit/delete a script, switch groups, import/export data, and confirm keyboard shortcuts still work. If a bug fix is complex, describe reproduction steps and expected results in your PR so reviewers can mirror your test pass.

## Commit & Pull Request Guidelines
Follow the conventional commit style observed in history (`feat:`, `fix:`, `feat(script): …`). Keep messages concise and written in the imperative mood. PRs should include: a summary of the change, linked issue or context, screenshots or screen recordings for UI updates, and a short testing checklist (e.g., “web-ext lint”, “manual Chrome reload”). Highlight any follow-up tasks so they can be tracked explicitly.

## Security & Configuration Tips
Avoid introducing secrets or remote network calls; all data must stay in Chrome Storage. When adding permissions, justify them in the PR description and update `manifest.json` comments so reviewers understand the scope. Preserve compatibility with Chromium-based browsers by testing against the default permission set.
