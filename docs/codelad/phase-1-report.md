# Phase 1 report: telemetry removal and privacy foundation

Updated 2026-10-29. **In progress**, with a built and exercised Linux distribution. This is not acceptance of the full product or of every platform/privacy scenario. Original requirements are preserved. Earlier Windows observations and totals remain in [historical handoff](handoff-windows-2026-10-28.md).

Windows continuation now also builds a minified development package. It exposed and removed packaging's Microsoft CDN source-map rewrites, and exercised the packaged crash argv guard, explicit local renderer dump, native Reopen recovery and normal shutdown. Uploads remained disabled; completed Chromium logs contained no URL hosts within the documented capture scope. See [Windows report](windows-continuation.md), [source maps](packaging-source-maps.md) and [93-manifest Windows inventory](packaged-extension-inventory-windows.json). This does not complete offline, installer, payload/DNS or cross-platform acceptance. The user rejected the current mark and will supply its replacement.

The Windows JSON deactivation failure was also fixed by retaining its output channel through async client shutdown. A corrected cleanup-order fixture and focused lifecycle tests pass (43 total); both development and refreshed packaged runs exercised syntax diagnostics and clean LSP shutdown without the old failure. The Windows report preserves earlier failing evidence and the later successful checks.

## Implementation

- Core `TelemetryService` and 1DS appenders are inert compatibility APIs: no SDK initialization, buffers, timers, payload processing or telemetry identifiers. Telemetry level always returns NONE regardless of configuration. Settings expose only off.
- Root, remote-server and remote-web manifests and locks remove Microsoft 1DS, TAS and device-ID dependencies. Ten built-in extensions use the local `build/codelad/no-telemetry` adapter instead of Microsoft telemetry/experimentation packages. It has no runtime dependencies and supports CommonJS and ESM. Its declaration build uses separate temporary output per preparing process.
- GitHub/Microsoft agent senders contain no upload, compression, envelope or identity implementations. Agent Host's OTel receiver, forwarding, span database and identity collector have been replaced with the existing null API. Codelad-owned agent child environments strip inherited tracing/export configuration. Codex analytics/feedback/exporters and Claude trace exports are disabled. Project terminal environments remain user-controlled.
- Debug custom endpoint telemetry contains no collector child creation. Automatic crash reporter startup and uploads are removed; explicit local dump collection has no submit URL. MAC hashing, Windows SQM reads and the native device-ID package are removed. A random local UUID remains for non-telemetry storage/remote API compatibility; telemetry service identifiers are empty.
- Remote TAS assignment and polling are removed. Explicit local development overrides remain, without claiming remote assignments. Extension experiment APIs return defaults without state reads or requests.
- Codelad branding covers executable/profile/installer/protocol identities; upstream MIT notices remain. Open VSX is the registry. Default Copilot, voice, auth-trust and webview-CDN bindings are removed. Source scans and packaging omit bundled Copilot; excluded upstream Copilot source remains for rebasing.
- Background app/extension updates, recommendations, npm hints, JS/TS automatic type acquisition and Git autofetch default off. Optional user-selected developer integrations remain available. No arbitrary extension firewall is claimed.
- Product packaging checks reject telemetry/cloud bindings, identifying gallery headers and nonempty automatic built-in update lists. An explicit empty update list is required by the upstream extension scanner.

- Downloaded JS Debug is now the source-built derivative 1.140.0-codelad.1, with an inert DAP reporter, local experiment defaults and bundler-input policy. Its source, original patch inputs, lockfile, bundler and notice VSIX are hash pinned. The ordinary built-in installer builds/verifies this artifact and never falls back to the upstream runtime bundle. See [recipe](js-debug-build.md).
- Windows/Linux sessions disable native Hunspell and clear languages before dictionary fetches. Language extensions remain functional. This addresses observed Linux Google dictionary traffic; macOS was not changed or tested.

## Executed Linux validation

| Check | Result / limits |
| --- | --- |
| Dependency setup | Full install-fast succeeded using pinned Node 24.22.1/npm 11.19.1 after official Electron header endpoint repair. |
| Client transpile | 10,863 TS files and 2,362 resources built. |
| Built-in extension build | Passed after replacing markdown-math's undeclared fs-extra import with Node fs. |
| Types / lint | Client, build-tool and source debugger checks passed; targeted changed-file lint passed. |
| Renderer suites | 174 passing: telemetry, removed transports, assignment, gallery, default account and chat entitlement. |
| Core/agent/provider Node suites | 71 passing: identity, inert collectors, local timing, OTel, custom endpoints, Claude/Codex launch and entitlement. |
| Focused tests | 20 passing: product/dependencies, no-telemetry adapter, debugger replacements, collector bundle paths, NetLog redaction, Linux socket filtering. |
| Downloaded extension integration | Source-built JS debugger installed through the normal built-in extension command. Its own TypeScript check passed. |
| Minified Linux distribution | Built all minified bundles; initial package failed preparing an excluded Copilot shim. After its exclusion guard, packaging-ci passed. Product privacy check passed against the output. |
| Packaged inventory | 93 manifests, no declared telemetry dependencies, no bundled Copilot; debugger derivative and legal notices present. This is not a universal binary/license compliance audit. |

