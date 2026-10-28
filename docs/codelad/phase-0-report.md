# Phase 0 report: inventory and baseline

Status: incomplete; current client output builds, but the original native baseline could not launch before prerequisite installation. Do not infer a desktop acceptance pass from transpilation.

The revision, entrypoints, versions, dependency/build workflow and initial product bindings are recorded in [architecture-inventory.md](architecture-inventory.md). Source is preserved on `codex/codelad-privacy-foundation`; the initial checkout was `main` at `ea8056df9f08fb7c452589213ec77fabbd3481b9`, with only user-provided untracked `docs/`.

Initial `build-fast --client-only` failed on missing `esbuild`; the initial Electron unit-test command failed before tests on missing `vinyl-fs`. The system Node version was 26.3.0 instead of required 24.22.1. The bundled Node 24.22.1 is now used in task shells. Native installation then proved the host had no Visual Studio C++ toolchain. At the user's explicit request, Visual Studio Build Tools 2022 version 17.14.42 was installed via winget, including the C++ workload, recommended components, ATL and Spectre libraries. `vswhere` now finds it at `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools`.

JavaScript-only dependency setup enabled compilation and browser unit tests while the native toolchain was installed. Build-tool dependencies were restored using `npm --prefix build ci --ignore-scripts` after an unlocked dependency resolution selected an incompatible `glob`. The full `npm run build-fast -- --client-only` command then successfully transpiled 10,861 TypeScript inputs and copied 2,362 resources. An incremental rebuild compiled the added debug-endpoint test. This is current modified source output, not an untouched baseline executable.

Full pinned `npm ci --no-audit --no-fund` with native compilation is now running. A native build, Electron tests, actual process launch, offline feature smoke checks and outbound inspection remain required.

The supplied visual reference is absent. The four root-level design documents are unchanged; no substitute reference or synthetic screenshots have been produced.
