# Native glass proof of concept

Latest Windows continuation: the idle-window comparison exposed an opaque floating layout grid. Fix `1600ef9e0f0` now has [native screenshot and pixel evidence](native-glass-visual-2026-10-30.md). See the [current trial artifacts](native-glass-trial-2026-10-30.md) for refreshed packaging and runtime scope. Older source-only/capture-blocked statements below describe the first checkpoint.

Updated 2026-10-30. This is an opt-in material adapter in the real Electron workbench, not the complete Codelad redesign or a release. The user authorized this phase while [unavailable privacy gates](privacy-open-checks.md) remain open. The supplied [research archive](design/README.md) informs later layout work; it does not expand this implementation into Scrollspace or Atlas.

## Try it from sources

Build and launch Codelad using the repository's development workflow, then set these **user settings**:

```json
{
	"window.codeladGlass.mode": "native",
	"window.codeladGlass.chromeOpacity": 0.85
}
```

Changes apply live. `mode` defaults to `solid`. `native` requests Windows Acrylic or macOS vibrancy. `mica` explicitly requests the Windows wallpaper material; it is not a promise of live blur of windows behind the app. `chromeOpacity` ranges from 0.6 to 1 and affects structural chrome only. `window.codeladGlass.reduceTransparency: true` restores solid surfaces. These settings have application scope, so repository settings cannot opt users into the experiment.

The title bar, activity bar, sidebars and status bar use existing theme colors with an adjustable tint. Editor and terminal reading surfaces retain their existing theme backgrounds. There is no whole-window opacity change, wallpaper image, CSS desktop blur, remote material service, new dependency or logo replacement.

## Capability and fallback

| Host or condition | Behavior | Evidence limit |
| --- | --- | --- |
| Windows 11 build 22621 or newer | Native `setBackgroundMaterial('acrylic')`; optional `mica` | Windows 11 build 26200.9168 / Electron 43.8.3 tested here |
| Older/invalid Windows version | Solid | Policy fixtures only |
| macOS, `native` | Native `setVibrancy('under-window')` adapter | Implemented, not run on a macOS host |
| Linux X11/Wayland | Solid | No compositor-specific blur implementation claimed |
| Reduced transparency or recognized high-contrast theme | Solid native policy | In-app preference and bundled high-contrast theme checked; OS preference was read, not changed |
| Applied custom high-contrast theme | Opaque renderer surfaces regardless of its name | The renderer checks the applied theme type; the underlying native material may remain configured |
| Native API failure | Opaque background and renderer fallback | Simulated API/cleanup failures covered by focused tests |

Theme/splash updates preserve the transparent window backing only while a material is active. Normal solid mode restores the theme background. The separate agent sessions window stays outside this experiment. Reduced-transparency/high-contrast behavior takes precedence over material preferences.

## Validation and limits

The source client transpiles and client types, targeted TypeScript lint, CSS lint and the bounded design detector are checked. The focused window selection passes **14 tests with one existing pending inset test**. The unchanged privacy/build/adapter/debugger/network selection passes **24 tests**. The detector reported no findings for the changed CSS/settings targets; this is a mechanical check, not aesthetic sign-off.

The actual Electron process was inspected with the Windows DWM read-only attribute `DWMWA_SYSTEMBACKDROP_TYPE` (38). It returned **3 for Acrylic, 2 for Mica, and 1 for solid**, with successful HRESULTs. Live settings, in-app reduced transparency, the bundled high-contrast theme, restore, resizing and maximize/restore are exercised through a disposable development extension. The applied-theme guard also covers a custom high-contrast fixture whose name contains no high-contrast marker. Local edit/save, split editors and a real terminal are included in that fixture. See [bounded runtime evidence](validation/native-glass-2026-10-30/README.md).

All ten final material/layout states pass. The live 0.85 chrome sample preserves opaque editor and terminal-panel backgrounds, with whole-window opacity 1. The final editor and extension host exit code 0; the completed Chromium log lists no URL hosts. This capture excludes Node/native, DNS and OS traffic and is not a replacement for the open privacy gates.

The first capture-blocked checkpoint established native API state, but missed an opaque layout grid. The [completed bounded Windows visual checks](native-glass-visual-2026-10-30.md) verify the fix: Acrylic follows changing external-window colors while code stays opaque, Mica does not follow those windows, and solid/accessibility, inactive, light/dark, palette and application-zoom states remain readable. Full visual/platform acceptance stays open: physical 125%/150% Windows DPI, continuous-motion/GPU/frame-time/resource measurements, OS-level reduced-transparency changes, macOS and the broader interaction matrix remain unverified. Application zoom is not OS DPI testing.

The earlier `3736c38819c` privacy installer and `1759a6844e2` initial glass trial are historical artifacts. Use the [current trial report and installer identity](native-glass-trial-2026-10-30.md). Keep `stable` unchanged until release gates pass.

## Sources

The adapter uses the checked-in Electron 43.8.3 declarations and official [BrowserWindow material APIs](https://www.electronjs.org/docs/latest/api/browser-window/), [native theme preferences](https://www.electronjs.org/docs/latest/api/native-theme) and [custom window limitations](https://www.electronjs.org/docs/latest/tutorial/custom-window-styles). Those APIs do not establish successful visual behavior on every GPU or compositor.
