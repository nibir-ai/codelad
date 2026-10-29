# Linux crash recovery and IPC lifecycle

Updated 2026-10-29. Phase 1 remains in progress. Source baseline `936dd77b0b0` plus the current working changes; the package is a local development artifact, not clean-release provenance. The temporary identity assets were not changed.

## Changes

The audit launcher accepts `--local-crash-dumps`, placing the explicit Electron dump directory inside the new private audit output directory and recording the choice in `capture.json`. Ordinary captures omit this flag. This does not enable automatic reporting or add a submit endpoint.

Native crash checks exposed IPC connections that survived renderer loss and sent logger cleanup events to a disposed frame. The main IPC server now disconnects on Electron's `render-process-gone` and `destroyed` events as well as the existing explicit disconnect/reconnect paths. Reconnect emitter disposal now waits for its last listener to detach: disposing it in the first notification callback previously prevented the server from receiving the reconnect notification. A further packaged run exposed one asynchronous response after disconnect. `ChannelServer` now sends responses only while its protocol listener is live, dropping late successful and rejected results after disposal. Actual renderer-crash and environment diagnostics remain visible; no global logging/error policy was suppressed.

## Validation

- The focused Codelad Node selection passed **28 tests**, including the seven Linux capture/launcher regressions and a new Electron process regression. The latter uses real hidden, sandboxed `BrowserWindow` instances, the actual main IPC adapter, explicit disconnect, reconnect, renderer termination and window destruction. It verifies a fresh connection after renderer termination. It uses SIGKILL on the fixture renderer's actual PID rather than relying on a system core dump; native dump/Reopen checks are separate below. The Electron regression was rerun successfully after the late-response guard changed.
- A negative control temporarily removed only the new Electron lifecycle listeners from generated output. The regression failed waiting for renderer disconnect as expected; generated output was restored in `finally`. This did not alter tracked source or product configuration.
- `MANGOHUD=0 scripts/test.sh --run src/vs/base/parts/ipc/test/common/ipc.test.ts --grep 'Base IPC'`: **28 passed**, including two new late success/rejection response regressions. These tests retain the suite's disposable-leak checks.
- Client types, targeted script/test types and targeted lint passed. The first version of the new channel fixture needed its generic RPC return type corrected; the subsequent client type check passed. Client output was refreshed with `npm run build-fast -- --client-only`.
- All **26** minified bundles rebuilt using `runEsbuildBundle('out-vscode-min', true, true, 'desktop')`; `gulp vscode-linux-x64-min-ci` and packaged product privacy policy passed. Existing extension build output from `936dd77b0b0` was reused; neither extension source nor dependencies changed in this batch.

Raw validation logs are ignored under `.build/codelad/crash-ipc-*`. These selections supplement earlier tests; they do not establish complete platform or privacy acceptance.

## Actual native recovery

Two initial normal-desktop profiles produced local renderer dumps and completed normal dismissal/shutdown. They do not establish Reopen: the first keyboard action selected Close, and the second dialog was dismissed before controlled recovery was established. Both completed Chromium logs list no URL hosts. Earlier failing IPC logs were retained. An early active-window screenshot captured another foreground application; its local file was deleted and no such content was copied into the reviewed artifacts.

Subsequent checks used an independent installed KWin virtual compositor at 1280×900 with Xwayland, private DBus/runtime/config/cache/data directories, fresh Codelad profile/extensions/shared-data directories and no copied authentication. The wrapper passed `--ozone-platform=x11`; the app retained its normal sandbox and Workspace Trust defaults. This exercises a Linux native dialog in a virtual Xwayland environment, not every physical display or native Wayland configuration.

AT-SPI did not expose the dialog reliably in these sessions. Native screenshots were inspected, the exact dialog window's title/PID and geometry were checked, and XTest clicked the visible Reopen button in the isolated display. Its compositor-only `XwaylandEisNoPrompt` automation setting was confined to the disposable configuration and removed with it; the user's compositor settings were untouched. Initial XTest/Wayland input attempts required that isolated test permission; discarded/failed attempts are not recovery evidence. Temporary protocol/input helpers and their downloaded XML were removed.

The first isolated run produced a **231,760-byte** local minidump, reopened into a new native workbench window, saved an edit verified on disk and quit normally. It still logged one late frame response, which led to the `ChannelServer` guard. After rebuilding, a final fresh profile produced a **231,712-byte** local dump, showed the crash dialog, reopened into a working native window, saved another verified edit and quit normally. Both old and replacement extension hosts exited with code 0. The final run contains the expected renderer-crash diagnostic and **zero** stale-frame send errors. KWallet/DBus/virtual-display/VSync diagnostics remain environmental limitations, not an error-free claim. Restored workspace operation was verified; tab restoration after this crash was not established.

| Run | Socket snapshots | Nonloopback observations | Coverage errors | Native Reopen |
| --- | ---: | ---: | ---: | --- |
| Initial desktop dismissal | 163 | 0 | 0 | Unverified |
| Second desktop dismissal | 45 | 0 | 0 | Unverified |
| Isolated first recovery | 476 | 0 | 0 | Passed; one late IPC response retained |
| Isolated final recovery | 95 | 0 | 0 | Passed; no stale-frame send errors |

All four captures ended with `process-tree-exited`, zero remaining tracked processes and successful desktop/sampler exits. Their completed Chromium logs contain no URL hosts. Snapshot sockets can miss short-lived processes, DNS/unconnected UDP and traffic from separate OS/DBus services; NetLog omits Node/native transports. The existing explicit-dump policy disables uploads, but these captures do not inspect every packet/payload or certify every crash mechanism.

[Native dialog](validation/linux-crash-dialog.png), [recovered workbench](validation/linux-crash-recovered.png) and [reviewed counts/scope](validation/linux-crash-summary.json) contain no raw dumps or request payloads. Raw evidence/dumps remain local under `.build/codelad/runtime-linux-2026-10-29/{crash-recovery,crash-reopen,crash-isolated,crash-isolated-final}/`. Exact profiles were removed after preserving logs; all named automation sessions, samplers, test editors and isolated compositor/services exited. No helper changed the user's editor profile, networking or desktop configuration.

## Remaining acceptance

Repeat selected recovery on the normal native Wayland desktop and other supported platforms, finish the Windows packaged-startup/offline/installer checks, investigate the older development SIGPIPE and continue the broader IDE/third-party activation matrix. Stronger packet/DNS/payload coverage remains open. `tcpdump`, `dumpcap`, `tshark` and `strace` are not installed here; a raw packet socket was successfully opened inside a disposable user/network namespace with no host network changes. That was only a capability probe, not an application packet capture. Phase 2 still requires Phase 1 review, and final branding awaits the user's replacement logo.
