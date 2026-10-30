# Codelad — visual & native glass specification

## Intent

Current direction: [Quiet Shell + Scrollspace + Atlas research](codelad/design/README.md), supplied on 2026-10-30. Keep the editor central and secondary tools contextual; preserve calm, professional density, readable code, useful Git and real developer actions. Previously named reference PNGs are absent. This is not permission to crowd the screen with permanent panels or claim screenshot fidelity.

## Style direction

- Mood: quiet, cool, nocturnal blue-grey with subtle lavender and soft electric blue status accents.
- Material: desktop glass with believable edge lighting, minimal bloom, one-pixel borders, selective surface elevation. Avoid neon rainbow, black-purple cyberpunk gradients, ornamental 3D elements and fake wallpaper baked into the editor.
- Geometry: a coherent desktop app with large-radius outer window shell only when window-manager safe, smaller consistently rounded inner panels, generous but controlled 8–12px gutters, restrained padding.
- Typography: professional UI font with high legibility; monospace font stack for code and terminal, adjustable by users. UI labels and headings intentionally quiet.
- Contrast: never reduce code legibility for visual effect. Editor and terminal should be mostly opaque even if chrome is glass.
- Buttons: compact and credible. Icons and actionable text. Active vs idle states must be clear. Avoid a dashboard of coloured gradient cards.
- Graph: clear node hierarchy, visually distinguish files vs modules vs symbols. Edges should not form decorative spaghetti. Clickable zoom/pan and selected-node focus.

## Layout direction after the material proof

Use task compositions rather than a compulsory permanent rail/graph/editor/Git/task grid: Focus, Explore, Review and Operate are planning concepts using real existing views and editor groups. A scrollable context strip and semantic Atlas graph are later prototypes, not features delivered by native material settings. The older five-region sketch below is historical context, not the default composition to implement.

### Historical wide-screen sketch

```
┌──────────────────────── slim native-aware title / search ──────────────────────┐
│ RAIL │ CODEBASE GRAPH / NAV │ REAL EDITOR │ GIT STATUS + HISTORY             │
│      │                      │             │                                   │
│      │                      │             │                                   │
│      ├──────────────────────┼─────────────┼───────────────────────────────────┤
│      │ TERMINAL (resizable) + actions    │ TASKS / DEV TOOLS (switchable)   │
└──────┴────────────────────────────────────┴───────────────────────────────────┘
```

On typical laptop screens graph, Git, and tools should collapse intelligently. The graph and explorer can be switchable modes. Preserve at least ~60–70 columns of readable code by default when available, and let users maximize editor with a shortcut.

## Material stack, from back to front

1. OS/compositor backdrop (actual changing desktop visible when available).
2. Window base tint: moderately dark blue-grey, alpha controlled through native/material support.
3. Structural panes: medium-opacity tinted surfaces with fine separator lines and restrained highlights.
4. Code + terminal reading surfaces: substantially higher opacity, e.g. 0.90–0.98, depending on theme and host material.
5. Floating interactive surfaces: increased contrast and elevation, not oversized glass gradients.

Initial **design targets**, not mandated literal implementation values: window material tint `#111d31`, edge `rgba(196,216,255,.12)`, accent `#79aaff`, selected fill `rgba(95,150,240,.24)`, UI text `#e7ecf8`, muted text `#a6b4cf`. Use theme tokens and test against real monitor screenshots, not raw CSS alone.

Example token names (adapt to actual VS Code ColorRegistry / theming services):

- `codelad.window.material`, `codelad.window.tint`, `codelad.window.opacity`
- `codelad.panel.background`, `codelad.panel.border`, `codelad.panel.elevation`
- `codelad.editor.background`, `codelad.terminal.background`
- `codelad.graph.node.*`, `codelad.graph.edge.*`, `codelad.graph.selection`
- `codelad.task.action`, `codelad.task.running`, `codelad.task.failed`

## Very important compositor distinction

The [current proof of concept](codelad/native-glass-poc.md) implements application-scoped `window.codeladGlass.mode`, `chromeOpacity` and `reduceTransparency`. It defaults to solid; Windows Acrylic/Mica have [native screenshot/API evidence](codelad/native-glass-visual-2026-10-30.md), macOS vibrancy is unrun, and Linux remains solid. The outer floating layout grid is transparent only with an active material; reading surfaces remain opaque. Physical OS DPI, performance and wider platform acceptance remain open. These real settings supersede the illustrative token names above for this prototype.

Kitty's `background_opacity` means the terminal's *background pixels* can be transparent. Real blur of the actual desktop behind is supported only when platform/compositor permits it. Kitty's own documentation states `background_blur` currently works on macOS and compositor-supported Wayland environments; do not assume same capability in Electron, or X11, or all Linux distributions.

Electron documentation notes limitations of `transparent` windows: size/maximize handling can differ, DevTools can alter transparency, and CSS blur cannot blur windows behind the app. Test `backgroundMaterial` on Windows 11 22H2+ and `vibrancy` on macOS independently. On unsupported hosts, do not invent translucency by faking a wallpaper.

A **native material capability adapter** should return supported modes per platform; the workbench should respond via consistent semantic tokens. Implement a solid-background fallback immediately. A future native code helper is only acceptable if justified, audited, licensed appropriately, maintained in the repo, and guarded per OS/version.

## Visual verification

- Compare real-process screenshots against screenshot at the same aspect ratio.
- Test with bright, dark, high-contrast and motion backgrounds outside the application.
- Test text contrast, split editors, compare/diff views, Git blame/gutters, disabled controls, notifications, autocomplete, tooltips, drag/drop and Webviews.
- Test with transparency off and OS reduce-transparency settings.
- Show 100%, 125% and 150% display scales and smaller viewport sizes.
- No synthetic app content in final screenshots: use the checked-out project and live Git state.
