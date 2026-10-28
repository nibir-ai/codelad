# CODEX MASTER PROMPT: Codelad from the VS Code OSS fork

You are working in my existing fork of the open-source `microsoft/vscode` source repository. Your job is to incrementally transform it into **Codelad**, a polished, privacy-respecting, entirely open-source developer workspace. Do not replace it with a web mockup, Electron boilerplate, a React replica, or a lightweight Monaco-only editor.

**REFERENCE IMAGE:** `docs/codelad/reference/codelad-target.png` (or locate the included `reference/codelad-target.png` if the package was copied elsewhere). Treat this as a visual target for layout hierarchy and atmosphere, not as a bitmap to embed. Inspect the reference visually before implementing UI.

**PRIMARY GOALS, ORDERED:**
1. Codelad itself collects and sends no telemetry; no Microsoft proprietary service is required to use it.
2. Real desktop-native glass material comparable in spirit to Kitty: OS/compositor-backed transparency + blur when supported, honest fallbacks otherwise.
3. Source-aware Obsidian-like codebase graph and beautiful, usable file tree + editor + terminal.
4. First-class Git workflow integrated into editing: diff, stage hunks, commit, branch, merge/rebase/conflicts, push/pull, history.
5. One workspace for developer tools: tasks, API client, database tools, containers, environment management, tests, debugging.
6. Replace common shell chores with real, discoverable, safe actions; keep full terminal functionality.

## Working rules

- **Start with Phase 0 and Phase 1 only in the first execution.** Do not touch the UI before delivering a functioning privacy-clean development build. Stop after Phase 1 and produce evidence.
- Check the actual Git state, branch, recent commits, dependency versions, build scripts, target OS, and source tree; do not assume file paths or APIs match a particular VS Code release.
- Do not alter user files or uncommitted changes. Make small, logically scoped changes on a feature branch and keep the fork easy to rebase against upstream.
- Use native VS Code contributions/services and existing SCM/tasks/debug/terminal/workbench abstractions. Prefer composition and a small Codelad patch surface over invasive rewrites.
- No external telemetry, analytics, beacons, experiment-assignment network calls, hidden crash submission, or tracking IDs anywhere in Codelad's own processes, including build/release helpers.
- Do not disable all networking. User-initiated Git, extension search, API calls, language-server downloads, updates from an explicitly configured OSS channel, and similar functions must be classified separately.
- Do not make claims of zero telemetry without a repeatable verification report and limitations disclosure.
- Treat extensions as untrusted third-party code; explain clearly that installing extensions may introduce their own network requests and data collection.
- Never silently execute unknown project scripts. Respect Workspace Trust and require confirmation for untrusted/destructive actions.
- No fake functional features, demo data in production UI, hidden iframe website pretending to be an editor, or irreversible changes just to match a screenshot.
- Implement accessibility, resizing, DPI scaling, keyboard navigation, reduced motion, theme integration and clear fallbacks as first-class requirements.
- Preserve all mandatory third-party notices, MIT license obligations, and brand separation from Microsoft. Do not use Microsoft-owned trademarks or restricted marketplace endpoints as Codelad defaults.

## Phase 0: Inventory and baseline

A. Record source revision, current operating system(s), Electron version, VS Code version, product configuration, extension gallery, build variants, user data directory naming, and all built-in extensions.
B. Identify relevant entrypoints for the product metadata, analytics/telemetry services, crash reporting, experiment service, network requests, Electron window creation, workbench HTML/CSS, shell layout, file explorer, SCM, integrated terminal, tasks and extensions.
C. Build and launch the existing OSS fork **before** modification; note existing failures instead of guessing.
D. Create `docs/codelad/architecture-inventory.md`, `docs/codelad/baseline-build.md`, and a short risk table. Confirm the reference image is accessible.

## Phase 1: Privacy and independent OSS distribution (DO THIS FIRST)

