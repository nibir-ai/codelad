# GitHub history privacy continuation, 2026-10-30

The user requested continued privacy work and confirmed that no additional Windows VM or macOS host is available. This Windows session is not elevated, Windows Sandbox is absent, and no dumpcap/tshark, Npcap service, QEMU, VMware or VirtualBox command was found. WSL lists only Docker Desktop. These observations do not establish controllable Windows network isolation or a macOS test environment; the earlier unsuccessful disconnect attempts must not be repeated as proof of offline behavior.

## Implemented and tested

The built-in GitHub history provider previously defaulted `github.showAvatar` on. Avatar resolution can request signed-in GitHub GraphQL access, send repository/commit details and retrieve avatar images while viewing history/blame/Timeline. It now defaults off in both the manifest and code fallback. The setting has application scope, preventing repository settings from enabling it. Its description discloses account-backed requests and image downloads. Explicit user opt-in preserves the provider; Git history, local Git and explicit GitHub commands are unchanged.

The focused privacy/build/adapter/debugger/network selection passes **23 tests**, including the new default/scope policy assertion. GitHub extension compilation, its production Node bundle, targeted ESLint and whitespace checks pass. The actual Electron extension-host GitHub suite passes **four tests**: the three existing template/quick-pick checks and the new avatar privacy test. The latter exercises the real history provider with controlled authentication access: zero authentication calls at the default, and one attempted call after explicit user opt-in. The controlled service throws before any account or remote request; this is not a signed-in provider payload audit. The disposable test profile restores its setting, and the test editor exits normally.

Running the previously dormant suite exposed an ESM runner export problem, followed by zero test discovery when the host passed the runner file path. The runner now exports the expected `run` function and resolves its test directory itself; the shared declaration now matches the existing JavaScript implementation's string directory parameter and nullable callback error. The existing template assertion also retained a leading slash when computing relative paths; it now uses POSIX path-relative conversion on URI paths. Initial rejected/empty/failing runs remain in ignored local logs and are not counted as passes. Final evidence is `.build/codelad/github-history-privacy-2026-10-30/tests-passing.log`: **4 passing**, process exit 0. No temporary execution helper files were created. Raw profiles/logs remain local and ignored.

## Remaining acceptance

| Check | Current evidence / remaining work |
| --- | --- |
| Core telemetry, crash upload and experiment policy | Existing source/runtime guards and focused tests pass; stronger transport coverage remains. |
| Markdown resources | Nine development and nine packaged rendering/toggle cases pass in the preceding report. |
| GitHub avatars | New source default/guard and actual extension-host tests pass. Refresh extension staging and the Windows package before claiming packaged coverage for this change. |
| Windows offline | Not validated. This host retained connectivity during both earlier disconnect attempts; an isolated execution environment is unavailable. |
| Packet/DNS and comprehensive payload inspection | Pending; short TCP samples and Chromium logs do not replace these. No privileged collector was started. |
| Signed-in provider workflows | Authenticated opt-in payload cases remain pending; the new controlled authentication test is narrower. |
| Notebook Markdown/output remote resources | Separate from the Markdown setting. Source inspection found notebook CSP permissions for remote resources; controlled runtime classification and an appropriate privacy policy remain pending. |
| macOS and remaining Linux crash/platform cases | No additional hosts supplied. Prior Linux offline evidence retains its recorded scope; unresolved recovery cases remain open. |
| Installer/release | Current user installer predates the Markdown and avatar changes. Install/uninstall, signing and clean-release provenance remain pending. |

Full Phase 1 acceptance is **not** claimed. The full native-glass and later product objective is also unfinished. `stable` must remain the protected bootstrap checkpoint. The last complete Windows package still identifies `240b6558231` (Markdown changes); the new GitHub change is source-tested and bundled but has not been packaged.

The latest usage check reported **100% weekly used**, while the five-hour window was **60% used / 40% remaining**. This is not the user's near-5%-remaining five-hour threshold. Save the reviewed code and this handoff before further work risks losing the checkpoint; do not consume the account's reset credit without the user's instruction.
