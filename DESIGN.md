---
name: Codelad Quiet Shell
description: A compact contextual shell around the real desktop editor.
colors:
  ice: "#81B5E9"
  ice-light: "#BDDAF2"
  ink: "#0B1119"
  graphite: "#111A25"
  graphite-raised: "#1A2837"
  slate: "#29394A"
  reading: "#E6EFF7"
  tool-text: "#C7D6E3"
  muted: "#96AABB"
  inherited-widget-border: "#2A2B2C"
  inherited-disabled: "#555555"
typography:
  body:
    fontFamily: '"Segoe WPC", "Segoe UI", sans-serif'
    fontSize: "13px"
    lineHeight: "1.4em"
  shell-label:
    fontFamily: '"Segoe WPC", "Segoe UI", sans-serif'
    fontSize: "13px"
    lineHeight: "normal"
  code:
    fontFamily: 'Consolas, "Courier New", monospace'
  atlas-heading:
    fontFamily: '"Segoe WPC", "Segoe UI", sans-serif'
    fontSize: "18px"
    fontWeight: 600
  atlas-inspector-heading:
    fontSize: "13px"
  atlas-label:
    fontSize: "12px"
  atlas-file:
    fontSize: "11px"
  atlas-change:
    fontSize: "10px"
rounded:
  control: "4px"
  map-node: "6px"
spacing:
  context-gap: "2px"
  control-gap: "4px"
  control-inset: "6px"
  center-margin: "8px"
  control-height: "24px"
  map-section-inset: "16px"
components:
  shell-button:
    backgroundColor: "transparent"
    textColor: "{colors.reading}"
    typography: "{typography.shell-label}"
    rounded: "{rounded.control}"
    padding: "0 6px"
    height: "{spacing.control-height}"
  context-selected:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.reading}"
    typography: "{typography.shell-label}"
    rounded: "{rounded.control}"
    padding: "0 6px"
    height: "{spacing.control-height}"
  pin-selected:
    backgroundColor: "transparent"
    textColor: "{colors.ice}"
    rounded: "{rounded.control}"
    padding: "0 6px"
    height: "{spacing.control-height}"
  repository-count:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.reading}"
    rounded: "{rounded.control}"
    padding: "0 4px"
  atlas-action:
    backgroundColor: "transparent"
    textColor: "{colors.reading}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "6px 8px"
  atlas-search:
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "6px 8px"
  atlas-node:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.reading}"
    typography: "{typography.body}"
    rounded: "{rounded.map-node}"
    padding: "10px 12px"
    width: "208px"
    height: "64px"
  atlas-node-selected:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.reading}"
    typography: "{typography.body}"
    rounded: "{rounded.map-node}"
    padding: "10px 12px"
    width: "208px"
    height: "64px"
---

# Design System: Codelad Quiet Shell

## Overview

**Creative North Star: "Quiet Shell"**

Codelad is a browser-rendered Electron desktop workbench. This record describes the implemented Quiet Shell strip and Codelad Graphite theme, with the existing editor and workbench controls as its foundation. Source remains the primary field; a compact title-area strip changes the tools around it. The feeling is calm, focused and familiar to a developer using native menus, keyboard commands and extensions.

The supplied direction is Quiet Shell + Scrollspace + Atlas in Smoke / Graphite / Ice. Its current expression is four saved pane compositions sharing actual editor groups and a first provider-backed Atlas call map. Atlas supplies bounded caller/callee relationships and source navigation; complete repository semantics, imports/types/test edges, a horizontal Scrollspace canvas, independent editor contents per context and the complete utility system remain unimplemented. Existing workbench surfaces retain their own component behavior; this document does not claim an entire VS Code redesign.

**Key Characteristics:**

- One real editor field shared across task contexts.
- Opaque Graphite reading surfaces beneath quieter Ink chrome.
- Compact controls with theme-bound selection and keyboard focus.
- Real source-control state and user-invoked configured tasks.
- Bounded provider-backed call relationships beside actual source.
- Reversible desktop integration that preserves native affordances.

