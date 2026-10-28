# Linux continuation: build and runtime evidence

Updated 2026-10-29 (Asia/Kolkata). Checkout `/home/nibir/GitHub/codelad`, branch `codex/codelad-privacy-foundation`. Started from `4dbd146`; the first Linux guard/report changes were committed and pushed as `98b5fa8`. The current source debugger, dictionary prevention, Linux capture and packaging fixes continue that work. Git author is `nibir-ai <nibir.github@gmail.com>`. Push access to `origin` has succeeded; the earlier DNS/npm/403 setup blockers are no longer current. No credential is stored in the repository or remote URL.

## Environment and build

Use `/home/nibir/.cache/codelad/runtimes/node-v24.22.1-linux-x64/bin` first on PATH. Node 24.22.1 and npm 11.19.1 were downloaded from the official release and SHA256 verified. System Node 26.12.1 does not match `.nvmrc`. Native compiler/X11/xkbfile/libsecret prerequisites are installed.

The initial install failed retrieving redirected Electron header checksums. Priming node-gyp with `--dist-url=https://artifacts.electronjs.org/headers/dist` for Electron 43.8.3 and rerunning install-fast with that dist URL succeeded, including root/build/extensions/remote dependencies. Build outputs and logs are ignored under `.build/codelad/`. No package locks changed during setup.

Client build-fast compiled 10,863 TS files and 2,362 resources. Full build-fast-extensions passed after markdown-math's undeclared fs-extra import was replaced with Node fs. Client types and build-tool types passed. JS debugger source types passed. Final targeted ESLint passed for thirteen source/build/script files. The final five-file focused selection passed 20 tests. Renderer test selection passed 174 tests; combined core/agent/provider Node selection passed 71.

The normal built-in installer built/installed the telemetry-free debugger derivative. `vscode-linux-x64-min` generated all minified bundles but then failed preparing excluded Copilot's ripgrep shim. After skipping that task for the excluded extension, `vscode-linux-x64-min-ci` packaged successfully using the existing bundles. Output `/home/nibir/GitHub/VSCode-linux-x64` passes `check-privacy.ts`; [inventory](packaged-extension-inventory-linux.json) records 93 manifests. The package was built from 98b5fa8 plus working changes and is not a signed/formal release.

## Actual desktop actions

Evidence root: ignored `.build/codelad/runtime-linux-2026-10-29/`. Profiles were fresh/empty, built-ins enabled, no copied sign-in. MANGOHUD was disabled only for these launches. Startup and action screenshots were visually inspected. Fixture files and its Git repository are disposable and contain no user project data.

- Development run2: editor save, real debug breakpoint/resume/output 42, integrated npm task, Git diff/stage/local commit. Fixture commit `b2802d9` confirms the UI commit. One extension-host `Unexpected SIGPIPE` after debuggee exit remains an open diagnostic.
- Run2 NetLog identified native dictionary requests to `redirector.gvt1.com` and `rr2---sn-bu2a3jc2a-jj06.gvt1.com`.
- Run3 after the native-session fix: 207 pre-browse one-second samples, zero nonloopback observations; no Chromium URL hosts before explicit browsing. A total of 600 samples completed with no sampler command failures. This capture used the earlier schema before unparsed-owned-row reporting was added.
- Run3 explicit Open VSX browsing/install: stable redhat.vscode-yaml 2.0.0/MIT confirmed from installed manifest after the normal publisher prompt. Completed host inventory: open-vsx.org, openvsx.eclipsecontent.org, img.shields.io and raw.githubusercontent.com. The later 393 samples containing external connections are not counts of new requests. Third-party activation/payloads are not certified.
- Packaged offline: separate Linux user/network namespace with loopback and no external routes, host networking untouched. Edit/save, JavaScript hover, breakpoint/resume/output and npm task passed. Completed Chromium NetLog has no URL hosts. Latest Linux sampler ran ten snapshots: only automation loopback, no unreadable entries or unparsed owned rows. Namespace root required test-only --no-sandbox and showed expected root/DBus/KWallet environment warnings; the packaged workbench logged no application error in that run.

