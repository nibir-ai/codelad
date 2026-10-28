# Codelad privacy and network behavior

Codelad's product policy disables core usage/error telemetry, automatic crash submission and experimentation. Core telemetry interfaces remain for compatibility and resolve to no-op services. An explicit product disable applies to development builds and cannot be re-enabled through user telemetry settings or injected fixed telemetry levels. This is the implemented policy with focused core unit-test coverage; runtime verification is still pending and no zero-traffic claim is made.

## Defaults

- Product telemetry is disabled. The Telemetry setting defaults to `off` and explains the product policy and extension boundary.
- Automatic crash reporting does not start from saved argv configuration. An explicit `--crash-reporter-directory` can collect local dumps, with uploads disabled. Local dumps and diagnostic logs can contain sensitive state; inspect them before sharing.
- No core TAS, AppCenter, collector, update or settings-sync endpoint is configured in product metadata. Packaging checks reject prohibited product overrides.
- Extensions come from Open VSX when explicitly searched or installed; local VSIX installation remains available. Automatic extension checking/updating and recommendation notifications default off. Update settings remain configurable for a future reviewed OSS release channel; none is configured today.
- Git autofetch, npm online package hints and JS/TS automatic type acquisition default off. Users can enable these independently when needed.
- The default Copilot agent, voice service, implicit auth allowlist and Microsoft-hosted webview asset base are removed. Authentication providers remain optional for user-selected integrations; the editor does not require sign-in.
- No existing VS Code or Code OSS profile is migrated. Codelad has separate application, profile, installer and protocol identities; development data uses a `-dev` suffix.

## Network inventory

| Pathway | Classification | Default / trigger | Evidence and limits |
| --- | --- | --- | --- |
| Core telemetry service, shared process, server | Telemetry | Removed collectors; inert service interfaces retained | Collection and 1DS SDK/transport implementations are removed. The compatibility service always returns NONE and empty telemetry identifiers; configuration cannot enable it. Complete normal-runtime capture pending. |
| Debug custom telemetry endpoints | Telemetry | Product-disabled before collector child creation | `CustomEndpointTelemetryService` is inert and contains no collector child creation. |
| Electron crash reporter | Telemetry / optional local diagnostics | No automatic startup; explicit local-dump argument only | Bootstrap and upload guards enforce product policy; native crash test pending. OS crash-report policies are outside this setting. |
| Core TAS assignment and experiments | Telemetry / experimentation | Disabled by product independently of user setting | TAS dependency and remote assignment client/polling are removed. Only explicit local overrides remain. |
| Open VSX gallery, extension metadata, VSIX, icons and README assets | User initiated; optional background after opt-in | Explicit search/install/check; automatic checks default off | `https://open-vsx.org/vscode/gallery`, resource and item adapters. Redirects/assets must be captured during actual install. No machine/session headers through `resolveMarketplaceHeaders` when product telemetry is disabled. |
| Extension safety/control metadata | Background non-telemetry | No control endpoint in root product | Security checks retained; this build has no supplied central revocation list. A reviewed Open VSX control endpoint remains to be evaluated. |
| Application updates | Background non-telemetry / user initiated | `update.mode=none`; no update endpoint | Distribution channel and signatures not implemented. |
| Git remote operations | User initiated / optional external | Fetch, pull, push and user-enabled autofetch | Preserve Git functionality, credentials and confirmations. Git itself may open subprocess network connections. |
| Authentication, remote hosts and tunnels | Optional external | Explicit user choice or previously configured credentials/integration | No forced accounts; provider-specific traffic and independently configured integrations need separate capture. |
| npm completion metadata / JS/TS automatic type acquisition | Optional external | Off by default, separately configurable | The unified JS/TS migration reader requires both current and legacy compatibility defaults off. Runtime capture found npm spawned by its automatic-type worker before the correction; the correction awaits a fresh capture. Explicit opt-in may contact npm/download helpers. |
| JSON schemas, HTML/CSS resources, Markdown remote images | Optional external / background non-telemetry | Depends on opened content and language/preview settings | Still requires runtime classification; these are not disabled indiscriminately. Do not assume every built-in language feature is offline. |
| Bundled agent tracing | Telemetry | Removed | OTel receiver/exporter/identity/span collector is inert; inherited tracing is stripped from Codelad-owned agent children. Provider and download boundaries still require triggered runtime checks. |
| Extension host and installed extensions | Optional external | Extension activation | Ten built-ins use an inert local adapter instead of Microsoft telemetry/TAS SDKs. Participating extensions see disabled core telemetry. Arbitrary extensions can use independent networking and policies; Codelad is not an extension firewall. |
| Build dependency and pinned OSS extension downloads | User initiated build tooling | npm, Electron headers/binaries, pinned GitHub release assets | Build-only traffic, with existing checksums retained. No app runtime claim can be inferred from build traffic. |
| Browser/Electron/OS traffic not represented in service APIs | Unknown until capture | Platform dependent | Must inspect sockets and packet/DNS capture alongside Chromium NetLog. |

## Offline behavior and threat model

Editing, local files, local search, local Git, configured local tasks and installed language servers should work offline once built. Extension installation, package downloads, cloud authentication, remote development, web resources and Git remotes may need network access. Offline regression tests have not yet run.

The policy protects against accidental core telemetry activation and prohibited product mixins. It does not sandbox arbitrary installed extensions, local project commands, external tools, operating-system services, a modified binary, or a compromised dependency. A random local compatibility UUID still serves storage/remote API functions. MAC hashing and Windows SQM/device-ID collection are removed; telemetry IDs are empty and registry requests omit identifying headers. Arbitrary user-selected extension networking remains outside this guarantee.

## Verification

See [network audit recipe](network-audit.md) for isolated profiles, outbound capture, action-by-action allowlists and evidence limits. Static product checks and service unit tests are necessary but cannot prove the full running application's network behavior.
