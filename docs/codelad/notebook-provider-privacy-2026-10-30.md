# Notebook and provider privacy checks, 2026-10-30

This continues the user's request to package the GitHub history fix and finish notebook/provider checks possible on this Windows PC. No additional platform hosts are available. Stronger OS isolation, packet/DNS inspection and macOS acceptance remain separate, unverified requirements.

## Notebook behavior

The packaged baseline refreshed from `af6ab194bf1` includes the default-off GitHub avatar fix and passes product policy. Controlled notebook loading reproduced three network effects from saved content: remote Markdown image GET, HTML-output image GET and an HTML-output script POST. The old notebook CSP was optional and absent by default; enabling its experimental switch alone still allowed remote resources.

`notebook.output.allowRemoteContent` now defaults off and is application scoped, so a repository cannot enable it. A local-resource CSP applies independently of the experimental CSP switch and covers notebook Markdown and outputs, including fetch, frames, media, fonts and form submission. Local/embedded content, inline renderer scripts and local workers remain available. Opt-in preserves the original renderer behavior and the existing experimental CSP choice. Changing either setting reloads the notebook back layer through its existing initialization/restoration path. Kernels, extension-host code, explicitly opened links and selected remote workspaces remain separate boundaries; this is not an extension or kernel firewall.

## Executed checks before final packaging

- Client transpile and client TypeScript checking pass. Targeted lint passes.
- Seven selected Electron unit tests pass: two new notebook policy cases and five existing cell-output cases. The policy cases cover both legacy switch values, local resource sources and explicit opt-in compatibility.
- The real development workbench passes six controlled notebook/provider default/opt-in/opt-out cases. Local notebook images, HTML output and an inline script render while remote requests are blocked. Opt-in renders both remote images and completes the expected POST with the fixture body. Opt-out reloads local content, blocks both images and stops requests. A real notebook cell edit/save preserves both saved outputs.
- The completed development Chromium capture lists only `127.0.0.1` (12 URL events). Its late-started TCP sampler completed in 5.61 seconds with three loopback connection states. This sample covers only the end of the action, not startup/idle/DNS or all transports. The editor exited normally with code 0.
- The packaged baseline also verified `github.showAvatar` false and core telemetry false. It reproduced the notebook network issue and the rich-link default/opt-in behavior; an early test asserted watcher disposal too soon and is not counted as a complete pass.

## Provider payload checks

The actual GitHub extension-host suite now passes **five tests**, including a real Octokit GraphQL transport test against a controlled loopback HTTP server. The real history provider produces no request before opt-in, then exactly two POSTs to `/graphql`: assignable-users variables `{owner, repo}` and commit-author variables `{owner, repo, commit}`. The JSON bodies contain only `query` and `variables`; the returned avatar map is correct. A fixture-only authorization token is sent to that deliberately selected local endpoint. No machine/session/cookie header names are present. Opt-out prevents additional calls. The test never reads a real account, substitutes no global network function and restores its user setting. This is a controlled endpoint/client injection test, not a live signed-in GitHub audit or avatar-image payload capture.

The real Markdown rich editor also exercises the proposed link-presentation API with a selected local fixture provider: default off creates no watcher or HTTP request; opt-in displays the returned metadata after a POST containing only the selected resource URL; opt-out stops new requests and releases the watcher. The workbench intentionally retains unused shared watchers for **five seconds** (`watcherReleaseDelay`); the final fixture waits for that release. Another consumer of the same shared watcher could keep it alive, so disabling Markdown rich links is not a global provider shutdown. No real account or token is used by this fixture. This complements, rather than replaces, the built-in GitHub transport test.

Raw fixture profiles, captures, notebook data and logs are ignored under `.build/codelad/notebook-provider-privacy-2026-10-30/`. Final packaged/installer evidence and cleanup are recorded below after the combined build; do not infer them from source checks.

## Final expanded checks and artifacts

