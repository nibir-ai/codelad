# Phase 1 report: telemetry removal and privacy foundation

Updated 2026-10-28. In progress. The full Codelad product goal remains active; the user's latest instruction is to remove telemetry implementations, rather than retain collectors behind defaults.

## Implementation

- Core `TelemetryService` and 1DS appenders are inert compatibility APIs: no SDK initialization, buffers, timers, payload processing or telemetry identifiers. Telemetry level always returns NONE regardless of configuration. Settings expose only off.
- Root, remote-server and remote-web manifests and locks remove Microsoft 1DS, TAS and device-ID dependencies. Ten built-in extensions use the local `build/codelad/no-telemetry` adapter instead of Microsoft telemetry/experimentation packages. It has no runtime dependencies and supports CommonJS and ESM. Its declaration build uses separate temporary output per preparing process.
- GitHub/Microsoft agent senders contain no upload, compression, envelope or identity implementations. Agent Host's OTel receiver, forwarding, span database and identity collector have been replaced with the existing null API. Codelad-owned agent child environments strip inherited tracing/export configuration. Codex analytics/feedback/exporters and Claude trace exports are disabled. Project terminal environments remain user-controlled.
- Debug custom endpoint telemetry contains no collector child creation. Automatic crash reporter startup and uploads are removed; explicit local dump collection has no submit URL. MAC hashing, Windows SQM reads and the native device-ID package are removed. A random local UUID remains for non-telemetry storage/remote API compatibility; telemetry service identifiers are empty.
- Remote TAS assignment and polling are removed. Explicit local development overrides remain, without claiming remote assignments. Extension experiment APIs return defaults without state reads or requests.
- Codelad branding covers executable/profile/installer/protocol identities; upstream MIT notices remain. Open VSX is the registry. Default Copilot, voice, auth-trust and webview-CDN bindings are removed. Source scans and packaging omit bundled Copilot; excluded upstream Copilot source remains for rebasing.
- Background app/extension updates, recommendations, npm hints, JS/TS automatic type acquisition and Git autofetch default off. Optional user-selected developer integrations remain available. No arbitrary extension firewall is claimed.
- Product packaging checks reject telemetry/cloud bindings, identifying gallery headers and nonempty automatic built-in update lists. An explicit empty update list is required by the upstream extension scanner.

## Executed validation

| Check | Observed result and limits |
| --- | --- |
| Client transpile | Full builds pass (latest 10,863 TS files, 2,362 resources); file-granular refreshes include the latest startup and ATA defaults. |
| Root source types | Passed after agent policy, custom-endpoint removal and account-policy regression test; passed again after the chat registration and ATA defaults. |
| Full built-in extension compile | Passed with zero extension type errors after CommonJS/ESM adapter repair. |
| Build tooling types | Passed after fixing declaration resolution in the adapter-export test. |
| ESLint | 88 changed/new TS/MTS files passed; 11 later provider/startup files passed. Final chat-registration and adapter-concurrency edits need their focused follow-up. |
| Browser suites | 138 passed across telemetry, removed transport, assignment, gallery and default-account tests. Predates final chat registration changes. Runner printed a resource 404 but completed successfully. |
| Core/agent Node suites | 11 passed covering identity, internal/restricted senders, removed OTel collector, local timing sanitization, custom endpoint and error sentinel. |
| Provider launch suites | 27 Claude/Codex tests passed, preserving credential/MCP/resume/permission behavior while disabling telemetry. Focused Copilot inherited-export regression plus sentinel: 2 passed. |
| Chat entitlement/setup | 11 passed, including clearing account restrictions without revealing missing-provider UI. |
| Policy/adapter/network tools | 9 passed. Adapter-only 3 tests passed again after concurrent prepare output isolation. |
| Live Open VSX API | Adapter query returned redhat.vscode-yaml on 2026-10-28. In-editor stable YAML installation completed in the fifth isolated profile: the installed manifest is redhat.vscode-yaml 2.0.0, MIT. The standard publisher trust prompt was preserved and accepted only in the disposable test profile. This is not a universal signature/compliance audit. |
| Source extension inventory | 95 source manifests plus 3 pinned downloaded manifests recorded. The downloaded JS debugger still declares vscode-tas-client; its bundle audit/removal remains open. |

## Actual desktop observations

The real `.build/electron/Codelad.exe` launches through the repository launch skill, with empty user/extensions/shared-data profiles and a disposable local fixture. Existing profiles and credentials were not copied.

