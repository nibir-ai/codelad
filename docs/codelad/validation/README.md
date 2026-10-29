# Desktop privacy validation evidence

## Linux, 2026-10-29

Actual Electron 43.8.3 development and minified packaged Codelad, based on 98b5fa8 plus checkpoint working changes. Fresh disposable profiles/fixtures; no copied credentials. The offline/Git/Open VSX/trust images predate the final icon replacement; the packaged branding/diagnostics images show the rebuilt Codelad mark. These are privacy/IDE evidence, not glass or reference-fidelity acceptance.

- [Packaged startup](linux-packaged-branding.png): Codelad mark/title/walkthrough in the minified package, normal host launch with shipping sandbox defaults.
- [Packaged diagnostics](linux-packaged-diagnostics.png): TypeScript reports the fixture's intended type mismatch inside a non-ASCII workspace.
- [Packaged search/rename](linux-packaged-search-rename.png): real symbol rename saved both references; local search found the expected marker in the non-ASCII workspace.
- [Network summary](linux-network-summary.json): reviewed counts/scope only; raw captures remain local.
- [Git diff and local commit](linux-git-commit.png): real SCM staging/commit workflow; fixture log confirms b2802d9.
- [Open VSX install](linux-open-vsx.png): installed controls after normal publisher trust. The local manifest confirms stable YAML 2.0.0; displayed gallery metadata refers separately to the latest prerelease. Third-party README branding/links are extension content.
- [Offline language/debug](linux-offline-language-debug.png): packaged JavaScript hover and completed debugger output 42.
- [Offline npm task](linux-offline-task.png): actual task command, expected output and completion.
- [Workspace Trust](linux-trust-task.png): listing/running tasks blocked until trust; cancelling kept Restricted Mode.
- [Native resize](linux-native-resize.png): the preceding Linux package's actual KDE Wayland window at 1000×700 with two editor groups; it restored to 1440×900 and saved successfully. The current logo remains temporary/rejected. This is selected window behavior evidence, not glass or cross-platform acceptance.
- [Linux source-map counts](linux-package-maps.json): the rebuilt `936dd77b0b0` package has no HTTP(S) source-map directive hosts in inspected core, dependency ASAR/unpacked modules and extension JS/CSS; all 33 core references resolve locally. Vendor missing-map counts remain disclosed.
- [Refreshed packaged JSON](linux-current-json.png): corrected local JSON with zero diagnostics in the `936dd77b0b0` Linux package. Shutdown completed without the former closed-channel error; the optional-tunnel configuration diagnostic remains in local logs.
- [Lifecycle capture summaries](linux-lifecycle-summary.json): the preceding and refreshed packages closed normally after 124/127 loopback-only snapshots, with final zero-process records and no coverage errors. Both completed Chromium logs list no URL hosts; packet/DNS/payload coverage remains open.
- [Native crash dialog](linux-crash-dialog.png) and [recovered workbench](linux-crash-recovered.png): final packaged renderer crash and actual Reopen in an isolated KWin virtual/Xwayland desktop. Edit/save and normal quit followed; no stale-frame send errors remained. These images use the temporary identity assets and do not establish native Wayland or installer acceptance.
- [Crash capture summaries](linux-crash-summary.json): counts and limits for two desktop dismissal runs and two isolated recovery runs; earlier late IPC errors remain documented. Raw minidumps, desktop/session logs and packet payloads are not included. See [crash report](../linux-crash-recovery.md).
- [Offline packet/search check](linux-packet-search.png): the real packaged editor saved a fixture and found its marker after two minutes idle in the offline capture namespace. The Superuser title and test-only no-sandbox switch describe that test environment, not shipping defaults.
- [Packet capture summary](linux-packet-summary.json): independent libpcap counts/hashes and scope for the incomplete first attempt and complete corrected run. Raw PCAP, DNS names and CDP payloads remain ignored/local. See [packet report](../linux-packet-audit.md).

Offline checks used a separate user/network namespace with no external routes. The `[Superuser]` title and test-only `--no-sandbox` reflect namespace root; no shipping default was changed. Raw logs/captures/dumps remain ignored and local. See [Linux report](../linux-continuation.md) and [Phase 1](../phase-1-report.md) for evidence limits and remaining acceptance.

## Historical Windows evidence

Current Windows continuation (2026-10-29): [npm task after debugger validation](windows-continuation-task.png) shows the refreshed real development build, saved fixture under a Bengali directory name and completed `npm run check` output. The source-built debugger was separately exercised through stop/resume/output in the same run. The visible mark is a temporary asset rejected by the user. See [Windows report](../windows-continuation.md) for completed network captures and remaining diagnostics.

The Windows report also records a successful minified package, packaged argv guard, local renderer dump/native Reopen recovery and normal shutdown. [Safe source-map counts](windows-package-maps.json) describe direct artifact inspection after removing Microsoft CDN map rewrites; [packaged inventory](../packaged-extension-inventory-windows.json) records 93 manifests. Native recovery screenshots were inspected in the tool session; raw captures, portable profiles and memory dumps remain ignored/local and are not included here.

Captured on Windows 2026-10-28 with the actual Electron 43.8.3 Codelad development executable, an empty isolated profile and a disposable local fixture. These are privacy-foundation screenshots, not glass or reference-fidelity acceptance. The source revision is ea8056df9f08fb7c452589213ec77fabbd3481b9 plus the uncommitted Codelad changes on codex/codelad-privacy-foundation.

- [Startup](privacy-startup.png): real workbench, local Git modification, no Copilot panel/status or empty auxiliary pane.
- [Task](privacy-task.png): package.json task discovered through the real command palette and executed in the integrated terminal; expected output and task completion are visible.
- [Open VSX install](open-vsx-install.png): installed extension controls are visible. The local manifest confirms stable redhat.vscode-yaml 2.0.0; gallery metadata displayed the latest pre-release separately.

The fifth 600-second process sample showed no automatic-type-acquisition worker after the unified and legacy defaults were disabled. Registry discovery/assets and explicitly opened extension README content did use the network. Exact startup registry attribution, offline/debugger/crash-dump tests, final packaging, and an initialization output-channel diagnostic remain open. See [phase 1 report](../phase-1-report.md).