Ground truth: `src/vs/workbench/browser/parts/titlebar/codeladShellControl.ts`, its `media/codeladShell.css`, `titlebarPart.ts`, the Codelad shell contribution/service/state files, and `extensions/theme-defaults/themes/codelad-graphite.json` with its `2026-dark.json` include. Product and direction context: `PRODUCT.md` and `docs/codelad/design/quiet-shell-direction.md`. Real application captures are under `docs/codelad/validation/quiet-shell-2026-10-30/`; all four initial contexts, task picker, narrow and high-contrast captures were inspected while documenting, alongside the source. The full capture set also records the before state. These are runtime evidence, not image-generated comps or screenshot-fidelity references.

Atlas ground truth: `src/vs/workbench/contrib/codelad/browser/atlasEditor.ts`, `atlasEditorInput.ts`, `atlasGraph.ts`, `atlas.contribution.ts` and `media/atlas.css`, with inherited size roles from `src/vs/platform/theme/common/sizes/baseSizes.ts`. The approved extension is recorded in `docs/codelad/design/atlas-direction.md`. Final native captures `before.jpg`, `alongside.jpg`, `full-map.jpg`, `narrow.jpg` and `high-contrast.jpg` under `docs/codelad/validation/atlas-2026-10-31/` were inspected with `source-runtime.json` and `restored-before.json` / `restored-after.json`. They establish this Windows call-map surface and its source continuity; they do not establish additional platform or DPI acceptance.

## Colors

The built-in Graphite theme uses cool opaque neutrals with a restrained Ice accent. Frontmatter values are the Graphite palette, not hardcoded replacements for workbench semantic colors.

### Primary

- **Ice:** focus borders, primary workbench actions and pinned-tool indication.
- **Ice Light:** active line numbers and activity-bar emphasis; primary button hover.

### Neutral

- **Ink:** title area, inactive tabs, activity bar and status bar.
- **Graphite:** editor, Explorer, panel and terminal reading surfaces.
- **Graphite Raised:** line highlight, quick input and inactive selection.
- **Slate:** dividers, active selection, repository count badge and debugging status surface.
- **Reading:** main text and selected-control text.
- **Tool Text:** sidebar and status text.
- **Muted:** descriptions, inactive title text, inactive tabs and line numbers.
- **Inherited Widget Border / Disabled:** unchanged values from the included 2026 Dark theme, used by the strip divider and unavailable contexts. They are inherited implementation details, not a newly designed complete neutral ramp.

**The Semantic Theme Rule.** Bind shell colors to existing workbench semantic tokens. Graphite is the default dark theme; preserve user-selected themes and high-contrast overrides. The shell setting does not force a theme switch.

The theme includes 2026 Dark, which includes Dark Modern. Syntax colors, validation colors, input styling, hover colors and many other controls retain that inherited vocabulary. The shell itself uses `titleBar`, `toolbar.hoverBackground`, `focusBorder`, `list.activeSelection`, `badge`, `widget.border` and `disabledForeground` tokens. Sidecar tonal ramps are synthesized preview strips in OKLCH, not additional shipped palette tokens. Its self-contained component snippets illustrate source states without connecting to application services; inline SVGs translate the native icon roles for the preview.

## Typography

**Body and shell labels:** native workbench UI stack. The Windows stack and observed base size are recorded in frontmatter. macOS uses `-apple-system, BlinkMacSystemFont, sans-serif`; Linux uses `system-ui, "Ubuntu", "Droid Sans", sans-serif`, with existing localized fallbacks preserved.

**Code:** the platform monospace fallback is recorded for the validated Windows host. Editor and terminal fonts and sizes remain user-configurable. Do not infer their complete typography from the shell label role.

