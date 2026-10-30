# Windows native glass visual verification

The user's idle-window confirmation enabled the remaining on-PC visual checks. The first real packaged comparison found a defect: floating-panel mode paints an opaque background on the outer `.monaco-grid-view`. Transparent window and workbench backgrounds alone could not expose the native material. Fix `1600ef9e0f0` clears only that direct layout-grid background while the existing native-glass class is active. It does not clear nested editor grids, code backgrounds or terminal panels. Solid and accessibility modes retain the original grid background.

## Executed visual checks

The corrected source renderer was refreshed through the existing incremental resource-copy helper. Windows.Graphics.Capture images show real native windows over a separate red/blue or green/yellow diagnostic window. Those colors are test stimuli outside Codelad, not an embedded wallpaper or product design. The diagnostic windows and always-on-top state were removed after capture.

| Check | Observed result |
| --- | --- |
| Active Acrylic, changing external background | Title/activity/status chrome and exposed gutters follow the external colors; the code reading surface stays opaque |
| Mica across the same two external backgrounds | Sampled chrome/gutter pixels stay identical; Mica is not treated as live-window blur |
| Solid mode | Structural chrome and grid return to their opaque theme backgrounds |
| In-app reduced transparency | Opaque dark surfaces restored |
| Bundled high-contrast theme | Opaque black surfaces and high-contrast controls preserved |
| Inactive window | Native material de-emphasizes; code remains readable and whole-window opacity stays 1 |
| Dark and light themes | Code, Explorer content and controls retain their theme surfaces; native material remains on structural chrome |
| Command palette | Actual palette remains readable above the material; closed without executing a listed command |
| Application zoom and resizing | 125% at maximized size and 150% in a 900×700 window render; the small high-zoom code viewport is narrow with Explorer open, as expected from the inherited layout |

These are bounded visual observations, not a general accessibility certification. The physical display scale remained **1**. Application zoom does not establish 125%/150% Windows DPI acceptance. GPU/frame-time/power benchmarks, continuous-motion stress, additional monitors/compositors, OS-level accessibility preference changes and the other-host privacy/release gates remain open. Explorer content and code are intentionally opaque; this prototype does not implement the supplied future workbench redesign.

## Inspectable evidence

The [pixel comparison](validation/native-glass-2026-10-30/native-pixel-comparison.json) samples the same coordinates from native captures. Acrylic activity-bar pixels change from `[91,24,31]` to `[19,71,32]`, and gutter pixels change from `[224,27,45]` to `[12,169,52]`. The sampled editor background remains `[30,30,30]`. Mica's sampled activity/gutter values stay identical across both external backgrounds. These are screenshot RGB samples, not calibrated display measurements or performance metrics.

The same comparison also passed in the actual refreshed package at the normal chrome opacity of 0.85: its chrome samples change while its editor sample remains identical. [Packaged runtime results](validation/native-glass-2026-10-30/packaged-runtime-final.json) additionally verify the solid default, real edit/save, split editors, a real terminal and opaque reading surfaces. The app exits code 0 with a strictly parsed Chromium capture listing no URL hosts; all wider network coverage limits remain.

- [Acrylic red/blue](validation/native-glass-2026-10-30/fixed-acrylic-red-blue.png) and [green/yellow](validation/native-glass-2026-10-30/fixed-acrylic-green-yellow.png).
- [Solid](validation/native-glass-2026-10-30/fixed-solid.png), [reduced transparency](validation/native-glass-2026-10-30/fixed-reduced-transparency.png) and [high contrast](validation/native-glass-2026-10-30/fixed-high-contrast.png).
- [Mica A](validation/native-glass-2026-10-30/fixed-mica-background-a.png) and [Mica B](validation/native-glass-2026-10-30/fixed-mica-background-b.png).
- [Inactive](validation/native-glass-2026-10-30/fixed-inactive.png), [light theme](validation/native-glass-2026-10-30/fixed-light-theme.png) and [actual command palette](validation/native-glass-2026-10-30/fixed-command-palette.png).
- [125% application zoom](validation/native-glass-2026-10-30/fixed-zoom125-maximized.png) and [150% small-window application zoom](validation/native-glass-2026-10-30/fixed-zoom150-small.png).

The source startup watchdog notification visible in early captures recovered: the development extension subsequently responded to settings and command controls. It was cleared before later captures. Early helper attempts included an absolute output-directory argument where the incremental helper expects a repository-relative directory, a premature source-window lookup and an immediately captured palette frame before paint. These were corrected; only the rendered, inspected frames are retained under their final labels. A duplicate disposable source window was closed. No tracked user source edit or previous unsaved buffer was overwritten. The previous test app was already absent when this continuation began.

See the [trial/package report](native-glass-trial-2026-10-30.md) for current artifacts and packaged runtime results, and the [privacy ledger](privacy-open-checks.md) for unavailable checks. The CSS check and bounded design detector pass; prior successful TypeScript/privacy/window tests are reused because this fix changes only the CSS selector.