1. Audit `product.json` and the final packaged product configuration. Remove or leave absent Microsoft-specific telemetry keys/endpoints, proprietary experiment endpoints, crash-upload endpoints, unwanted recommendation endpoints, restricted gallery integration, and unnecessary cloud-service bindings. Do not assume absence in source guarantees absence in a generated release.
2. Audit actual services and their callers: usage/error/crash telemetry, experiment/assignment clients, issue reporting, feedback/survey entrypoints, feature recommendations, update checks, online search or language-service helpers, remote/tunnel/authentication services, build diagnostics, installer and updater behavior. Classify each network pathway: **required local**, **user initiated**, **optional external**, **background non-telemetry**, **telemetry**, or **unknown**. Remove/disable telemetry and unsolicited experimentation. Route expected internal telemetry-service interfaces to safe no-op implementations where deleting them would break subsystems.
3. The effective setting for Codelad-owned telemetry should be permanently off, not merely default-off with a user-toggle that re-enables it. Preserve compatibility with VS Code consumers expecting an `ITelemetryService` or similar abstraction. Do not claim to control arbitrary installed extensions.
4. Explicitly disable Electron/Chromium automatic crash submission and any updater crash telemetry unless a reviewed local-only diagnostic mechanism is used. Keep local logs for user debugging, but scrub secrets and do not transmit them.
5. Rename product metadata and packaging to Codelad: display name, app IDs, application data directories, executable/CLI name, URLs, icons and protocols wherever needed. Make migration of existing data opt-in and reversible. Ensure official VS Code installation can coexist without profile collisions.
6. Use Open VSX as the default extension source (after confirming currently supported API/configuration). Allow explicit user-selected VSIX installation. Do not default to or proxy Microsoft's extension marketplace; avoid bundling proprietary extensions. Audit built-in extensions for compatibility, license and independent network calls.
7. Preserve the fork's MIT copyright notices and third-party OSS notices, and generate a distribution compliance inventory. Keep code and packaging buildable without account sign-in.
8. Create a repeatable network-audit harness/recipe for a fresh profile, normal launch, open project, edit, Git diff, terminal, tasks, extension browsing, restart and shutdown. Compare outbound traffic against an allowlist per user action. In the baseline test, disable extensions and auto-updates, and ensure no Codelad-owned telemetry requests leave the process. Separately test with sample extensions and clearly label third-party traffic.
9. Document outbound service inventory, offline behavior, default update policy, threat model, and residual limitations. No secret API keys or credentials in telemetry reports.
10. Build and smoke test after each scoped modification. Do not strip internal observability useful for diagnostics if it never transmits data.

**Phase 1 acceptance:** Working Codelad-branded OSS build. No Microsoft marketplace as default. No Codelad-owned telemetry observed in documented fresh-profile test. VS Code editing, file operations, terminal, Git, extensions (Open VSX), debugging and basic tasks still function. Audit/reproduction details included. Summarize exactly what was removed, what stayed, and why. Then STOP and request review in the Codex session before starting Phase 2.

## Phase 2: Native glass proof of concept (AFTER PHASE 1)

Read `DESIGN_AND_GLASS_SPEC.md` in full. Inspect the platform's current Electron implementation rather than blindly copying external snippets. Prove desktop material rendering in a minimal **real Codelad window** without impacting the editor services.

- Windows 11 supported builds: test Electron system background materials, especially `acrylic` versus `mica`, and actual transparent/frameless behavior. Know that Mica is generally an opaque tinted material, not necessarily see-through frost. Test live desktop content through the window, draggable title bar, Windows controls, snapping, maximize, resize and multi-monitor/DPI.
- macOS: test `vibrancy` and backdrop modes, toolbar/titlebar integration, native controls, window activation and resize.
- Linux: test actual Wayland and X11 compositors where accessible. Blur behind an Electron window is compositor dependent; implement transparent surfaces with compositor blur when genuinely available, fallback to a solid theme when absent. Do not promise universal Hyprland/KWin/GNOME parity.
- Do not treat CSS `filter: blur()` or `backdrop-filter` as a substitute for blurring other desktop windows. Use `backdrop-filter` only to blur material inside Codelad's renderer, or where explicitly measured and correct.
- Do not enable transparent mode if it breaks resize/maximize/window controls on supported target systems. A fully working opaque window is preferable to a beautiful broken transparent one.
- Provide settings for `Codelad: Window Material` (`auto`, `solid`, `translucent`, `native-acrylic`/`native-vibrancy` as supported), `Window Opacity`, `Panel Opacity`, `Reduce Transparency`, and `Reduce Motion`; available options must depend on platform capabilities.
- Test native glass with a changing wallpaper/video behind the window to rule out fake screenshot backgrounds.
- Avoid layering many GPU-expensive blur filters, prevent scrollbar/text ghosting, and establish performance budgets.

**Phase 2 acceptance:** Show side-by-side screenshots or a short screen recording demonstrating desktop content behind a **moving** Codelad window, different wallpapers/background apps, fallback to opaque, intact resizing and fully readable text. Document support matrix per OS, version and compositor, plus known limitations.

## Phase 3: Codelad workbench shell (AFTER GLASS POC)

Build the reference image's information architecture, not a new separate app. Keep the existing editor engine, language support, extension host, command/keybinding system, themes, terminal rendering, debugging and workspace model.

