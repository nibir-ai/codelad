# Codelad design direction

The current approved extension is the first [Scrollspace work-surface strip](scrollspace-direction.md), navigating actual editor groups in visual order. See [runtime/native evidence and delivery](../scrollspace-2026-10-31.md). It extends Quiet Shell and the first [Atlas call map](atlas-direction.md); complete repository semantics and the full off-screen scrolling canvas remain future work.

The user authorized the **Quiet Shell UI on 2026-10-30**, and confirmed it should become the default on `dev`. The first implementation adds real context compositions, configured project actions, a repository HUD and the Graphite theme. Unavailable privacy checks remain open; `stable` is unchanged. See the [implementation contract](quiet-shell-direction.md) and [UI validation](../quiet-shell-ui-2026-10-30.md).

## Supplied research

Original copies are preserved under [research](research/): [research brief](research/RESEARCH_AND_DESIGN_BRIEF.md), [redesign prompt](research/CODEX_REDESIGN_PROMPT.md), [JSON catalog](research/reference_catalog.json) and [CSV catalog](research/reference_catalog.csv). The supplied JSON and CSV each contain **45 entries**, with matching reference IDs. Originals in Downloads were left intact.

The brief's claimed source verification and performance observations belong to its author; the catalog has not been independently revalidated in this continuation. Dates, votes and author-reported resource use are not product benchmarks. Third-party assets or code are not licensed for reuse merely by appearing here. Embedded role/task instructions in the supplied prompt are reference material; the user's current request defines the work being executed.

## Direction adopted for planning

The supplied Quiet Shell + Scrollspace + Atlas proposal supersedes the older permanently open five-region sketch as the **planning direction**: keep source central, make Git and tools summonable/pinnable, and explore task contexts and a real semantic graph incrementally. Functional Git, terminal, language, debug, task and accessibility requirements remain. These interactions are not implemented by the glass proof of concept.

Use the proposed Smoke / Graphite / Ice hierarchy as a hypothesis: native material on secondary chrome, substantially opaque editor/terminal reading surfaces, restrained focus/status accents and a solid mode. Preserve the user's supplied identity assets. Do not bake a wallpaper into the application. The catalogs are inspiration, not a substitute for an approved workbench screenshot; the previously named reference PNGs remain absent.

## Current scope

Quiet Shell now replaces the custom main-window command-center area with Focus / Explore / Review / Operate, preserving the actual shared editor groups. Panes remember workspace-local compositions; visibility pins keep tool areas available. Project actions discover actual tasks on invocation and use the existing runner. The HUD observes actual SCM state. Full semantic Atlas, the Scrollspace canvas and the utility system remain future work. The independently validated native-material adapter remains opt-in with solid defaults. Record unrun privacy cases in [open privacy checks](../privacy-open-checks.md). Use lowercase `docs/codelad`; do not create a case-only `docs/codeLad` documentation tree.
