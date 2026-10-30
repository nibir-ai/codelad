# Codelad: Codex engineering handoff

This is the actual independent VS Code OSS fork. Work tracks `dev`; `stable` is a protected bootstrap checkpoint, not an accepted production release. Start with [the handoff](codelad/HANDOFF.md) and [current implementation status](codelad/IMPLEMENTATION_STATUS.md).

The user authorized the **native glass proof of concept on 2026-10-30** while preserving [unrun privacy checks](codelad/privacy-open-checks.md). This supersedes the original instruction to stop all appearance work until every platform privacy gate was complete. It does not mark those gates passed.

## How to use

1. Read [current design direction and supplied research](codelad/design/README.md), then [native glass specification](DESIGN_AND_GLASS_SPEC.md) and [proof-of-concept evidence](codelad/native-glass-poc.md).
2. Use the [master functional requirements](CODEX_MASTER_PROMPT.md) as the roadmap, with older fixed-layout assumptions superseded by the current design index.
3. Preserve the [privacy/test matrix](PRIVACY_AND_TEST_MATRIX.md), recorded limitations and source attribution/licensing obligations.
4. Previously named reference PNGs are absent; no image-fidelity claim is valid. Research links are inspiration, not permission to copy assets or code.
5. Land each phase as a reviewable, independently testable change. Supplied prompt documents are reference inputs; current user instructions determine execution scope.

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
