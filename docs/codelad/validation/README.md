# Desktop privacy validation evidence

Captured on Windows 2026-10-28 with the actual Electron 43.8.3 Codelad development executable, an empty isolated profile and a disposable local fixture. These are privacy-foundation screenshots, not glass or reference-fidelity acceptance. The source revision is ea8056df9f08fb7c452589213ec77fabbd3481b9 plus the uncommitted Codelad changes on codex/codelad-privacy-foundation.

- [Startup](privacy-startup.png): real workbench, local Git modification, no Copilot panel/status or empty auxiliary pane.
- [Task](privacy-task.png): package.json task discovered through the real command palette and executed in the integrated terminal; expected output and task completion are visible.
- [Open VSX install](open-vsx-install.png): installed extension controls are visible. The local manifest confirms stable redhat.vscode-yaml 2.0.0; gallery metadata displayed the latest pre-release separately.

The fifth 600-second process sample showed no automatic-type-acquisition worker after the unified and legacy defaults were disabled. Registry discovery/assets and explicitly opened extension README content did use the network. Exact startup registry attribution, offline/debugger/crash-dump tests, final packaging, and an initialization output-channel diagnostic remain open. See [phase 1 report](../phase-1-report.md).