**Screenshot-defined arrangement at desktop widths:**
- Top: slim translucent title/command strip with Codelad branding, global search/commands, branch context and window controls.
- Far left: vertically stacked section switcher (Graph, Files, Git, Terminal, Tasks, API, DB, Docker, Envs, Tests) with stable icons/labels and keyboard equivalents.
- Left workspace: large **graph-first** navigation area, with pan, zoom, clickable source graph nodes, code/folder/dependency filters and graph minimap only when useful.
- Center: readable, dark, prominent real VS Code editor with compact tabs/breadcrumbs, syntax highlighting, diagnostics and existing editor interactions. Do not make code transparent enough for a wallpaper to compete with glyphs.
- Right: first-class Git working-set panel (staging, commit, sync and vertical history) and contextual branch/PR details.
- Lower left/center: integrated actual terminal with direct task buttons and outputs, ability to resize and maximize.
- Lower right: one-click task launcher with derived scripts and active-run status; tools accessible by swappable surfaces, not everything visible permanently.

**Layout behavior:** Collapsible/resizable, user-customizable, keyboard-controlled, persistent per workspace, no compulsory permanently open panel. Responsive to laptop widths; on small screens collapse graph and tools into switchable panes and prioritize code. Avoid fixed-size mockup rectangles. No feature buried behind fake controls.

## Phase 4: Actual codebase graph

- Graph edges are backed by real imports, references, symbols, components or user-linked notes; never fabricated by layout code.
- Start with JS/TS: parse imports and symbols with existing VS Code/language-service APIs where feasible; maintain incremental indexing and handle renames/deletions.
- Clicking a node opens source or symbol at the correct position. Hover shows path, type, references, Git status, and search matches. Support incoming/outgoing dependency toggles and depth 1/2/3.
- Nodes can represent files, folders, symbols and modules (filter by level). Support focus mode, grouping/clustering and deterministic layouts for large repositories. Filter hidden/generated folders intelligently, respecting Git ignore and workspace settings.
- Large codebases must remain responsive: virtualize/render incrementally, debounce updates and limit visible nodes by meaningful filters.
- Provide an explicit graph fallback for unsupported languages with reliable file-to-file references where available. No invented semantic edges.
- Integrate graph and Git: changed-file highlights, dependent impact visualization, and direct diff/navigation.

## Phase 5: Git and version control as core navigation

- Reuse native VS Code SCM/Git integration; make actual stage/unstage file and hunk, diffs, commit, amend, branch checkout/new branch, stash, fetch, pull, push and conflict resolution accessible in Codelad's shell.
- Preserve safe warnings and confirmations for force push, reset, clean, discard, checkout with uncommitted changes, and other destructive operations.
- Git history is a navigable timeline; graph nodes can display current changes. Keep keyboard workflows complete.
- Sync is not a magical always-on background push. Explicitly show remote, incoming/outgoing commits and what action will occur.

## Phase 6: Integrated dev tools and click-first workflows

- Build a stable 'Action Registry': actions have labels, CLI command preview, provenance, working directory, required permissions, arguments, state, cancellation, output and safe error handling. Detect scripts from real `package.json`, `tasks.json`, Makefile, Python project metadata and Docker Compose configurations. Never assume every repo is Node.
- Route action executions through the existing VS Code tasks/terminal APIs. Running an action has visible, inspectable shell command, output, exit status and cancel/retry controls.
- API client: workspace-local request collections, environments, headers, body, auth handled securely; preserve and reuse request definitions. Do not send to external analytics.
- Database: start by integrating existing OSS tools/adapters rather than inventing a database protocol. Read-only defaults for destructive queries, safe credential storage, clear connection status.
- Containers: detect available Docker/Podman and Compose services; list status, logs, ports, start/stop/restart with command previews and confirmations as appropriate.
- Environments: inspect `.env` keys with automatic masking. NEVER automatically reveal or persist secrets in plaintext logs or graph metadata. No accidental commit of secrets.
- Tests/debugging: reuse existing VS Code test explorer/debug models and show recent results linked to files and graph nodes.
- AI not required. No provider keys, accounts, mandatory logins or cloud dependence.

## Deliverables after EVERY phase

1. Working source changes, with a short changelog and list of changed files.
2. Build/test commands actually executed with exact result; identify tests skipped.
3. Screenshots of the real Codelad process (not a generated concept image).
4. Tests/regression checklist against baseline VS Code features.
5. A concise `docs/codelad/phase-N-report.md` with decisions, limitations and next steps.
6. Before proceeding, show evidence the phase's acceptance criteria passed. Never claim success if only a mockup was completed.

**BEGIN NOW WITH PHASE 0 AND PHASE 1 ONLY.**
