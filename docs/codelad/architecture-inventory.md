# Architecture inventory

Historical Windows baseline, 2026-10-28. For the current Linux build, packaged desktop and runtime evidence, read [Linux continuation](linux-continuation.md) and [HANDOFF.md](HANDOFF.md). The initial-state findings below are preserved for comparison.

## Source and host

Audit date: 2026-10-28. Upstream source commit: `ea8056df9f08fb7c452589213ec77fabbd3481b9` ("Keep compact/overflow menubar submenus in sync on updateMenu"). Repository remote: `https://github.com/nibir-ai/codelad.git`. Source version: 1.145.0; distro revision: `38ed30f01031ca05f59fb111be203efae74036c2`. Root license: MIT; preserve LICENSE.txt and ThirdPartyNotices.txt.

The host is Windows (PowerShell). `.nvmrc` requires Node 24.22.1; the system default is 26.3.0. The bundled Codex runtime provides 24.22.1, usable by prepending its bin directory to this shell's PATH. `.npmrc` selects Electron 43.8.3 and Microsoft build ID 15784459, with native dependencies built from source. The repository supports Windows x64/arm64, macOS and Linux; runtime support on other hosts is unverified.

## Reusable infrastructure

| Area | Existing entrypoints | Approach |
| --- | --- | --- |
| Product and identity | `product.json`, `src/vs/base/common/product.ts`, `src/vs/platform/product/common/product.ts`, `build/lib/electron.ts` | Independent IDs, paths and registry; preserve notices. |
| Main process and bootstrap | `src/main.ts`, `src/mainImpl.ts`, `src/vs/code/electron-main/app.ts` | Keep Electron lifecycle, sandbox and IPC. |
| Native windows | `src/vs/platform/windows/electron-main/windowImpl.ts`, `src/vs/platform/windows/electron-main/window.ts` | Later native material adapter, without replacing window architecture. |
| Workbench | `src/vs/workbench/workbench.common.main.ts`, `workbench.desktop.main.ts`, `browser/workbench.ts`, `browser/layout.ts` | Contributions, views, theme tokens and layout services. |
| Editor | `src/vs/editor`, `src/vs/workbench/services/editor` | Preserve Monaco, language features and editor service navigation. |
| Telemetry | `src/vs/platform/telemetry`, `src/vs/workbench/services/telemetry`, shared process and server service construction | Explicit product disable must also apply in development and debug endpoints. |
| Experiments | `src/vs/workbench/services/assignment/common/assignmentService.ts`, `services/telemetry/common/workbenchTelemetryUtils.ts` | No network assignment when product telemetry is disabled. |
| Extensions | `src/vs/platform/extensionManagement`, `src/vs/workbench/contrib/extensions`, `extensions/` | Open VSX by default; retain local VSIX and extension host. |
| Source control | `extensions/git`, `src/vs/workbench/contrib/scm` | Reuse Git and SCM actions, diffs, history and confirmations. |
| Terminal/tasks/debug/tests | `src/vs/workbench/contrib/{terminal,tasks,debug,testing}` | Existing models and services; preserve trust and execution safety. |
| Network and updates | `src/vs/platform/request`, `src/vs/platform/update`, `src/vs/platform/userDataSync` | Audit by initiating action; avoid blanket network blocking. |

## Initial product configuration

The fork initially retains Code - OSS names, shared OSS installation IDs, profile paths and protocol. No extension gallery, update endpoint, telemetry key, AppCenter endpoint or TAS endpoint is supplied in root product.json. That absence alone does not prove privacy: source builds allow local telemetry, the product binds the default Copilot agent and voice endpoint, and debug telemetry can construct separate collector clients. Web webviews have a Microsoft CDN default. These paths require explicit configuration changes and verification against generated product metadata.

The three downloaded built-in extensions are JS Debug Companion 1.1.3, JS Debug 1.140.0 and JS Profile Table 1.0.11. Built-in source extensions and their license/network inventory will be generated from actual manifests before distribution. Their presence is not equivalent to an independent license or network audit.

## Risks

| Risk | Mitigation / evidence needed |
| --- | --- |
| Missing native compiler or dependencies | Run standard dependency setup; record actual failure and avoid replacing the runtime with another Electron version. |
| Product overrides restore upstream service bindings | Check final packaged product in addition to source; fail packaging privacy check on prohibited configuration. |
| Settings-only privacy permits re-enabling collectors | Enforce product disable in service paths, including development; test settings and fixed-level bypasses. |
| Third-party extension networking | Disclose boundary; test a clean profile and separately classify extension traffic. |
| Gallery compatibility/signatures | Verify real Open VSX query/install; preserve extension trust/security checks. |
| Native glass breaks contrast/window behavior | Gate on platform capability; retain solid fallback; test actual desktop process. |
| Missing reference screenshot | Keep UI work pending visual inspection; do not invent a replacement image. |
