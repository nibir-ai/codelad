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
