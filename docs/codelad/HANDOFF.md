# Codelad handoff

Updated 2026-10-29 (Asia/Kolkata). Checkout `/home/nibir/GitHub/codelad`, branch `codex/codelad-privacy-foundation`, remote `https://github.com/nibir-ai/codelad.git`. Git author is `nibir-ai <nibir.github@gmail.com>`. This continues Phase 0/1 of the real VS Code fork; the full product remains unfinished. Original requirements in `docs/START_HERE.md`, `CODEX_MASTER_PROMPT.md`, `DESIGN_AND_GLASS_SPEC.md` and `PRIVACY_AND_TEST_MATRIX.md` remain intact.

The current user instruction is to continue implementation and **update this handoff, commit and push when the five-hour Codex allowance reaches approximately 5% remaining**. Earlier Windows handoff-only instructions are historical, superseded by the user's Linux continuation. The account's read-only `account/rateLimits/read` API supplies the 300-minute usage window. Check between substantive batches; do not interpret 5% used as the threshold. Commit/push authorization is already given; respect Git hooks and signing. Never put credentials in remotes, source, logs or documentation.

## Checkpoint

The read-only usage meter reported **95% used / 5% remaining** on 2026-10-29 at checkpoint preparation. Implementation stopped at that threshold. The code commits below and this documentation are being committed/pushed together to `origin/codex/codelad-privacy-foundation`; verify remote HEAD when resuming. This is a checkpoint of unfinished Phase 0/1, not permission to start Phase 2.

## Current changes and verified behavior

Implementation commits: `88b3cbd3119` (source-built debugger/Linux capture/packaging) and `2091396252c` (identity assets and welcome title). The accompanying documentation checkpoint records runtime evidence and remaining work. Inspect branch HEAD rather than assuming packaged metadata points at these commits.

The downloaded JS debugger is now built from pinned upstream source as `ms-vscode.js-debug` **1.140.0-codelad.1**. Its telemetry reporter is inert and experimentation returns local defaults. All esbuild bundle inputs are checked for the removed collector packages; the source manifest drops TAS. SHA-verified source, lockfile, original replacement inputs and upstream bundler are pinned. Legal notices from the verified upstream VSIX are preserved. There is no fallback to its upstream runtime bundle. See [debugger recipe](js-debug-build.md), [current downloaded inventory](downloaded-extension-inventory.json), and [historical upstream inventory](downloaded-extension-inventory-upstream.json).

A real fresh Linux launch exposed automatic native Hunspell dictionary requests to Google CDN despite workbench `spellcheck:false`. The app now clears native spellchecker languages and disables it when each Windows/Linux Electron session is created. macOS native behavior is unchanged. Afterward a new run had no Chromium URL hosts and no nonloopback socket samples before explicit extension browsing (207 one-second samples). This is limited observed evidence, not universal zero-network proof or attribution of the historical Windows registry requests.

Actual Linux desktop checks passed: editor save, debugger breakpoint/resume and output 42, integrated terminal/npm task, Git diff/stage/local commit, and stable Open VSX YAML 2.0.0 installation with the normal publisher trust prompt. A packaged minified Linux build works with no external routes in a disposable user/network namespace: edit/save, JavaScript hover, debugger breakpoint/resume and npm task all succeeded. Namespace root required test-only `--no-sandbox`; no product setting was changed. Its completed Chromium log contains no URL hosts. The final Linux sampler was additionally exercised there for ten samples, with no unreadable entries or unparsed owned rows and only automation loopback sockets.

Linux `ss` process-tree capture is now available alongside the Windows helper. It tracks all task-thread children and PID start times, redacts process names/arguments, and reports unparsed owned rows as incomplete coverage. Sampling can miss short-lived sockets, startup races, unconnected UDP/DNS or unreadable processes. NetLog omits Node/native transports. Neither capture is packet/payload validation.

Full built-in compilation uncovered an undeclared markdown-math `fs-extra` import; it now uses Node fs. Packaging tried to prepare an excluded Copilot SDK shim; it now skips that step when Copilot is excluded.

## Validation

