# Source-built Codelad JavaScript debugger

Codelad packages `ms-vscode.js-debug` **1.140.0-codelad.1**, derived from upstream 1.140.0, rather than shipping its precompiled telemetry/experimentation bundle. Debug adapter, launch/attach, breakpoint and source-map APIs are preserved. Actual Linux breakpoint/resume/output works in both development and the minified offline package; this is not comprehensive debugger/platform coverage.

## Inputs and transformation

[`build/codelad/js-debug/recipe.json`](../../build/codelad/js-debug/recipe.json) pins upstream source commit `bccbbafdcb6bb96ab0706f411a1e66681d5bc4de`, source archive SHA256, package lock, original upstream gulpfile, replacement input hashes and upstream notice VSIX SHA256. The upstream VSIX is read only for `LICENSE.txt` and `ThirdPartyNotices.txt`; none of its compiled runtime code is reused. The original source license is retained too. Changes are identified in the derivative version and shipped `CodeladSource.json`.

`build/codelad/buildJsDebug.ts` downloads/verifies the inputs, installs locked build dependencies with lifecycle scripts disabled, verifies and replaces the DAP reporter and experiment service, removes the TAS runtime dependency, and invokes upstream compile/package tasks. Browser/system-dependency downloads from upstream postinstall are unnecessary for this build. The pinned build dependency tree can contain unused SDK packages; each esbuild invocation records its full input graph and rejects the known removed collector packages before packaging. The artifact has no runtime dependency on those unused build packages.

The reporter replacement starts no timers, reads no payloads, emits no DAP telemetry and ignores flush listeners. The experiment replacement performs no remote/state reads and returns the supplied local default. The existing local error formatter remains because source-map diagnostics use it. Focused behavior tests exercise these APIs with failing timer/fetch/dependency sentinels. The generated source project also passes its own TypeScript check.

The policy checks parsed `node_modules` path segments, including Windows paths and nested scoped dependencies. It is a guard against the reviewed known package set, not a proof that arbitrary future source cannot contain independent networking. Review source diffs when updating any pin.

## Build and cache

```bash
# Use the repository-pinned Node and an available npm on PATH.
node build/codelad/buildJsDebug.ts
npm run download-builtin-extensions
```

The normal built-in installer selects this recipe via `product.json`'s `codeladSource` field. Product name/version/notice checksum mismatches fail. Source installation uses the actual generated VSIX SHA256 with the existing extraction verifier; it never falls back to an upstream binary on failure. Downloaded manifests are checked before packaging strips dependency declarations.

Generated inputs/artifacts are ignored under `.build/codelad/js-debug/<recipe-hash-prefix>/`. The cache key includes recipe/replacements, builder/audit/dependency policy, platform, architecture and exact Node version. A cache hit requires matching recipe metadata and artifact SHA256; the installed debugger additionally records that recipe hash. Same-process callers share a build promise. Separate build processes should not build the same cache concurrently; there is no cross-process lock. Corrupt cache metadata may require removing that generated recipe directory and rebuilding. Do not delete unrelated profiles or caches.

Esbuild input reports are retained in the generated source's `codelad-audit/`, not shipped. `CodeladSource.json` includes reviewed input/provenance hashes without local build paths. Package bytes may vary across environments; no bit-identical cross-platform reproducibility is asserted. Record the actual VSIX checksum and clean source revision when producing release artifacts. Linux x64 and Windows x64 source builds and desktop stop/resume/output checks have passed; Windows final distribution packaging is still pending. See [Windows continuation](windows-continuation.md) for its VSIX checksum and evidence limits.

## Inventory evidence

- [Historical upstream manifests](downloaded-extension-inventory-upstream.json): original debugger declares TAS; kept for the packaging-guard regression.
- [Current downloaded manifests](downloaded-extension-inventory.json): derivative plus pinned companion extensions.
- [Packaged Linux manifests](packaged-extension-inventory-linux.json): 93 manifests captured from the minified Linux development artifact on 2026-10-29. Packaging intentionally strips dependency declarations, so this inventory supplements the pre-strip manifest guard and debugger bundle-input audit; it cannot replace them.