The generated package is `/home/nibir/GitHub/VSCode-linux-x64`, built from 98b5fa8 plus the working changes in this checkpoint. Embedded commit metadata is not a clean release attestation. Builds and raw capture stay outside Git.

## Real desktop and offline evidence

Fresh isolated Linux development profiles, with built-ins enabled, passed editor save, debugger breakpoint/resume and expected 42, terminal/npm task, and Git diff/stage/local commit. Normal Open VSX stable YAML 2.0.0 installation succeeded after the unchanged publisher trust prompt. The installed manifest is the version authority; gallery metadata showed the latest prerelease separately.

The minified packaged app was also launched in its own Linux user/network namespace, loopback enabled and no external routes. Editing/saving, JavaScript type hover, the debugger breakpoint/resume/output and real npm task all worked offline. Test-only namespace root required `--no-sandbox`; no shipping sandbox default was changed. Normal quit flushed an empty-host Chromium NetLog. The final Linux sampler ran ten one-second snapshots there, only automation loopback sockets, no unreadable entries or unparsed owned rows. This is selected local functionality, not all offline or language-server scenarios. Namespace DBus/KWallet and root warnings are environmental and remain in raw local logs.

One development extension-host `Unexpected SIGPIPE` occurred after a debuggee exit despite successful debugging. It was not reproduced in the packaged offline run. Historical Windows output-channel diagnostics remain open; do not equate successful UI actions with all diagnostics resolved.

## Observed network activity

A pre-fix Linux run contacted `redirector.gvt1.com` and `rr2---sn-bu2a3jc2a-jj06.gvt1.com` for a native dictionary. Disabling workbench spellcheck alone had not prevented the session fetch. After disabling native sessions and clearing language lists, the next fresh profile had no Chromium URL hosts and zero nonloopback socket observations before explicit extension browsing: **207 one-second samples**, over two minutes idle. See Electron's [spellchecker documentation](https://www.electronjs.org/docs/latest/tutorial/spellchecker/) for its Windows/Linux dictionary mechanism.

After explicit YAML browsing/install, that completed run listed only `open-vsx.org`, `openvsx.eclipsecontent.org`, `img.shields.io` and `raw.githubusercontent.com`, classified as registry and extension README/image content. There were 393 later samples containing external connections, not 393 new requests. No payload audit or universal zero-network claim is made. Historical unsolicited Windows registry traffic was not reproduced or precisely attributed on Linux.

The new Linux helper samples TCP/UDP via ss for the editor process tree, including task-thread descendants and PID-start-time checks. Raw process names/arguments are not stored; unreadable entries and unparsed owned rows are reported. The 600-sample development capture predates the final unparsed-row field; the final schema additionally passed the offline ten-sample check. Snapshot coverage can miss short-lived connections, DNS/unconnected UDP or inaccessible processes. Chromium NetLog excludes Node/native transports. Packet/DNS/payload capture is still required for stronger acceptance.

## Remaining acceptance

Local native dump, task-trust cancellation and portable argv startup-guard checks ran; see the Linux report for truncated crash NetLog and native-recovery limitations. Complete recovery/shutdown and stronger upload evidence; reproduce Windows startup registry/output diagnostics and investigate development SIGPIPE. The rebuilt branded package also passed non-ASCII paths, TypeScript rename/save/diagnostics, file watching, local search and restart restoration, with empty-host completed Chromium logs. Its first 180 socket samples contained only loopback with no coverage errors; search happened later. Continue richer language scenarios, native resizing, additional Git operations, extension activation and remaining privacy scenarios across supported platforms. App/title-bar/web/installer icon assets now derive from Codelad SVG; finish native platform/installer validation and remaining branding audit, review final dependencies and licenses, and produce release provenance from a clean revision. Native glass and the later full product phases remain pending.

See [current handoff](HANDOFF.md), [Linux report](linux-continuation.md) and [safe screenshots](validation/README.md). Raw captures/logs/dumps remain local under ignored `.build/codelad/`; never publish them without review.
