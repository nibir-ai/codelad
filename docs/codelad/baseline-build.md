# Baseline build and test evidence

Date: 2026-10-28. Initial revision: `ea8056df9f08fb7c452589213ec77fabbd3481b9`. These baseline commands were executed before implementation changes.

| Command | Observed result |
| --- | --- |
| `node --version` | v26.3.0 (system runtime; does not match `.nvmrc`). |
| Bundled Node `--version` | v24.22.1 (matches `.nvmrc`). |
| `npm --version` | 11.16.0. |
| `npm run build-fast -- --client-only` | Failed: missing `esbuild`; no dependencies or output installed. |
| `scripts\test.bat --run vs/platform/telemetry/test/common/telemetryUtils.test --grep Telemetry` | Failed before tests: Electron downloader cannot import `vinyl-fs`. No tests ran. |
| `npm run install-fast` with bundled Node prepended to PATH | Failed compiling `@vscode/deviceid`: no Visual Studio C++ installation found. User subsequently requested installation; Build Tools 2022 installed successfully. |

The original checkout had no working baseline because dependencies were absent. The modified checkout now builds and launches; this does not retroactively establish an unchanged upstream baseline. Runtime acceptance is tracked separately.

## Validation sequence

1. Finish standard dependency installation with required native toolchain.
2. Build fresh client output using `npm run build-fast -- --client-only`, with targeted type/lint checks for changed files.
3. Run focused telemetry/assignment tests through `scripts\test.bat`.
4. Launch an isolated desktop profile, inspect actual core functionality and capture network behavior.
5. Record results and limitations without treating static checks as runtime proof.

## Follow-up evidence

Visual Studio Build Tools 2022 (17.14.42) was installed after the user's explicit request. Native logger and terminal modules compiled; Electron 43.8.3 downloaded successfully as `.build/electron/Codelad.exe`. A full `install-fast` completed earlier. A later dependency refresh failed on a transient `UNKNOWN` open error for `extensions/merge-conflict/package-lock.json`; the file remained readable and each affected extension was subsequently refreshed individually. The full installation-state refresh has not been claimed successful after that failure.

The main client transpiles, root source types pass, build tooling types passed before the most recent adapter changes, and the full built-in extension compile passes. Use the repository's pinned Node 24.22.1. On this host, prepending Node to PATH does not change the system `npm.ps1` interpreter; invoke `node 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js' ...` to run npm itself with the pinned Node. A scoped `$env:ComSpec = 'C:\Windows\System32\cmd.exe'` is needed by the launch helper because the tool shell's ComSpec is empty.

See [phase 1 report](phase-1-report.md) for current checks and real startup findings. No complete desktop, offline or packaged-distribution pass is claimed.
