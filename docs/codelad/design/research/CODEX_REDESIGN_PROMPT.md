# CODEX TASK: codeLad workbench redesign, evidence-driven

Read `RESEARCH_AND_DESIGN_BRIEF.md` and `reference_catalog.json` before proposing UI architecture. Reuse their verified source links for research and their proposed layout/visual tokens as **initial hypotheses**, not immutable requirements.

## Product foundation, non-negotiable

1. First-class integrated Git with local changes, history, hunks, branches, conflict handling, push/pull, clear error paths.
2. Obsidian-like project graph backed by real parsed code relationships, with navigation and useful filters/minimap.
3. Beautiful, readable editor/terminal/file exploration; preserve native VS Code capabilities and performance.
4. Native, integrated developer tools, including configured tasks, tests, API, database, Docker, environment handling and debug.
5. Clickable controls for routine commands, with keyboard parity, real terminal output and project-configured commands only.
6. No unexpected first-party telemetry; retain open-source constraints and audit network effects separately.
7. Kitty-inspired window transparency **only where native OS/compositor support exists**; graceful solid fallback.

## Interaction concept to implement first

Create a prototype for the **Quiet Shell + Scrollspace + Atlas** synthesis:
- Editor is the stable primary surface.
- Other surfaces can be tiled, pinned, summoned or scrolled through as contexts.
- Graph becomes one first-class surface, not a decorative sidebar.
- Git state remains visible in a small HUD; full review is summoned or pinned.
- Routine dev tools appear through one action capsule and palette; terminal is one key away.
- Store layouts at workspace scope and restore their state.
- No permanent 10-tool sidebar + giant task grid as a default.

Start by surveying the checkout's VS Code workbench layout services, panels, editor groups, SCM, testing, task provider, extension host, Electron window architecture and relevant keyboard settings. Do not replace these with a custom web dashboard or take over the editor engine.

Deliver a plan, an actual runnable small-scope prototype, before/after screenshots, performance observations, keyboard map, and known limitations. Do not claim test or native-blur support without running the checks on that platform. If unsupported, state exactly what was not verified.

## Visual directions to render as real screenshots, not AI drawings

A. Quiet Shell: graphite/ice glass, maximum editor, compact HUD and summonable context capsule.
B. Scrollspace: horizontally browsable context strip, adjacent Graph/Code/Review/Operations compositions.
C. Atlas: graph-first explore state with semantic edges, code selected in a side surface, hunk marks on nodes.
D. Monolith: opaque BSPWM/DWM sharp high-density layout with one command strip and visible shortcuts.

Create each in the real application, with *identical sample project* so they can be compared for task completion rather than scenery. Do not alter product features based solely on screenshot appeal.

## Acceptance tests

- Keyboard-only path works for file open, graph, Git review, task run, terminal, pane focus/resize and escape.
- Graph nodes and edges are real, typed, filterable and bounded on large repos.
- Git stage/hunk/commit/push actions correctly call the existing Git integration and report errors.
- Dev, build and test actions are discovered from actual project tasks, with command details accessible.
- Standard VS Code extension host, debugger, themes, terminals and language features still operate.
- Theme has accessible contrast, solid/no-blur settings and reduced-motion support.
- Workbench remains usable at 1080p and 1440p, including narrow laptop windows.

Prefer small reviewable changes. Document implementation, changed files, screenshots, deviations and risk in `docs/codeLad/STATUS.md`.
