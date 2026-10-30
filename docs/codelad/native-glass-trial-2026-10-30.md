# Windows native glass trial

Current runtime build: **`1600ef9e0f0acb54792db8fc170b9e31aed263ad`**. This replaces the earlier `1759a6844e2` trial, whose floating-panel grid hid the native backdrop. All 26 minified desktop bundles rebuilt in 215.7 seconds; Windows packaging completed in 5.1 minutes. Unchanged staged built-in extension outputs were reused. This is a development trial, not clean release provenance or a stable release.

## Try it

- Unpacked app: `D:/VSCode-win32-x64/Codelad.exe`.
- Installer: `D:/codelad/.build/win32-x64/user-setup/CodeladSetup.exe`.
- Trial launcher: `D:/codelad/.build/codelad/Try-Codelad-Glass.cmd`. It enables native mode at chrome opacity 0.85 in separate preview user/shared/extensions directories. It does not modify the normal profile. Regular installation defaults to solid mode.

The [artifact metadata](validation/native-glass-2026-10-30/trial-artifact.json) records the current installer identity, size, SHA-256 and signature status. The installer was not installed. Preview files are local build artifacts, not repository source. Keep `stable` unchanged.

## Packaged validation

Packaged product privacy configuration passes. The refreshed app ran with fresh user/shared/extension directories and a disposable local validation extension; no personal credentials were copied. [Runtime results](validation/native-glass-2026-10-30/packaged-runtime-final.json) record Acrylic, Mica, solid and restored-Acrylic states, with a transparent outer grid only for native materials and an opaque editor throughout. Removing the explicit user setting restores the solid default.

Local edit/save was checked from disk. Split editors, a real terminal shell process and its echo output passed; the terminal panel remains opaque. A real diff editor and local webview rendered over native chrome. An early diff fixture contained literal escape characters; those were corrected before the final diagnostics-clear captures. Telemetry stays disabled, the app exits code 0 and its completed Chromium log lists no URL hosts. This capture excludes Node/native traffic, DNS and OS-level offline behavior.

Native [red/blue](validation/native-glass-2026-10-30/packaged-acrylic-red-blue.png) and [green/yellow](validation/native-glass-2026-10-30/packaged-acrylic-green-yellow.png) captures verify the actual package at chrome opacity 0.85. [Diff/terminal](validation/native-glass-2026-10-30/packaged-diff-terminal.png) and [local webview](validation/native-glass-2026-10-30/packaged-local-webview.png) captures supplement the [source visual matrix](native-glass-visual-2026-10-30.md).

## Remaining scope

The bounded Windows proof now includes native appearance, fallbacks and packaged local coding. Physical Windows DPI changes, GPU/frame-time/power performance, continuous-motion stress, arbitrary third-party renderers, macOS/Linux materials, packet/DNS isolation, live-account privacy, install/uninstall and signing remain open. Preserve the [privacy ledger](privacy-open-checks.md) and [delivery matrix](../PRIVACY_AND_TEST_MATRIX.md).

All fresh validation windows and diagnostic backgrounds closed after testing; temporary executable helpers were removed. Raw profiles/logs remain ignored under `.build/codelad/glass-native-final-2026-10-30` and `.build/codelad/glass-package-final-2026-10-30`. The earlier source NetLog after overlapping helper launches was invalid and is not network evidence; the final packaged run uses a separate path and passes strict parsing. The previous unsaved-window note is historical: that app was absent on resume, and no tracked user source edit was found or overwritten.

Stage `vscode-win32-x64-inno-updater` before `vscode-win32-x64-user-setup`. The first trial omitted this required step; the current build includes it. The user's offered generated image is welcome for the later redesign; this fix does not implement a replacement layout.
