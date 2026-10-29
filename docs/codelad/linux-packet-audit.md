# Offline Linux packet audit

Updated 2026-10-30 (Asia/Kolkata; capture timestamps are UTC on 2026-10-29). Phase 1 remains in progress. This continuation adds an optional capture tool, tests and documentation; it reuses the prepared Linux package from `936dd77b0b0` plus the previously validated working IPC fixes. No application source, dependency locks, branding or shipping sandbox settings changed in this batch.

## Repeatable capture

[capture-linux-packets.py](../../scripts/codelad/capture-linux-packets.py) uses Python's standard library and installed util-linux/iproute2. It creates user, network, PID and private mount namespaces, verifies their identities and private `/proc`, and brings up only the new loopback interface. The packet socket and private PCAP file are ready before the command starts. There is no host-capture fallback. [Commands and output semantics](network-audit.md#offline-linux-packet-capture) describe the entrypoint.

The helper observes raw loopback frames for the entire command namespace, including orphaned children, then drains for one second after all processes exit. It records kernel packet/drop counters, truncation, file size, command exit and remaining processes. A complete capture requires every kernel-reported frame to be recorded, no drops/truncation/errors and zero live children. File/time limits, interruption, parent death or a child moving to another network namespace produce incomplete results and clean up only the disposable process scope. Output directories are mode 0700 and metadata/PCAP files mode 0600. Arguments, environment variables, DNS names and packet payloads are not copied into metadata; raw PCAP remains sensitive local evidence.

## Validation

`python3 build/codelad/linuxPackets.test.py -v`: **10 tests passed** on Python 3.14.8. They exercise real short-lived TCP and IPv4/IPv6 UDP DNS query/response frames; metadata/payload separation and file permissions; children outliving their parent; deadlines; truncation and byte bounds; refusal of existing output and direct host entry; nonzero command exit versus capture failure; parent death/interruption; child namespace changes; and sanitized command-startup failure. The tests verify that the host network namespace remains unchanged. One initial test reader needed its completion-condition expression corrected; subsequent full runs passed.

`pyright scripts/codelad/capture-linux-packets.py build/codelad/linuxPackets.test.py`: **zero errors/warnings**. An inferred fallback-dictionary type was corrected before the final successful check. Product tests/builds from the preceding IPC continuation were reused because their relevant inputs did not change.

The installed libpcap library independently opened the positive-control file and both desktop PCAPs and read every record. Actual record totals match the helper's recorded and kernel-reported counts. Reviewed packet classification found no unclassified or nonloopback IP frames in these selected files. This validates the generated file format and observed controls, not arbitrary future captures or all payload meaning.

## Actual packaged editor run

A private KWin virtual desktop exposed a separate Wayland socket. The inspected scenario ran the actual minified package in the capture namespace, with fresh profile/extensions/shared data, built-ins enabled, no copied credentials and Workspace Trust preserved. Namespace root required test-only `--no-sandbox`; the wrapper also selected Wayland. This does not validate the shipping sandbox. The compositor, configuration, cache/data directories and DBus sessions were disposable. No host networking or desktop settings were changed.

Before app startup, the scenario sent one controlled UDP DNS exchange on each of IPv4 and IPv6 and a short-lived TCP exchange. These are instrumentation controls, not Codelad requests. The startup screenshot was saved and visually inspected before releasing the scenario to continue. It then idled for **120 seconds**, opened a fixture, edited/saved and verified its content on disk, searched the local marker, and quit normally. The final [reviewed screenshot](validation/linux-packet-search.png) shows the saved fixture, one real search result, Restricted Mode and the expected namespace-root title.

The first attempt completed idle/save but timed out on an automation locator abbreviated as `Search`; the real accessibility label includes instructions. Its editor and socket sampler exited normally, but private portal/secret-store helpers remained after DBus shutdown. The capture correctly reached its duration limit and stayed **incomplete**, despite zero packet drops. That evidence is retained. The corrected scenario used the actual search label and explicitly closed only its remaining private session services after the editor had quit. No product behavior was changed to accommodate automation.

| Result | First attempt | Corrected run |
| --- | ---: | ---: |
| Capture complete | No, duration limit | Yes |
| Scenario exit code | 1 | 0 |
| Recorded/kernel frames | 3,374 / 3,374 | 2,518 / 2,518 |
| Dropped/truncated frames | 0 / 0 | 0 / 0 |
| Recorded bytes | 934,242 | 698,416 |
| UDP DNS control frames | 8 | 8 |
| Other port-53 frames | 0 | 0 |
| Nonloopback IP frames | 0 | 0 |
| Remaining namespace processes | 0 | 0 |

The corrected capture spans 18:31:34.261–18:33:54.955 UTC. Its idle interval is 18:31:52.109–18:33:52.110 UTC. It contains **2,510 TCP frames** and **8 UDP frames**; four DNS query frames and four response frames reflect the two controlled exchanges and loopback copies. Two TCP frames carry the deliberate TCP control. Remaining TCP frames are consistent with the inspected local CDP scenario; packet capture alone does not establish per-process causality or application-level payload safety.

The final editor/sampler exited with code 0. Its **139** socket snapshots have zero unreadable entries/unparsed rows and end at zero tracked processes. The completed Chromium log lists no URL hosts. Namespace KWallet/portal/accessibility/color-management diagnostics remain environmental limitations; this is not an error-free log claim. [Reviewed counts and hashes](validation/linux-packet-summary.json) contain no packet payloads, arbitrary DNS names or raw URLs.

## Limits and cleanup

This is **offline loopback evidence**. It cannot observe a blocked attempt before a packet exists, Unix-domain traffic, activity delegated outside the namespace, encrypted payload meaning or behavior with internet access. The selected private DBus services ran inside the captured process/network namespaces; the virtual compositor remained outside. Frame counts include both loopback copies and automation and are not counts of requests or uploads. Classic port-53 controls do not certify DNS-over-HTTPS/TLS behavior. Online packet/DNS/payload acceptance and the broader platform/extension/IDE matrix remain open; Phase 2 still requires review.

Raw evidence stays ignored under `.build/codelad/packet-desktop-2026-10-29/` and `packet-desktop-2026-10-30/`. PCAP files may contain CDP messages with local paths and fixture contents; do not publish them unreviewed. Profile logs were preserved before exact profile/extensions/shared-data removal. Temporary scenario/wrapper scripts, handshake files and virtual desktop runtime/config/cache/data directories were removed after all test processes and namespaces exited. No user's editor, credentials or personal desktop profile was copied or altered.