The requested controlled checks on this PC are complete. Implementation **`3736c38819cf748c2fabd17fd0415e05a20baac6`** is pushed, and its [source-policy CI run](https://github.com/nibir-ai/codelad/actions/runs/41009524062) succeeded. All **26 desktop bundles** were rebuilt in **156.140 seconds**; final Windows packaging completed in **3.27 minutes** and product policy passes. The app at `D:/VSCode-win32-x64/Codelad.exe` identifies this implementation commit and includes both the GitHub avatar fix and the notebook policy. Later audit-helper/documentation commits do not change its runtime sources.

The expanded development run and final packaged run each pass all **six** notebook/provider default/opt-in/opt-out phases. Their fixture workspace attempts to set all three opt-ins true in `.vscode/settings.json`; the actual defaults remain false for notebook networking, Markdown rich links and GitHub avatars. Only a user-setting change enables them. These known disposable workspaces use the process-scoped workspace-trust bypass to exercise renderer scripts without an interactive trust prompt; they do not certify Workspace Trust behavior. No authenticated profile was copied.

Notebook opt-in positive controls reach nine paths: Markdown and HTML-output images, a stylesheet, a real font file, an iframe, form submission, beacon, fetch POST and WebSocket upgrade. The stylesheet visibly applies and the WebSocket opens. By default and after opt-out the server receives zero requests, local images/HTML/text/scripts still render, and the active WebSocket closes on opt-out. A real cell edit/save retains both existing outputs; the screenshot's input `print(43)` and earlier output `42` reflect preserved saved output, not a newly executed kernel result. No kernel execution was requested.

The final packaged Chromium log contains **35 URL events** for the expected loopback host only, plus **one empty `WEBSOCKET_ALIVE` lifecycle event**. The audit helper now counts that recognized empty lifecycle metadata separately rather than treating it as an invalid request or local request. Other malformed/empty URL events are still rejected, with regression coverage. This is a parser classification fix, not dropped outbound traffic. The final packaged TCP sampler completed in **22.40 seconds** with five observed connection states and zero nonloopback endpoints; the expanded development sample completed in **71.79 seconds** with eight loopback states. Both editors exited normally with code 0. Chromium omits Node/native transports; the provider server independently observes its Node request, and sampling still omits UDP/DNS and may miss short connections/startup races. These are controlled-action checks, not universal idle/offline/payload proof.

The final focused privacy/build/adapter/debugger/network selection passes **24 tests**; notebook/output selection **seven**; actual GitHub extension-host suite **five**. Client types/transpile, the extension build and targeted lint pass. The rich-link watcher is released after its existing five-second grace period, with no new fixture request after opt-out. An early baseline assertion before that grace period and one early CDP attachment before a workbench page existed are retained as incomplete harness attempts, not passes.

The user installer was rebuilt from the final app in **276.453 seconds**:

- File: `D:/codelad/.build/win32-x64/user-setup/CodeladSetup.exe`
- Size: **251,268,206 bytes**
- SHA-256: **`0f4d93f6485cd78302df78c27050b9d88a53035016fca23f9aa3d337a7b2f57a`**
- Version metadata: **Codelad / Codelad Contributors**; signature **NotSigned**.

The installer is a local development artifact. It was not installed; install/uninstall, signing and clean-release provenance are not accepted by this batch. Reviewed [screenshots and safe summary](validation/README.md) contain no raw profiles, account tokens or request-header values. All test editors, servers, samplers and build jobs are closed, and temporary execution helpers were removed.

## What remains outside these controlled checks

Live-account provider behavior, arbitrary third-party extensions/renderers and kernels, remote workspaces, stronger packet/DNS/payload coverage, genuine Windows OS isolation, macOS and remaining Linux recovery/platform cases remain unverified at their previously recorded scope. The user has no additional hosts available. Do not repeat blind disconnect requests or convert Chromium-only controls into an offline claim. Full Phase 1 acceptance and the later native-glass/workbench/graph/integration objective remain unfinished; `stable` is unchanged.
