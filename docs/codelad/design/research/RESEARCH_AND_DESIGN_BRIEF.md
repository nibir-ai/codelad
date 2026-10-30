# codeLad: r/unixporn design field research

**Evidence cut-off:** 29 October 2026 · **Scope:** qualitative, non-random sample of 45+ r/unixporn references, plus upstream implementation repositories and VS Code docs. **Purpose:** redesign the VS Code OSS fork into a visually distinctive, keyboard-native, glass-capable development environment with first-class Git, codebase graph, and one-click developer workflows.

> **Important:** This is a purposive inspiration catalog, not a statistical survey of the subreddit. Reddit votes, screenshots, and authors' self-reported performance figures should not be treated as product-performance measurements. Artwork belongs to its respective creators. Study layout ideas; do not copy assets, CSS, or third-party code without examining licenses.

## Decision in one paragraph

Do **not** build a VS Code fork with a prettier sidebar. Make codeLad a **contextual, tiling development environment**. The editor is the stable center. Git, graph, terminal, tests, API, database and containers are reusable work surfaces that can be *summoned, pinned, expanded, floated, tiled or scrolled* according to the current task. A single minimal HUD and a powerful action launcher provide persistent visibility of the project without permanently displaying every tool. The glass design applies to the window chrome and secondary surfaces; the code reading area stays substantially more opaque. The shell's compact, calm look is a deliberate difference from maximalist or neon-themed rices.

## Ten findings from the subreddit

