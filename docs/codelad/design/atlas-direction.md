# Atlas first semantic surface

The user resumed work on 2026-10-31 and selected Atlas code graph. This extends the established Quiet Shell / Graphite world in `DESIGN.md`. Mode: Operate. The existing design docs pin a real graph as a first-class workbench surface alongside actual source, real typed relationships, progressive expansion, filtering, a minimap and keyboard parity. This is code-led and uses native application captures, with no generated comp or new visual identity.

## First viewport and interaction

Open Atlas from the current source symbol. The editor area becomes a bounded, navigable map with a stable selected symbol, callers on the left and callees on the right. Every edge comes from the installed language provider's call hierarchy. A compact inspection area exposes actual source location and actions, not invented metrics. Source opens alongside the map through the normal editor service. Context changes continue to share real editor groups.

The signature interaction is progressive expansion: select a symbol, inspect its provider provenance, expand its callers/callees, then open its real source beside the map. Keep selection visible, retain a genuine viewport minimap, and expose equivalent keyboard controls. Graph search filters actual loaded data; no background repository crawl occurs. Bounds and truncated results are disclosed. Respect theme tokens, high contrast and reduced motion; use opaque reading surfaces and no decorative motion.

## Data and limits

Start with actual call relationships from existing language services, including languages whose installed providers support the same API. Unsupported providers, no symbol at the caret, no calls, errors, cancellation, stale source and graph limits need explicit states. Preserve provider sessions and cancel/dispose work with the editor. Changes reported by existing SCM may mark a file; this is not a hunk index or an assertion of test status. No new account, network dependency or telemetry is added; third-party provider behavior retains the existing privacy boundary.

This milestone does not claim repository-wide completeness, static-import/type/test edges, execution flow or the full Scrollspace canvas. A provider-backed call graph is the first inspectable Atlas relationship type. Verify real TypeScript cross-file calls, source navigation and ordinary editor continuity, expansion/deduplication/cycles/bounds, filtering, cancellation/unsupported states, keyboard flow, narrow layout, high contrast and restore behavior. Keep remaining privacy checks documented.