The shell adds no display face, headline scale or uppercase eyebrow treatment. Buttons inherit the surrounding UI font and use normal line height. Repository counts use tabular numerals. Existing workbench Codicons remain the native icon vocabulary at the inherited base size (16px); icons accompany accessible control labels rather than replacing them.

Atlas reuses the workbench type ramp rather than adding a brand face. Its heading uses `fontSize.heading2` with `fontWeight.semiBold`; the inspector heading uses `fontSize.heading3`. Controls and symbol names use the body tier; provenance, counts, filters and call-site links use `fontSize.label1`, node file labels use `fontSize.label2`, and the file-change mark uses `fontSize.label3`. Those observed roles are recorded as the scoped Atlas frontmatter entries. Inspector source details retain `--monaco-monospace-font`, and the anchor name gains semibold emphasis. Platform fallbacks and user zoom continue to apply.

**The Native Label Rule.** Keep context names and actions at the workbench text tier. Preserve user zoom, platform font fallbacks and editor typography rather than adding a separate branding type scale to titlebar controls.

## Layout

The titlebar remains native-aware desktop chrome. Its left and right regions size to their contents while the center flexes with `min-width: 0` and the center-margin token. The strip is a horizontal flex row at the full title-area height. Control-gap separates its controls; context-gap separates context buttons inside a compact group with control-gap inline padding and theme-bound one-pixel side dividers. Every shell button has the control-height token as its height and minimum width, with control-inset horizontal padding. Preserve caption buttons and surrounding draggable titlebar regions; interactive shell controls are explicitly non-draggable.

The visible order is project/file search, Focus / Explore / Review / Operate, a narrow-only context chooser, Atlas, Run, Pin Tool Areas and the source-control HUD. Project and branch labels truncate rather than wrap. Their full-width caps are 120px. At viewport widths of 1250px or less, hide the project and Run text labels and reduce the branch label cap to 80px. At 1000px or less, show only the selected context plus the context chooser. At 760px or less, hide branch text while retaining the SCM button and nonempty count. These are desktop CSS viewport thresholds, not mobile layouts; all contexts remain available through the chooser and keyboard commands.

**The Shared Editor Rule.** Context selection changes real tool panes around the existing editors. It does not replace, clone or forcibly merge editor groups. Explorer, SCM and terminal continue to use their existing workbench layouts and resizing behavior.

Default compositions, before user customization or visibility pins:

| Context | Sidebar | Panel | Auxiliary bar |
| --- | --- | --- | --- |
| Focus | Hidden | Hidden | Hidden |
| Explore | Explorer | Hidden | Hidden |
| Review | Source Control | Hidden | Hidden |
| Operate | Hidden | Terminal | Hidden |

Explore is the initial context label. On a fresh workspace, initial restoration preserves the existing tool layout until a saved composition exists or the user switches/resets a context. Saved compositions record visible tool containers, sidebar width and panel height in workspace-local machine storage. They are pane snapshots, not semantic task sessions. Pins keep sidebar/panel visibility across contexts without rewriting the saved baseline. Reset Current Context reapplies that context's defaults.

### Atlas Call Map

Atlas is a real workbench editor, opened from the title-strip graph action, Project Actions or Open Code Atlas (Ctrl+Alt+G on Windows). It reuses the installed language provider's call hierarchy; static calls do not establish runtime execution. Callers lead toward the selected source anchor and callees lead away. Selection, call sites, file changes and data provenance come from existing services. Open Source Alongside uses the normal editor service and reuses the source group; Toggle Map Focus maximizes/restores the actual graph group.

The map uses `editor.background` and `editor.foreground` for its opaque reading field, `sideBar.background` for symbol nodes, `panel.border` for divisions, `descriptionForeground` for secondary labels/edges, `focusBorder` for selected edges/nodes and focus rings, `list.inactiveSelectionBackground` for selected-node fill, native symbol-kind colors and `gitDecoration.modifiedResourceForeground` for file-change marks. Controls retain inherited font-size, corner-radius, stroke and spacing tokens. Graph geometry uses 208×64 symbol nodes in directed columns, with real scroll/zoom coordinates and a viewport minimap. This geometry represents loaded relationships, not a decorative illustration.

