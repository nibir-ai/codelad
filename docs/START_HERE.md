# Codelad: Codex engineering handoff

This package is a design-and-engineering contract for adapting a fork of the **MIT-licensed VS Code source** into **Codelad**. It is not a claim that the fork has been audited or modified already.

## How to use

1. Copy the files in this package into a `docs/codelad/` folder in the root of your VS Code fork. Preserve `reference/codelad-target.png` unchanged.
2. Open the fork in Codex at the repository root.
3. Paste the contents of `CODEX_MASTER_PROMPT.md` into Codex (or ask Codex to read it and execute **Phase 0 and Phase 1 only**).
4. Review the privacy audit and working build before authorizing Phase 2 window-material research.
5. Let each phase land as a reviewable, independently testable change.

## Golden rules

- Preserve the actual VS Code editor, accessibility, LSP, tasks, terminal, extension host, debugger, Git integration, workspace trust, and update/rebase feasibility.
- Real native transparency and OS/compositor blur where available; CSS only for within-app surfaces.
- No mocked graphs, fake Git history, or buttons with no real action.
- Source-based graph, coherent multi-pane layout, Git-first workflow, click-first task automation.
- No telemetry from Codelad. Optional third-party extensions/services have clearly disclosed independent policies.
- Do not turn the screenshot into a full-window wallpaper.

## External references

- VS Code telemetry documentation: https://code.visualstudio.com/docs/configure/telemetry
- VSCodium privacy documentation: https://github.com/VSCodium/vscodium/blob/master/docs/telemetry.md
- VSCodium gallery guidance: https://github.com/VSCodium/vscodium/blob/master/docs/extensions.md
- Electron window API: https://www.electronjs.org/docs/latest/api/browser-window
- Electron transparent-window limitations: https://www.electronjs.org/docs/latest/tutorial/custom-window-styles
- Kitty opacity/blur configuration: https://sw.kovidgoyal.net/kitty/conf/
