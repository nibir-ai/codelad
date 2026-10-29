# Local source maps in Codelad packages

Upstream packaging rewrote runtime dependency map comments to `main.vscode-cdn.net`, and minified CI/server/web builds supplied that origin for generated core maps. Those private-fork artifacts are not hosted there. A local Windows package contained 170 such dependency comments before the correction. Opening developer tools could attempt that unnecessary remote resolution; this finding is distinct from telemetry collection.

Desktop, core CI, server, web and legacy extension tasks now leave generated map URLs local and retain the core/extension map files needed by those URLs. Desktop dependencies retain their published map comments and available maps. Server dependencies keep the existing paired removal of map files and their comments.

The actual rebuilt Windows package was checked, including its dependency ASAR: no HTTP(S) map hosts were found in the inspected JS/CSS directive comments, and all 33 core map links resolve. Some vendor map files are absent: 18 dependency references and 15 extension references. Those gaps remain documented; no remote fallback is introduced. [Counts](validation/windows-package-maps.json) and [Windows evidence](windows-continuation.md) record scope and limitations. A map-comment scan cannot establish absence of all networking or every embedded collector.

Validation: `node --test build/next/test/source-map-url.test.ts` passed 15 tests; build-tool types and targeted lint passed; `gulp vscode-win32-x64-min-ci` successfully packaged the changed desktop path. Server/web distributions were not rebuilt in this continuation. Codelad's source-map change is independent of the current temporary identity assets, which the user will replace.