- Pinned Node 24.22.1 / npm 11.19.1; full `install-fast` succeeded after priming Electron 43.8.3 headers from the official artifacts endpoint. No dependency locks were changed by setup.
- Client transpile: 10,863 TypeScript files / 2,362 resources; full built-in extension build passed.
- Client types, build-tool types and source debugger types passed. Targeted ESLint passed; final targeted validation is recorded in the Linux continuation report.
- Renderer selection: **174 passing**; combined core/agent/provider Node selection: **71 passing**; focused privacy/adapter/debugger/network/Linux parser selection: **20 passing**.
- `gulp vscode-linux-x64-min` built all minified bundles, then failed at the excluded Copilot shim. After the guard fix, `gulp vscode-linux-x64-min-ci` reused those bundles and packaged successfully.
- Output `/home/nibir/GitHub/VSCode-linux-x64` (~1.1 GB) passes packaged product privacy checks. Packaged inventory contains **93 manifests**, no declared telemetry dependencies, no bundled Copilot, and the source-built debugger/notices. Manifest scans cannot detect every undeclared embedded SDK.
- Screenshots: [validation](validation/README.md). A rebuilt branded package additionally passed non-ASCII workspace rename/save, TypeScript diagnostics, file watching, local search and restart/tab restoration. A 180-second socket sample observed only loopback with no coverage errors; normal shutdown and restart logs listed no Chromium URL hosts. Arbitrary native resize remains untested. Raw evidence is ignored/local under `.build/codelad/runtime-linux-2026-10-29/`. The package was built from 98b5fa8 plus these working changes; its embedded commit metadata is not a release attestation.

## Remaining acceptance and next steps

1. Local dump/trust/startup guard checks ran: task trust cancellation retained Restricted Mode; native renderer crash produced a local minidump; enabling crash reporting through a disposable portable argv.json did not start a crash handler. The native crash recovery dialog stalled graceful shutdown and required exact-tree forced cleanup, leaving truncated NetLog. Finish native recovery and stronger upload/shutdown capture; cross-platform behavior remains unverified. See the Linux report.
2. Investigate the one development extension-host `Unexpected SIGPIPE` after a successful debuggee exit. The packaged offline debug run did not log an application error. Historical Windows output-channel diagnostics and the precise pre-browse registry caller still require Windows reproduction/attribution.
3. Run the remaining privacy/IDE matrix: broader language/search scenarios, native resizing, richer Git workflows, third-party activation boundaries, payload/DNS capture and cross-platform distributions. Do not claim Phase 1 accepted from Linux smoke tests alone.
4. Codelad app/title-bar/web/installer icon assets are now generated from the local SVG; validate native Windows/macOS installers and audit remaining branding text/document icons. No reference images are present. Native glass, redesigned workbench, graph, command center, integrations and persistent layouts remain pending and should follow privacy acceptance.

## Local continuation commands

```bash
cd /home/nibir/GitHub/codelad
export PATH=/home/nibir/.cache/codelad/runtimes/node-v24.22.1-linux-x64/bin:$PATH
node --test build/codelad/privacy.test.ts build/codelad/extensionPrivacy.test.ts build/codelad/jsDebug.test.ts build/codelad/networkAudit.test.ts build/codelad/linuxConnections.test.ts
node build/codelad/check-privacy.ts /home/nibir/GitHub/VSCode-linux-x64/resources/app/product.json
npm run download-builtin-extensions
```

Use the repository [launch skill](../../.agents/skills/launch/SKILL.md), isolated empty profiles and unique Playwright session names. For Electron tests on this host scope `MANGOHUD=0`; never copy the user's authenticated profile for privacy checks. The CLI entry is `node node_modules/@playwright/cli/playwright-cli.js`. Run packaged namespace automation inside its held shell; its loopback CDP is unreachable outside the namespace.

No test editor, sampler, held shell or named Playwright session is intended to remain active. Exact disposable profiles were cleaned after preserving logs/dumps under ignored evidence. See [Linux report](linux-continuation.md) for exact evidence and cleanup state. The [Windows handoff](handoff-windows-2026-10-28.md) is historical and must not override this file's instructions.