1. **Quickshell made the status bar programmable.** Several authors turned a static bar into a complete interaction surface containing launchers, context popups, clipboard, controls and notifications. The best idea isn't the visual island itself but consistent interaction patterns across different tools. References: [SwayFX: simplified shell](https://www.reddit.com/r/unixporn/comments/1x2k5av/), [Bar became shell](https://www.reddit.com/r/unixporn/comments/1vlxzu4/), [Odyssey contextual shell](https://www.reddit.com/r/unixporn/comments/1wax008/).
2. **Hidden until needed is compatible with instant access.** Context popup and accordion bar users leave the screen quiet while retaining one-key workflows. Reference: [Niri hidden capsule](https://www.reddit.com/r/unixporn/comments/1wg0oc4/).
3. **Scrollable tiling is an unexplored IDE pattern.** Niri's horizontal working set suggests switching among *adjacent task contexts* instead of accumulating tabs. References: [Niri/Noctalia](https://www.reddit.com/r/unixporn/comments/1wtkorx/), [Niri minimal](https://www.reddit.com/r/unixporn/comments/1ua5q8r/). Technical background: https://wiki.archlinux.org/title/Niri.
4. **Strong visual identity can be monochrome.** DWM, BSPWM, Sway and AwesomeWM setups use precise typography, minimal status text and consistent borders, not necessarily blur. References: [DWM zero-effects](https://www.reddit.com/r/unixporn/comments/1u13u2e/), [AwesomeWM bitmap](https://www.reddit.com/r/unixporn/comments/1xcpmm2/), [BSPWM black/white](https://www.reddit.com/r/unixporn/comments/1oadthr/).
5. **One design language matters more than individual widgets.** In one experimental WM, the launcher, clipboard, fonts and power menu all use the same bar geometry. Reference: [vxwm bar-centric](https://www.reddit.com/r/unixporn/comments/1usv4xs/).
6. **Glass needs a limit.** Some users openly complain about excessive blur. For codeLad, readable text must be the absolute priority. References: [Niri eye candy discussion](https://www.reddit.com/r/unixporn/comments/1w0jh4s/), [frosted Quickshell critique](https://www.reddit.com/r/unixporn/comments/1vbg333/).
7. **Theme controls are an operating system, not a paint picker.** Repositories synchronize tokens among Kitty, tmux, Neovim, GUI apps and status bars. codeLad should unify all internal modules under one token system. References: [SwayFX theme switcher](https://www.reddit.com/r/unixporn/comments/1x2k5av/), [year-long SwayFX](https://www.reddit.com/r/unixporn/comments/1x0ifsk/), [Matugen Quickshell](https://www.reddit.com/r/unixporn/comments/1s0yhny/).
8. **Performance matters in a visual community.** Some impressive custom shells report significant RAM use; others implement GPU-conscious mini shells and battery modes. Don't treat their measurements as portable to Electron. References: [Sekai custom shell](https://www.reddit.com/r/unixporn/comments/1x37y28/), [iGPU Quickshell](https://www.reddit.com/r/unixporn/comments/1ukoi3i/), [graceful-degradation battery mode](https://www.reddit.com/r/unixporn/comments/1u52r28/).
9. **Spatial navigation deserves a minimap.** Experimental 2D workspaces show spatial map overviews and minimap shortcuts. This applies directly to codeLad's codebase graph and multi-column workspace. References: [DriftWM minimap](https://www.reddit.com/r/unixporn/comments/1w6wmai/), [popup minimap](https://www.reddit.com/r/unixporn/comments/1uefz0y/).
10. **Real personal workflows outperform screenshot-only rices.** Users value quick file search, reliable clipboard, known shortcuts, comprehensive keyboard controls and predictable maintenance. References: [SwayFX developer shell](https://www.reddit.com/r/unixporn/comments/1x2k5av/), [SwayFX stable dots](https://www.reddit.com/r/unixporn/comments/1w3a3la/).

## Proposed codeLad interaction system

### A. The Field (editor canvas)

The editor is not one fixed center box among permanent adjacent panels. Its workspace is a native-feeling **tiling canvas**, built from editor groups and workbench views. Every surface is assigned a role: Source, Graph, Review, Run, Inspect. Users can reorder, split, pin, maximize, or temporarily float a surface. Splits use small 6–8 px gutters with subtle focus indication; inactive surfaces aren't visually loud.

**Primary novel interaction:** `Context Strip`. A horizontal, scrollable sequence of related working contexts:

- `Graph → Code → Tests → Git Review → Preview`, with the current context centered.
- A context consists of a saved composition of actual VS Code views/editors, not a screenshot or browser tab.
- Switching preserves focus, cursor, scroll, terminal and graph state.
- Mouse wheel (with modifier), touchpad horizontal swipe, or keyboard commands change contexts.
- It remains possible to disable the strip and use conventional VS Code tabs/groups.

### B. The Graph (Obsidian-like, but semantic)

Graph is a full editor-workspace surface, never just 300 connected circles in a sidebar.

**Levels:** Repository modules → folders/files → exported symbols → imports/calls → tests. Show only trusted relationships provided by parsers/language services/known project metadata. Color nodes by *kind*, not random theme colors. Use outlines, small glyphs and labels for modified/test-failing state.

**Edges:** imports, imported-by, references, test-of, optionally calls and runtime. Make edge type and data provenance inspectable. Do not claim a static import graph is an execution flow. For large projects, progressive expansion, depth/edge filters and a real minimap are mandatory.

A user selecting `UserService` should immediately see: definition, dependents, tests, warnings, latest Git change, and `Open in editor` / `Run related tests` actions. The map and file tree can be adjacent or toggled in one navigation slot.

### C. Git as a first-class visual language

Use a compact always-visible **branch state control** (not a giant permanent right sidebar) with status for changes, ahead/behind and conflicts. Clicking reveals a surface that grows into a review workflow: changes, stage-by-hunk, diffs, recent commits, branches, stash and conflicts. Git line markers in code and graph nodes link directly to the same change objects.

Give Git its own saved workspace mode for complex reviews. Keep commit and push explicitly separate, never automatically combine them. Confirm destructive operations; show full output/errors and provide recovery links.

### D. The Action Capsule

Replace a permanent task grid with one compact bottom/upper command surface. It automatically discovers scripts/tasks for the current project and presents only 3–5 likely actions:

- `▶ Dev` · `◇ Test` · `▣ Build` · `⌁ Git` · `···`
- Expand to all scripts/tools via searchable palette with descriptions, shortcuts, working directory, risk, and actual command preview.
- Buttons invoke real VS Code tasks or terminals; terminal output can slide into view under the capsule.
- Long-running task controls are Start/Stop/Restart/Logs. Failed tasks show diagnostics without pretending success.

### E. Utility Orbits

API client, DB browser, Docker explorer, environment switcher, test runner and debugger use one common **utility panel system**. Any utility may open as a full surface, a temporary peek drawer or a pinned tile. This retains the 'everything is available' requirement without keeping everything open.

**App-level composition presets:**

1. **Focus:** graph/file locator collapsed, source maximized, tiny Git+task HUD, terminal on summon.
2. **Explore:** graph (~35% width) + editor (~65%); graph minimap, symbol metadata on demand.
3. **Review:** source/diff (~65%) + Git (~35%), terminal hidden unless invoked.
4. **Operate:** source (~55%) + utility (~45%), action capsule and terminal below if needed.
5. **Canvas:** niri-like scrollable panes with drag/drop and keyboard-directed placement.

Do not default to five equally sized panes. The active task controls information density.

## Visual design direction: Smoke / Graphite / Ice

This is a *proposed design system* grounded in codeLad's selected smoky blue-grey aesthetic, not a literal copy of any r/unixporn rice.

| Token | Proposed value | Usage |
|---|---|---|
| `ink.950` | `#0B1119` | Opaque fallback and editor frame |
| `ink.900` | `#111A25` | Main editor background |
| `slate.800` | `#1A2837` | Surface over desktop backdrop |
| `slate.700` | `#29394A` | Active panels / separators |
| `text.primary` | `#E6EFF7` | Code UI and primary text |
| `text.secondary` | `#96AABB` | Filenames and secondary metadata |
| `ice.500` | `#81B5E9` | Focused pane, selection and active control |
| `ice.300` | `#BDDAF2` | Light focus ring or icon state |
| `good` | `#82C7A1` | Success and verified clean state |
| `warn` | `#D6B57C` | Warnings |
| `danger` | `#D78A91` | Errors and destructive controls |

**Material hierarchy:**

- Tier 0, code viewport: solid or near-solid, visually stable, syntax colours readable.
- Tier 1, chrome: subtly translucent; native OS/compositor background material if supported.
- Tier 2, popovers: blur and shadow to distinguish from active workspace; never overly smeared.
- Tier 3, active command: restrained ice focus stroke, clear keyboard focus and text.

Do not put background photography behind text. Full-screen wallpaper is an *optional desktop context*, not a core asset baked into codeLad. Avoid frequent full-window opacity changes and blur animation that repeatedly re-renders the editor.

**Geometry/typography starting point** (to evaluate in a real screenshot): 36–42 px title HUD; 24 px status strip; 6–8 px pane gutters; 7–10 px standard radii; 12–13 px UI labels; 13–15 px editor mono, user-configurable; Iosevka/JetBrains Mono-style coding typography, and a simple proportional UI sans. Support both dense and comfortable presets.

**Motion:** 110–180 ms for panel reveal and context shifts; reduced-motion disables nonessential transitions. Do not animate syntax lines, tooltips or caret movement. Use native OS backdrop materials where possible, with a safe solid fallback on unsupported Linux compositors/Windows variants.

## Why this differs from VS Code

VS Code already supports extensive rearranging of sidebars, panels, editor groups and floating windows (official: https://code.visualstudio.com/docs/configure/custom-layout). codeLad's differentiation cannot be 'we allow panels to move'. The real product-level change is **task-aware composition**: one action summons a complete working context with graph, code, Git, tests, or runtime data arranged together, using authentic underlying VS Code services and preserving keyboard/mouse parity.

The shell should remain a workbench implementation inside the fork, not a React website overlay attempting to emulate existing internals. Reuse existing Git extension, tasks, testing, SCM, terminal, editor groups and debug systems. Prototype the graph, contexts and command capsule independently before replacing core workbench regions.

Official extension opportunities: https://code.visualstudio.com/api/extension-guides/overview (Tree View, Webview, Task Provider, SCM, Test and Debug APIs). Extensibility will be bounded by the user's actual checked-out VS Code version.

## Negative lessons / design anti-patterns

- **No always-open 10-icon sidebar plus Git pane plus task grid plus graph plus terminal plus tools.** That is 'VS Code with more rectangles', exactly the previous failed direction.
- **No source code displayed over scenic photos.** Beautiful rices sometimes depend on wallpapers, but an IDE is read for hours.
- **No graph hairball.** Dense node spaghetti is neither Obsidian-like nor useful. Depth filters, typed edges, semantic focus and minimap are required.
- **No multicoloured borders for every category.** Accent should convey focus/status and semantic graph types; never simply decorate a pane.
- **No unmeasured GPU-heavy glass.** Compositor materials may not exist; provide solid backgrounds, no blur, reduced motion and low-power modes.
- **No fake apps or commands in production UI.** All tools and task buttons must be live, rooted in project config and actual execution services.
- **No assumption that a screenshot is daily-usable.** Each concept needs keyboard tests, long-session legibility, responsive window sizes and large-repo stress cases.

## Comparative concept shortlist

| Concept | Main borrowing | Graph | Git | Tasks | Distinctive advantage | Risk |
|---|---|---|---|---|---|---|
| **A. Quiet Shell** | SwayFX/Quickshell | Summon as surface | Inline status → review | One action capsule | Maximum reading room, low UI load | Discoverability |
| **B. Scrollspace** | Niri | First scrollable context | Review context | Ops context | Contexts stay spatially adjacent | Navigation learning curve |
| **C. Atlas Workbench** | DriftWM minimap + Obsidian | First-class main canvas | Graph overlays changes | Node-level actions | See code relationships and impact instantly | Graph performance |
| **D. Monolith** | BSPWM/DWM | Numbered tile | Numbered tile | Command strip | Muscle-memory speed and consistent geometry | Less inviting for mouse-only users |

**Recommendation:** make **A (Quiet Shell)** the visual language, **B (Scrollspace)** the workspace engine, and **C (Atlas Workbench)** the signature differentiator. Offer **D (Monolith)** as a solid, high-density preset. This keeps one coherent product identity instead of shipping four unrelated skins.

## Validation scenarios that should be demonstrated, not narrated

1. Open a medium-size TS/React project; navigate from a graph node to the code without the file tree; graph returns to same zoom/selection after closing and reopening.
2. Edit a shared function; directly see its dependent modules/tests in graph; run related tests via one action and view failures.
3. Stage a single Git hunk, compare diff, commit locally, and separately push. Correctly handle dirty branch, no remote, merge conflict and detached HEAD.
4. From `package.json` scripts, expose real Dev/Build/Test/Lint/Typecheck commands with terminal output and stop/retry controls. Do not show tasks absent from the project.
5. Inspect one API response and one database schema using native tools. Disconnect services safely, preserve secrets and disclose side effects.
6. Keyboard-only: focus/resize/swap/pin/close pane; open file; switch graph; open Git review; run action; back to source. Never trap focus in canvas.
7. Compare glass, no-blur and solid render modes on Windows, macOS and Linux compositors. Measure frame pacing and verify contrast.
8. Resize application to laptop-scale dimensions, 1080p, and 1440p; default to compact mode where needed. Verify original VS Code extensibility and debugging still works.

## Curated original references

The following is an annotated qualitative source catalog. It intentionally includes contrasting aesthetics and rejected patterns to prevent uncritical aesthetic copying.

### Contextual shell (14 references)

- [I simplified Noctalia down to only what I use](https://www.reddit.com/r/unixporn/comments/1x2k5av/) · **SwayFX** · 2026-10-10. Minimal developer shell, one-command theme change, fast clipboard/file search. **codeLad takeaway:** Make tool access contextual; support command/action parity.
- [The bar became a shell](https://www.reddit.com/r/unixporn/comments/1vlxzu4/) · **Hyprland** · 2026-08-11. Small shell, quiet idle state, keyboard-first contextual popups. **codeLad takeaway:** Minimal always-on HUD; let inspector panels emerge.
- [odyssey: a contextual Quickshell desktop shell](https://www.reddit.com/r/unixporn/comments/1wax008/) · **Hyprland** · 2026-09-08. Dynamic Island, context-expanding controls, launcher and palette. **codeLad takeaway:** One adaptive context capsule, not five permanent toolbars.
- [As fluid as it gets](https://www.reddit.com/r/unixporn/comments/1s84jik/) · **Hyprland** · 2026. Unified NixOS/Hyprland/Quickshell workflow and animation. **codeLad takeaway:** Subtle state transitions and a cohesive workspace system.
- [Minimal Quickshell setup (Frosted Glassmorphism)](https://www.reddit.com/r/unixporn/comments/1vbg333/) · **Hyprland** · 2026-07-31. Kitty, bespoke shell, restrained frosted panels. **codeLad takeaway:** Glass on chrome, opaque readable code.
- [Shell from scratch with Quickshell and shaders](https://www.reddit.com/r/unixporn/comments/1rwyzlx/) · **Hyprland** · 2026-03-18. Full native shell: toasts, launcher, settings, services, shortcuts. **codeLad takeaway:** Single composable system for popups and tool states.
- [Minimal desktop with graceful-degradation mode](https://www.reddit.com/r/unixporn/comments/1u52r28/) · **Hyprland** · 2026-06-13. Hotkey swaps rich shell for lightweight shell; turns off blur/animations. **codeLad takeaway:** Add fast solid mode with persistent keyboard bindings.
- [Cool Quickshell stuff](https://www.reddit.com/r/unixporn/comments/1ut94nj/) · **Hyprland** · 2026-07-11. Launcher, wallpaper, music and bar share components. **codeLad takeaway:** Consolidate commands, tasks and services under one control system.
- [Migration from Waybar to Quickshell](https://www.reddit.com/r/unixporn/comments/1v9n0wi/) · **Hyprland** · 2026-07-29. Custom interactive widgets replace a static bar. **codeLad takeaway:** Stateful mini-panels rather than passive buttons.
- [Project Sekai Inspired Quickshell](https://www.reddit.com/r/unixporn/comments/1x37y28/) · **Hyprland** · 2026-10-11. Unusual Figma-designed, phone-shaped desktop shell; high reported RAM. **codeLad takeaway:** Original interaction idea but warning against resource-heavy decoration.
- [SekaiPop Quickshell released](https://www.reddit.com/r/unixporn/comments/1x8zl9d/) · **Hyprland** · 2026-10-18. Publicly released highly bespoke themed shell. **codeLad takeaway:** Good example of distinct authorship; avoid copying aesthetics.
- [Lightweight Quickshell island for iGPU](https://www.reddit.com/r/unixporn/comments/1ukoi3i/) · **Hyprland** · 2026-07-01. Compact system island with clipboard and OSD; author reports ~200MB RAM. **codeLad takeaway:** Set a real memory budget for integrated micro-UI.
- [My boring main desktop](https://www.reddit.com/r/unixporn/comments/1v4ixll/) · **Hyprland** · 2026-07-23. Long-lived daily driver uses tiling, floating when needed. **codeLad takeaway:** Default to reliable tiles; float only contextual inspectors.
- [NixOS btw with custom Quickshell](https://www.reddit.com/r/unixporn/comments/1xfpm7z/) · **Hyprland** · 2026-10-26. Workspace overview with drag-to-move previews and focus mode. **codeLad takeaway:** Visual overview of editor groups and pinned tools.

### Theme system (5 references)

- [Matugen with Quickshell dynamic UI colors](https://www.reddit.com/r/unixporn/comments/1s0yhny/) · **Hyprland** · 2026-03-22. Live theme tokens generated from wallpaper. **codeLad takeaway:** Optional wallpaper-derived accents, never force code syntax changes.
- [HyprPunk Catppuccin Mocha](https://www.reddit.com/r/unixporn/comments/1u86zj7/) · **Hyprland** · 2026-06-17. Coherent terminal, WM, menu, GTK and shell tokens. **codeLad takeaway:** One shared visual token registry and few accent colours.
- [MochaLand](https://www.reddit.com/r/unixporn/comments/1wj2bzw/) · **Hyprland** · 2026-09-17. Catppuccin carried across complete Linux workflow. **codeLad takeaway:** Consistent chroma across Code, Git, Graph and Tasks.
- [My year-long Arch rice](https://www.reddit.com/r/unixporn/comments/1x0ifsk/) · **SwayFX** · 2026-10-08. Theme scripts manage accent, rounding, gaps and blur across tools. **codeLad takeaway:** Define knobs for dense/comfortable, solid/glass, radius and accent.
- [Slackkitty soft themed desktop](https://www.reddit.com/r/unixporn/comments/1reftxf/) · **DWM** · 2026-02-25. Wallpaper-generated soft colors on old-school minimal dwm. **codeLad takeaway:** Art direction can be rich even when UI is simple.

### Scrollable tiling (9 references)

- [Niri + Noctalia best combo](https://www.reddit.com/r/unixporn/comments/1wue8b7/) · **Niri** · 2026-09-30. Niri scrollable tiling, Kitty, shell. **codeLad takeaway:** Horizontal context columns instead of tab overload.
- [First time building a DE](https://www.reddit.com/r/unixporn/comments/1wcogmr/) · **Niri** · 2026-09-10. Custom Waybar/Rofi with Matugen and environment-based blur. **codeLad takeaway:** Support user-configured backgrounds and material fallbacks.
- [First rice on NixOS x Noctalia](https://www.reddit.com/r/unixporn/comments/1wtkorx/) · **Niri** · 2026-09-29. Scrollable tiling, capsule blur, Ghostty, deep palette. **codeLad takeaway:** Graph/Code/Git columns can move as one navigable strip.
- [Welcome Home (now with Noctalia)](https://www.reddit.com/r/unixporn/comments/1wg0oc4/) · **Niri** · 2026-09-14. Accordion-hidden status bar on hover. **codeLad takeaway:** Make secondary controls peek only when needed.
- [Simple (and) enough](https://www.reddit.com/r/unixporn/comments/1ua5q8r/) · **Niri** · 2026-06-19. Minimal, wallpaper-driven Niri configuration. **codeLad takeaway:** Compact persistent chrome and free spatial movement.
- [Niku: minimal and functional rice](https://www.reddit.com/r/unixporn/comments/1rqlfvz/) · **Niri** · 2026-03-11. Daily-oriented Niri shell and dynamic colours. **codeLad takeaway:** Visual consistency without sacrificing usability.
- [Eye-candy rice: blur too strong discussion](https://www.reddit.com/r/unixporn/comments/1w0jh4s/) · **Niri** · 2026-08-28. Blur & wallpaper tuning with critique of excessive blur. **codeLad takeaway:** Explicit contrast boundaries, opaque coding surfaces.
- [My new desktop](https://www.reddit.com/r/unixporn/comments/1wu5wa5/) · **Niri** · 2026-09-30. Large bespoke Quickshell/Niri setup; memory discussed. **codeLad takeaway:** Do not let effects inflate memory or hide controls.
- [My first Wayland rice with Noctalia](https://www.reddit.com/r/unixporn/comments/1x8b1se/) · **Niri** · 2026-10-17. Comment highlights transparency without blur. **codeLad takeaway:** Offer clear acrylic AND transparent-no-blur options.

### Readable minimalism (8 references)

- [More from my dots](https://www.reddit.com/r/unixporn/comments/1shiukb/) · **Sway** · 2026-04-10. Waybar, Rofi, Foot, Neovim, Iosevka/JetBrains Mono. **codeLad takeaway:** Monospace hierarchy, narrow bars, terminal-first discipline.
- [My first rice, black and white](https://www.reddit.com/r/unixporn/comments/1oadthr/) · **BSPWM** · 2025-10-19. Simple controls and ASCII-inspired black-white visual language. **codeLad takeaway:** Use monochrome structural theme as alternative to glass.
- [Ultimate Nord rice](https://www.reddit.com/r/unixporn/comments/wcsm3p/) · **BSPWM** · 2022-07-31. BSPWM/Polybar/Picom/Rofi with expandable menu. **codeLad takeaway:** A drawer should be closed by default and explicit to open.
- [Minimal BSPWM rice](https://www.reddit.com/r/unixporn/comments/1kyizaz/) · **BSPWM** · 2025-05-29. Polybar, Alacritty and MateriaDark. **codeLad takeaway:** Small topology, strong spacing, no elaborate ornaments.
- [Simple setup for daily use](https://www.reddit.com/r/unixporn/comments/1u13u2e/) · **DWM** · 2026-06-09. No blur, rounded corners, opacity or animation. **codeLad takeaway:** Offer crisp pure-solid focus preset.
- [Switched to Xorg with Nordfox](https://www.reddit.com/r/unixporn/comments/1qm0jff/) · **DWM** · 2026-01-24. Nordfox theme + st/dmenu/nvim. **codeLad takeaway:** Readable color palette can be the visual identity.
- [Bitmap fonts are cool](https://www.reddit.com/r/unixporn/comments/1xcpmm2/) · **AwesomeWM** · 2026-10-22. Terminus font and original EWW bar, distinctive mature look. **codeLad takeaway:** A clean retro/bitmap variant can be original without neon.
- [Basic laptop configuration](https://www.reddit.com/r/unixporn/comments/1spe6rx/) · **Hyprland** · 2026-04-19. VS Code coexists with Kitty/Rofi/Waybar/Neovim community. **codeLad takeaway:** No need to replace familiar shortcuts to feel native.

### Experimental workspace (8 references)

- [Bar-centric infinite desktop](https://www.reddit.com/r/unixporn/comments/1usv4xs/) · **vxwm** · 2026-07-10. All menus/actions share exact bar geometry and pywal theme. **codeLad takeaway:** One consistent command strip across Git/Tasks/Graph.
- [Probably the most unique WM](https://www.reddit.com/r/unixporn/comments/1r6m589/) · **vxwm** · 2026. Unconventional window-management experiment. **codeLad takeaway:** Study spatial behavior and workspace metaphors.
- [Windows as sheets of paper](https://www.reddit.com/r/unixporn/comments/1wzzxjn/) · **DeskWM** · 2026-10-19. Skeuomorphic window metaphor, radically different approach. **codeLad takeaway:** Explore spatial rearrangement, avoid copying wooden textures.
- [Waylandcraft ricing](https://www.reddit.com/r/unixporn/comments/1tjw02m/) · **Hyprland** · 2026. Custom deeply configured visual workflow. **codeLad takeaway:** Learn motion and stage-based grouping, not decoration.
- [My first rice: monochrome](https://www.reddit.com/r/unixporn/comments/1tg82cr/) · **KDE Plasma** · 2026. Monochrome visual hierarchy. **codeLad takeaway:** Use color sparingly; test no-accent mode.
- [Neo Brutalism lovers](https://www.reddit.com/r/unixporn/comments/1vmg29f/) · **Hyprland** · 2026. Strong borders, bold structure and unconventional style. **codeLad takeaway:** Use sharp high-contrast variant as an optional theme.
- [Just Enough Shell minimap improvement](https://www.reddit.com/r/unixporn/comments/1w6wmai/) · **DriftWM** · 2026-09-04. Overview minimap for a large spatial desktop. **codeLad takeaway:** Graph minimap doubles as an interactive navigation compass.
- [Shell popup minimap](https://www.reddit.com/r/unixporn/comments/1uefz0y/) · **DriftWM** · 2026-06-24. A keyboard shortcut reveals a global spatial minimap. **codeLad takeaway:** Graph or workspace overview should be summonable, not permanent.

### Performance / critique (1 references)

- [Traditional dots for stability](https://www.reddit.com/r/unixporn/comments/1w3a3la/) · **SwayFX** · 2026-08-31. User preference for stable set-and-forget configurations. **codeLad takeaway:** Native first-party UI should degrade gracefully.

## Implementation repositories & reference documentation

These links are for architecture study, not blanket permission to copy their code into an MIT-licensed VS Code fork. Check each upstream repository's actual license and derivative-work requirements.

- [awesome-dotfiles catalog, 4000+ submissions](https://dotfiles.lol/) and [its source code](https://github.com/0xN1nja/awesome-dotfiles): filterable research index. The project's 4000+ claim is its own description, not an independently audited count.
- [Caelestia shell](https://github.com/caelestia-dots/shell): fluid, morphing Quickshell architecture (GPL-3.0; study patterns, not direct copy).
- [Noctalia shell](https://noctalia.dev/shell): quiet-by-design composable shell, supported compositors, plugins.
- [end-4 illogical-impulse](https://github.com/end-4/dots-hyprland): contextual overlays, overview, theme generation, keybinding documentation (verify license).
- [ilyamiro NixOS setup](https://github.com/ilyamiro/nixos-configuration): tightly integrated themed widget system.
- [SwayFX developer shell](https://www.reddit.com/r/unixporn/comments/1x2k5av/): directly relevant simplification and theme switching.
- [Niri wiki](https://wiki.archlinux.org/title/Niri): scrollable-tiling interaction reference.
- [Hyprland official blur options](https://wiki.hypr.land/Configuring/Basics/Variables/): native compositor blur capabilities and performance switches.
- [VS Code layout documentation](https://code.visualstudio.com/docs/configure/custom-layout): real grid/panel/layout functionality already available.
- [VS Code extension APIs](https://code.visualstudio.com/api/extension-guides/overview): workbench services and mechanisms to reuse.

## Research provenance and limitations

Reference links were inspected via web search and Reddit page retrieval on 29 October 2026, weighted toward 2025–2026 posts and older minimalist counterexamples. They are a *qualitative, purposive sample*, not an exhaustive scrape, numerical design-frequency study, or popularity ranking. Some posts reference GitHub dotfiles only in user comments; availability and licenses may change. The catalog records what the visible posts/authors say, not verified end-to-end performance. Colour tokens and dimensions above are original design recommendations for codeLad, **not measurements** taken from Reddit images.
