# Linux continuation: privacy artifact checks

Date: 2026-10-28. Checkout: `/home/nibir/GitHub/codelad`. Branch: `codex/codelad-privacy-foundation`, resumed from `4dbd1465678e6ad278b953985ef12bc2d912631a`. Git author: `nibir-ai <nibir.github@gmail.com>`. The user authorized continued implementation and pushing. No UI redesign work is included.

## Changes

Downloaded built-in extension packaging previously deleted `dependencies` before producing the distribution manifest without applying the source dependency guard. This could conceal the known JS debugger `vscode-tas-client` declaration. The packaging transform now applies `assertNoTelemetryDependencies` to the original downloaded manifest first. It rejects prohibited direct runtime/optional dependencies before stripping scripts/dependencies. A regression test checks the recorded inventories: JS Debug is rejected; the two other pinned extension inventories pass. A clean inventory is not proof that a binary lacks embedded collectors.

The NetLog summarizer now lives in `build/codelad/networkAudit.ts`; the CLI calls the same implementation. Tests exercise redaction, host/event counts, WebSocket URLs, local schemes, malformed/truncated captures and invalid URLs directly. Null capture/event inputs produce sanitized errors. The CLI still exits nonzero for unexpected hosts. Previously, a nested `spawnSync` returned EPERM in this environment, leaving the test unable to parse child stdout; removing that subprocess dependency permits testing the actual policy. This does not change the capture tool's network coverage or prove runtime privacy.

The handoff/status and audit recipe now distinguish the historical Windows checkpoint from this Linux continuation. In particular, the audit recipe no longer incorrectly says no desktop capture ever occurred.

## Executed verification

- `node --test --test-isolation=none build/codelad/privacy.test.ts build/codelad/networkAudit.test.ts`: 11 passing.
- `node build/codelad/check-privacy.ts`: passed against source product metadata.
- `tsc --noEmit --strict --target es2024 --module nodenext --allowImportingTsExtensions build/codelad/networkAudit.ts`: passed using system TypeScript 6.0.3. This is a standalone check, not the repository build-tool type check.
- Direct CLI checks against a temporary completed NetLog: an allowed host returned 0, an unexpected host returned 1, and both reports excluded the fixture's URL path/query secret. Temporary files were removed.
- Syntax transpilation of all five changed TypeScript files: passed. This does not check dependency resolution or full build types.
- `git diff --check`: passed.

## Environment limits and remaining work

The clone initially had no dependencies, `.build` directory or compiled client output. System Node is 26.12.1; `.nvmrc` requires 24.22.1. No npm executable was found. The terminal cannot resolve github.com, so shell fetch/push and network dependency setup cannot currently proceed. The connected GitHub account can read the remote branch, but the attempted GitHub tree write returned HTTP 403, `Resource not accessible by integration`. The installed GitHub plugin exposes no OAuth-scope repair action through the available management tools. Changes are committed locally; neither publishing path succeeded. No token was added to repository files or remotes.

Do not infer full compile/lint/desktop success from the focused tests. The packaging stream's integration with Gulp must be exercised after dependencies are installed. An ordinary product build containing the recorded JS debugger should now fail policy until an audited telemetry-free artifact is supplied. No debugger functionality has been deleted to pass the guard, and no derivative artifact or replacement checksum has been fabricated.

Continue by auditing/rebuilding the debugger, attributing startup Open VSX requests with a new desktop capture, retesting the final no-provider startup fix, and completing real Git/debug/language/offline/crash/shutdown checks and packaging. Native glass and later product phases remain pending.