[Phase 1 report](phase-1-report.md) describes evidence limits. [Debugger build](js-debug-build.md) documents source pins and collector-input policy. Safe selected images are in [validation](validation/README.md); raw capture/dumps stay local. Neither the snapshot sampler nor NetLog covers every process packet or DNS/payload, and historical Windows startup registry attribution remains unresolved.

## Cleanup and current work

The editor windows from run2/run3 and the packaged offline test were closed normally. Offline NetLog is complete. The crash/trust checks below are finished with explicit limitations. Do not delete raw evidence before recording the actual results. Clean only exact temporary profiles listed in each launch.json and the named Playwright daemons, never unrelated editor sessions. No broad process-kill commands are appropriate.

Remaining work: crash/trust completion, Windows registry/output-channel reproduction, development SIGPIPE attribution, remaining IDE/privacy/cross-platform matrix, stronger packet/DNS coverage and complete Codelad branding. Native glass and later phases are pending. The current checkpoint trigger is approximately 5% of the five-hour allowance remaining; refresh HANDOFF.md and push then.

## Crash and trust checks (2026-10-29)

A separate fresh packaged profile started in Restricted Mode. Invoking Tasks: Run Task displayed the normal trust dialog explaining code execution; Cancel preserved Restricted Mode and did not run the task. No trust setting was weakened in the product. Earlier automation used --disable-workspace-trust only for the inspected disposable fixture.

With an explicit absolute local dump directory, CDP Page.crash produced a 223,520-byte renderer minidump under pending/. The test ran without external network routes. The crashed renderer left a native recovery dialog that stalled CDP Browser.close and SIGTERM; only that exact process tree was forcibly cleaned. Its NetLog was truncated and correctly rejected by the summarizer, so it is not successful shutdown/upload-capture evidence. Dumps and logs were preserved only in ignored local evidence. Native recovery and cross-platform crash/upload acceptance remain open.

A separate portable test profile set argv.json enable-crash-reporter=true without a dump-directory argument. The real packaged workbench rendered, its nine-process tree had no crashpad handler, and no dump files appeared. This confirms the observed startup guard on this Linux package, not every OS crash mechanism. It closed normally.

The completed development, offline and argv-guard windows are closed; namespace shell and samplers exited. Exact generated profiles were removed after copying their diagnostic logs/dumps into ignored evidence directories. No unrelated processes/profiles were touched. Additional branding/IDE validation, if launched later, must be cleaned separately.

## Rebuilt branded package and IDE checks

The final icon/welcome changes were transpiled, the same esbuild bundler rebuilt all 26 minified bundles (66.6 seconds), and packaging-ci passed again (12 seconds). A standalone gulp esbuild-bundle name was not registered; invoking the existing exported bundler with the packaging task's arguments resolved this without changing build logic. Icon exports passed local PNG/ICO/ICNS structure checks and generator lint. Review found that the existing installer bitmaps use nonuniform authored dimensions; the generator now preserves all fourteen original dimensions exactly, verified against Git before the branding commit. Native Windows/macOS icon/installer appearance remains unverified.

The rebuilt package launched on the normal Linux host with shipping sandbox defaults, no sign-in and a fresh profile. It displayed the Codelad mark and walkthrough. In a non-ASCII workspace, TypeScript rename updated both declaration/reference and saved to disk; the intended string-to-number diagnostic appeared; an externally created non-ASCII file appeared in Explorer; local search found the fixture marker. Some UI automation attempts needed hover dismissal or waiting for language activation; no product changes were made for those automation timing issues. Arbitrary native resizing via CDP Browser.getWindowForTarget was unsupported; do not claim it tested. Fullscreen key commands were sent, without separate transition acceptance evidence.

The first 180 seconds of latest-schema socket sampling saw only loopback, no unreadable entries, no unparsed owned rows and no command failures. Search happened after sampling ended. The completed Chromium log spanning launch through normal quit has no URL hosts. The app was reopened with the same disposable profile: tabs and saved renamed file restored, then normal quit produced another empty-host completed Chromium log. Neither packaged run logged an application error. Profile logs were preserved locally and the exact temporary profile removed; both windows, held shells and named automation daemons are closed. See [safe summary](validation/linux-network-summary.json).
