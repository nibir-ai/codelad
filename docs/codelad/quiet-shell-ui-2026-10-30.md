# Quiet Shell development trial

The user confirmed Quiet Shell should be the default on `dev`. It is a working first composition layer over the existing editor, Explorer, SCM and terminal. The application-level `workbench.codeladShell.enabled` setting and **Codelad: Toggle Quiet Shell** restore the conventional title area and pre-shell tool composition. Custom themes remain selected; Codelad Graphite is the new default dark theme. Native glass remains opt-in, with opaque code and terminal surfaces.

## Implemented behavior

Focus hides secondary panes, Explore exposes files, Review opens SCM and Operate exposes the terminal. The actual editor groups stay shared. Each workspace remembers pane visibility, visible containers and sizes in machine-only storage. Pins keep sidebar/panel areas visible across contexts; they are visibility pins, not arbitrary per-view tools. Reset Current Context restores its default composition using the workbench's remembered pane dimensions.

The task capsule lists up to five visible configured tasks, with declared command/directory details when available, then the standard all-task/configuration/terminal/palette actions. Variables remain declared rather than pretending to show resolved values. No task runs on startup or picker cancellation. The normal task service and trust flow execute the selection. The repository HUD observes the active existing SCM provider's branch and pending-entry count; it does not fetch history or invent ahead/behind data.

## Keyboard map

| Action | Windows shortcut |
| --- | --- |
| Focus / Explore / Review / Operate | Ctrl+Alt+1 / 2 / 3 / 4 |
| Previous / next context | Ctrl+Alt+PageUp / PageDown |
| Project Actions | Ctrl+Alt+P |
| Navigate focused context strip | Left / Right / Home / End |
| Pointer context cycling | Alt+wheel over strip |

Choose Workspace Context, Pin Tool Areas, Reset Current Context, Focus Context Strip and Toggle Quiet Shell are also available through the Codelad command category. Narrow windows show the active context plus a picker; native-titlebar users retain commands and shortcuts.

## Validation and scope

Native screenshots in [the evidence folder](validation/quiet-shell-2026-10-30/) compare the same real copied source file and project before/after, all four contexts, the configured task picker, 900×700 compact layout and high contrast. The wide captures use 1440×900. A fresh independent design review returned `ship`, with no material fixes, at this prototype's contract. The mechanical detector returned no findings. This is a code-led implementation; no generated UI comp is presented as application evidence.

Client types, targeted ESLint and stylelint pass. The Electron selection passes 14 state/material/theme tests; the existing privacy/build adapters pass 24 tests. Runtime checks establish default-on shell/Graphite, four actual pane compositions, identical editor URI/caret/scroll/group count during switching, keyboard shortcuts and disable/restore. The actual configured Node task produced its expected local completion marker; the first disposable fixture run failed because its CommonJS script inherited the repository's ESM package scope, corrected with a fixture-only package declaration before the successful rerun. SCM changed from two to four actual pending entries as fixture files were added.

These are functional observations, not performance benchmarks. The first source fixture became ready in 52.4 seconds, including development startup, extension activation and opening a real file. No controlled startup/frame-time/memory/power comparison is claimed.

The final clean source run at `856aab4dac6` also verifies pin/unpin returns Focus to its underlying composition, compact-strip arrows/Home/End, sidebar width restoration and restart into the saved Review context. An earlier test assumed every restart began in Focus; that harness assumption was corrected. Opening visible tools now awaits the real view composite and settles picker focus before applying visibility; the terminal uses its actual registered container ID. Diagnostic prototype patches were confined to disposable processes and are absent from the final clean run. See `source-layout-keyboard.json` and `source-restored.json` in the evidence folder.

Full semantic Atlas relationships, horizontal Scrollspace, arbitrary tool pins, complete utility integrations, physical DPI and performance remain future work. Preserve [the privacy ledger](privacy-open-checks.md): no isolated Windows offline or packet/DNS run, live-account universal provider proof, arbitrary extension/kernel boundary or unavailable host test is claimed. Keep `stable` unchanged.

## Package

The unpacked Windows app `D:/VSCode-win32-x64/Codelad.exe` identifies **`856aab4dac631e7d06d45f020e37f5cda56bc9b3`**. All 26 desktop bundles rebuilt in 165 seconds; Windows assembly completed in 4.92 minutes. Updated Graphite manifests/theme are present. Product privacy configuration passes. Packaged runtime checks pass all four compositions with the same editor/caret/scroll/group count, disable/restore, shortcuts, pin/unpin and pane-width restoration. The final test process exited normally, code 0; its strictly parsed Chromium log lists no URL hosts. See `packaged-runtime.json`, `packaged-layout-keyboard.json` and `packaged-a-network.json` in the evidence folder. This does not cover native/Node transports or DNS.

Try `D:/codelad/.build/codelad/Try-Codelad-UI.cmd` for a separate preview profile, or open the unpacked app directly. The preview uses solid mode; native glass remains optional. It does not modify the normal user profile.

At the user's 5%-remaining checkpoint, the **new installer was still compressing**, under exec session 67737. Its log is `.build/codelad/quiet-shell-2026-10-30/installer.log`. Do not identify, hash or distribute `CodeladSetup.exe` as the final UI installer until this build exits successfully. On resume, check completion, record size/SHA-256/signature and update this report. It remains unsigned development packaging, not an installed or stable release. The build may finish without further agent activity; no automatic continuation or push is requested.