The inspector sits beside the map at editor widths of at least 750px and below it when narrower, with scrollable actions and call sites retained. Below 450px, toolbar labels hide but accessible names remain. Resizing and Home recenter the selected anchor; standard keyboard navigation, Enter source opening and E expansion complement pointer controls. The source anchor remains visible under filters. Bounds are 80 symbols, 160 edges, 200 processed relationships per response and 32 stored call-site ranges per edge; omissions are disclosed. Unsupported/no-call/error/cancel/stale states remain explicit. Only the source URI/position is restored; refreshing relationships is user-directed. See `docs/codelad/design/atlas-direction.md` and `docs/codelad/atlas-2026-10-31.md` for scope and evidence.

## Elevation & Depth

Graphite reading surfaces are opaque. Tonal separation, selected fills and thin dividers carry the shell hierarchy; shell buttons add no shadow, animation or backdrop filter. The existing titlebar retains the workbench medium shadow (`0 0 6px rgba(0, 0, 0, 0.08)`). Existing floating workbench parts and quick input retain their own depth treatment. Do not turn that incumbent shadow into a new card system.

Native material is a separate existing preference, off by default. Its structural-chrome behavior and solid fallbacks remain distinct from the strip. This pass does not establish new glass behavior or prove every host's native-material support. Preserve reduced-motion and transparency fallbacks; context changes introduce no bespoke motion.

## Shapes

Controls and count badges use the small workbench radius recorded as control in frontmatter. The strip is a compact grouped rail with side dividers, not a new floating card. Transparent resting buttons acquire a tonal selection fill and an explicit bottom border when selected. The pinned-tool state uses a full accent border. Borders and focus outlines use the shared stroke thickness (1px).

Atlas symbol nodes use the existing medium workbench corner tier, recorded as map-node. They remain flat bordered source targets; a selected node combines an accent border and inactive-selection fill with pressed-state semantics. Atlas actions and search use the small control tier. The inspector is a divided region of the same reading field, not an elevated card.

## Components

### Context navigation

Four plain-language buttons form a toolbar named Workspace Contexts. The selected button has `aria-pressed="true"`, active-selection fill/text and a focus-colored bottom border, so selection has both shape and color. Only the active context is in the tab sequence; Left/Right/Home/End selects and focuses a context. Contexts are disabled until workbench restoration completes, using disabled text and a default cursor. Hover uses the workbench toolbar hover background. Keyboard focus uses an inset one-pixel focus-colored outline, independent of selection.

Ctrl/Cmd+Alt+1–4 selects Focus, Explore, Review and Operate. Ctrl/Cmd+Alt+PageUp/PageDown cycles contexts. Alt+wheel over the strip cycles with a short input throttle; it is an optional shortcut, not a motion effect. Focus Context Strip targets the active control, or opens the picker when a custom strip is unavailable. The narrow chooser exposes the same four real contexts through standard quick input.

### Project and action buttons

Project search opens the normal Open File quick picker. Run opens Project Actions through existing quick input. The picker lists up to five non-hidden discovered tasks with workspace/source information and a declared command/directory preview where available; other task types expose their configured detail or definition guidance. All Tasks, Configure Tasks, Toggle Terminal and Command Palette remain standard workbench actions. Choosing a task enters Operate and uses the normal task runner and trust gates. Task discovery is user-invoked; no task or shell command runs merely because the strip appears. No custom input or task-card design was introduced.

### Visibility pin

The pin control opens a multi-select quick picker for Keep Sidebar Visible and Keep Panel Visible. Its pressed state means at least one tool area is pinned; accent text and a full border reinforce the state. It retains a descriptive accessible label and managed hover even when the control is icon-only.

### Source-control HUD and count badge

