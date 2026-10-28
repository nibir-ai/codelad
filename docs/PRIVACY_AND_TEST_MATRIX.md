# Codelad — privacy verification and delivery matrix

## Core privacy commitments

- **No Codelad-owned telemetry**: usage, errors, crash submission, diagnostics, experiments, personalized recommendations or tracking identifiers transmitted without user-directed action.
- **No forced accounts**. Offline coding and local Git must work.
- **No Microsoft service dependency**: extensions via Open VSX by default; optional external services only with clear user choice.
- **No secret leakage** through graph indexing, command previews, task output, logs, Git automation or environment UI.
- **Honest ecosystem privacy**: user-installed extensions and explicit tools (Git remotes, language servers, API testing, package managers) may connect to other services. Surface this boundary in privacy docs.

## Audit matrix

| Test | Clean profile, no extensions | Installed third-party extension | Expected outcome |
|---|---:|---:|---|
| Start editor and idle for 2 min | Yes | Yes | No Codelad telemetry, classify background requests |
| Open local folder / index source graph | Yes | Yes | No silent upload of paths/code |
| Edit, save, search, open files | Yes | Yes | Local only absent user-enabled services |
| Terminal and Tasks | Yes | Yes | Shell behavior only, command preview for actions |
| Git status, diff, commit | Yes | Yes | Local Git actions; network only fetch/push etc |
| Browse extensions | Yes | Yes | Only documented default registry (Open VSX) |
| App check for updates | Yes | Yes | None by default or clearly declared OSS update endpoint |
| Crash/error scenario | Yes | Yes | No automatic crash upload, local logs may remain |
| Restart and shut down | Yes | Yes | No telemetry on shutdown |

## Environment matrix

| Surface | Windows 11 | macOS | Linux Wayland | Linux X11 |
|---|---|---|---|---|
| Basic editor + resizing | Required | Required | Required | Required |
| Solid background fallback | Required | Required | Required | Required |
| True native backdrop | Test, supported variants | Test vibrancy | Compositor-specific | Do not promise blur |
| IDE functionalities | Regressions unacceptable | Regressions unacceptable | Regressions unacceptable | Regressions unacceptable |

## Coding and UX smoke tests

1. Open workspace and folder with non-ASCII paths; verify rendering and file watching.
2. Open split editors, search, rename symbols and inspect diagnostics.
3. Launch Git diff, stage file/hunk, commit, undo safe staging, switch branches.
4. Run terminal, detach/reopen panel, resize the app and check process lifetime.
5. Discover `package.json` scripts, execute via buttons and inspect exact commands/outputs.
6. Decline workspace trust; no untrusted script executed.
7. Open extension search and install an OSS extension from the chosen registry.
8. Load 1000+ source files in graph; cap display nodes and test indexing responsiveness.
9. Test Windows native window controls and snap/maximize, macOS traffic lights, Linux window-manager focus.
10. Switch native glass ↔ solid and reopen the editor; ensure text contrast and layout persist.

## Definition of done

Ship each phase only when the user's real fork builds, its new feature is functional with real project data, regressions are tested, screenshots come from the running software, privacy boundary is documented, and changes can be reasonably rebased onto upstream VS Code.
