# Current project instructions

The current implementation is V30. See docs/v30/analysis-plan.md and docs/v30/acceptance.md for its scope and limitations. Historical snapshots were removed at the user's request on 2026-09-18.

- Preserve Chinese ink / wuxia art direction, original prose, readable text and layered imagery. Do not describe 2.5D relief or shader deformation as full character animation or physical fluid simulation.
- Keep independent click-navigated routes #/, #/jianlu, #/jianghu, navigation history, search, reader and bookmarks.
- Mouse wheel controls bounded sword zoom only in sword inspection. Do not intercept Ctrl/Meta browser zoom.
- Preserve motion pause, reduced-motion preferences, background suspension, keyboard alternatives and rendering fallbacks. Camera gestures remain optional and explicitly enabled.
- JournalWorld is the current journal featured scene. Preserve three themes, correct story links, shared wind response, interrupted transition handling and static fallback.
- Older version suffixes in imported code, cumulative CSS and referenced assets do not mean obsolete versions. Audit runtime, generated paths, fallback imports and regression tests before deleting files.
- Preserve original references, font licenses and necessary tooling. Retain regression tests even when named after earlier versions.
- Implement UI in src/. Preserve .openai/hosting.json, worker/index.js, scripts/prepare-sites-build.mjs and tests/sites-worker.test.mjs.
- Verify with npm run build and node --test tests/*.test.mjs. Build must create dist/client/index.html, dist/server/index.js and dist/.openai/hosting.json.
- Run the local preview when needed. Report actual checks and remaining limitations, without claiming unperformed validation.