The HUD follows the active real SCM repository. It shows the branch when available, otherwise the provider name; without a repository it shows Git and no count. The badge appears only for a positive pending-change count and uses tabular numerals with compact inline padding. The accessible name and managed hover include branch/provider and count. Activating the HUD selects Review and opens actual Source Control. This is neither a Git mutation control nor a fabricated status summary.

### Atlas map, filters and inspector

Atlas actions are transparent inherited-font controls with toolbar hover, disabled text and an explicit focus outline. Search uses native `input.background`, `input.foreground`, `input.border` and placeholder roles; Callers, Callees and Changed Files are labelled checkboxes. Filters operate on loaded relationships and retain the source anchor. The component frontmatter records Graphite defaults; implementation and sidecar previews bind semantic workbench variables so custom and high-contrast themes remain authoritative.

Each symbol target pairs its native symbol-kind icon and name with a secondary file/line label. Selection uses a focus-colored border and inactive-selection fill; hover uses `list.hoverBackground`, keyboard focus uses a separate outline, and the source anchor name is semibold. A Changed mark uses the actual SCM file-resource state and modified-resource foreground; it conveys file changes, not changed symbols, hunks or test results. Ordinary edges use the description role (1.25px); selected edges use the focus role (1.75px), with arrowheads indicating caller-to-callee direction.

The viewport minimap mirrors loaded node positions and the actual visible rectangle; its accent viewport outline is navigational. The inspector exposes the selected source path, Open Source Alongside, progressive caller/callee expansion, language-provider provenance and actual stored call-site links. Long paths wrap; actions and call sites scroll in the compact arrangement. The status region is a polite live announcement, with `errorForeground` reserved for errors. Counts describe only loaded/filtered symbols and calls. Sidecar snippets are isolated design previews using source labels; they do not execute provider calls, source navigation or SCM queries.

### Native workbench and reversible shell

Existing Explorer rows, editor tabs, terminal, quick input, buttons, inputs, menus and notifications retain their workbench implementations and semantic theme states. Preserve normal keyboard and assistive-technology behavior rather than reproducing them in a parallel shell library. The strip is installed in the primary custom titlebar; OS-native titlebar users retain commands and pickers. Auxiliary windows keep their existing title area.

`workbench.codeladShell.enabled` is application-scoped and defaults to true on the current dev implementation. Toggle Quiet Shell writes the user setting. Disabling restores the conventional title area and the pre-shell tool layout captured for the current session; re-enabling reapplies the active composition. Workspace composition persistence is machine-only. This does not certify a stable release or complete the separate privacy acceptance checks.

## Do's and Don'ts

### Do:

- **Do** keep real source central while contextual tools change around shared editor groups.
- **Do** use workbench semantic colors, visible focus and pressed-state shape across Graphite, custom themes and high contrast.
- **Do** preserve caption controls, drag regions, keyboard commands, native menus and extension behavior.
- **Do** use actual SCM state and configured tasks, with execution following an explicit user choice.
- **Do** preserve Atlas provider provenance, bounded-result disclosures, visible anchor and actual source navigation.
- **Do** keep reading surfaces opaque and preserve existing solid, reduced-motion and transparency fallbacks.
- **Do** retain the approved Codelad name and supplied identity assets.

### Don't:

- **Don't** present pane snapshots as independent editor sessions or a Scrollspace canvas, or the bounded Atlas call map as complete repository semantics or runtime execution.
- **Don't** hardcode the Graphite palette over custom or high-contrast themes.
- **Don't** use invented Git/task data, fake graph edges, embedded wallpaper or AI drawings as proof of the actual workbench.
- **Don't** infer OS DPI or additional platform validation from application zoom or the available Windows captures.
- **Don't** treat this visual record as closure of the open privacy checks or authority to redesign every incumbent workbench component.

Not canonized or repaired: inherited workbench styling outside the shell/call map, complete Atlas and Scrollspace, other-platform/native-material acceptance and the open privacy gates remain outside this record's claims.