1. First launch, extensions disabled: screenshot was blank because onboarding asserted a default Copilot agent at module load. The assertion is now lazy, and AI onboarding is skipped without a provider.
2. Second launch, built-ins enabled: workbench rendered, but scanner iteration failed on a missing automatic-update list and unwanted chat UI was shown. The product now supplies the required empty list.
3. Third launch: Monaco opened and saved hello.js; the integrated PowerShell terminal ran node hello.js and displayed the expected output. Git detected the fixture repository and branch. Account-policy handling reset the no-provider hidden state; this is fixed and covered by an executed regression test. The source extension host temporarily became unresponsive, and a save-participant timeout was logged, although the file saved.
4. Fourth launch: Copilot status/content disappeared after the account-policy fix, but initial chat construction/disposal caused a ChatViewPane error and left an empty sidebar. Chat registration now requires a configured default or a real contributed participant; the secondary sidebar defaults hidden. The fifth launch was visually inspected: no Copilot panel/status and no empty secondary sidebar remained. A final no-provider sentiment guard was added after that run to prevent output-channel registration during initialization; its runtime retest is still pending. Duplicate output-channel creation and development extension-host startup warnings also need investigation or packaged-build comparison.

Screenshots and raw captures remain under `.build/codelad/runtime-2026-10-28*`. They contain only the disposable fixture, but raw network logs are kept local and must be reviewed before publication.

## Outbound finding

All four completed Chromium NetLogs contained no HTTP(S)/WebSocket URL hosts. TCP sampling of the initial faulty startups saw only loopback; this is limited evidence and does not establish zero network behavior.

After JS/terminal activity in the third run, a short-lived Node child connected to external HTTPS. The improved fourth capture established this chain: TypeScript server -> automatic-type-acquisition worker -> command shells -> npm, with npm contacting external port 443. The unified JS/TS migration reader ignores default-only unified values and falls back to its legacy setting. Codelad now supplies both the unified opt-out and the legacy compatibility default. The fifth fresh profile recorded no automatic-type-acquisition process during the 600-second sample, including JavaScript open and terminal activity. A later npm child was explicitly launched through the Run Task UI, rather than the type-acquisition chain.

Process capture now records editor-owned parent IDs and coarse known roles without persisting command lines, arguments or private paths. Sampling can miss startup/short-lived connections and UDP/DNS; Chromium logs omit Node/extension-host transports. No universal zero-network or phase acceptance claim is made.

## Fifth-run evidence

Monaco and terminal worked again. The command palette discovered the real package.json `npm: check` task, displayed its `node hello.js` command, and the task completed with expected output. The normal Open VSX search and stable extension installation succeeded without changing trust/signature policies. Installed YAML 2.0.0 was confirmed from its on-disk manifest; the gallery pane continued showing latest pre-release metadata (2.1 daily), so the screenshot alone is not the installed-version authority.

The finished Chromium capture lists open-vsx.org, openvsx.eclipsecontent.org, img.shields.io and raw.githubusercontent.com. Open VSX discovery/icon requests occurred before explicit extension browsing; that startup trigger remains to be traced. Explicit browsing/install fetched YAML assets and its README badges/images. These are recorded as registry/content traffic, not silently accepted as telemetry-free. No telemetry collector hostname was seen in the captured flows; that observation does not prove all future or vendor behavior.

The registry header helper now has no code path for machine/session IDs. It identifies the client as Codelad. A live query using the freshly compiled helper returned HTTP 200 and redhat.vscode-yaml with no user/session headers.

Safe screenshots are in [validation](validation/README.md). Raw captures remain ignored/local. Product packaging now also checks direct runtime dependencies across root/server/web and included built-ins against the removed collector SDKs; this is narrower than a full transitive binary audit.

## Downloaded debugger boundary

The three pinned downloaded extensions declare MIT licenses. The downloaded `ms-vscode.js-debug` 1.140.0 manifest still declares `vscode-tas-client`, and its compiled extension bundle requires a separate transport/experiment audit and derivative rebuild if collector code is included. The new dependency guard covers source manifests; it does not yet sanitize these precompiled downloaded artifacts. Do not claim all shipped collector SDKs removed or Phase 1 accepted until this boundary is resolved while preserving debugging. See [downloaded extension inventory](downloaded-extension-inventory.json).

## Remaining acceptance

Verify the repaired clean startup and ATA opt-out; test real language features, tasks, debugging, Git actions, an Open VSX installation and offline operation. Audit explicit local crash dumps, shutdown, downloaded debugger bundles and final packaged product/dependencies/extensions. Compare source-only test extensions and development diagnostics against packaged behavior. Complete Codelad icon/packaging branding.

The full objective also includes native glass, rebuilt workbench, source graph, Git workspace, command center, developer integrations and persistent keyboard-first layouts. Reference images are absent, so visual fidelity cannot currently be verified.
