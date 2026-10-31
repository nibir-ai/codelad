# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The interface is a browser-rendered Electron desktop workbench for Windows, macOS and Linux, not a standalone website or mobile app. Preserve native desktop controls, keyboard workflows and platform fallbacks.

## Users

Developers editing local projects, navigating source, reviewing Git changes, running configured tasks, debugging and using extensions. The first currently available validation host is Windows; no additional hosts have been supplied.

## Product Purpose

Codelad is an independent VS Code OSS fork. It combines the real editor and extension ecosystem with a contextual workspace that keeps code central and brings development tools forward when needed.

## Positioning

Quiet Shell + Scrollspace + Atlas is the supplied interaction direction: shared real work surfaces, saved task contexts, integrated source control and a future semantic project graph. Native materials belong on structural chrome; reading surfaces retain legibility and solid fallbacks.

## Operating Context

Local desktop coding with workspaces, editor groups, Git, terminal, tasks, language services, debugger and extensions. Existing workbench services remain the implementation foundation. New appearance work must not silently run shell commands, Git mutations, network operations or account flows.

## Capabilities and Constraints

The native glass adapter has bounded Windows API/visual and packaged coding evidence. Atlas now provides a first bounded, language-provider call map with real source navigation, progressive expansion, filtering and a minimap. Complete repository semantics, import/type/test edges, the broad utility system and spatial canvas remain unimplemented. Privacy acceptance remains incomplete; preserve `docs/codelad/privacy-open-checks.md`. Develop on `dev`; `stable` remains a protected bootstrap checkpoint, not a release.

## Brand Commitments

Use the name Codelad and the supplied assets in `assets/`; preserve the approved logo. The supplied design documents are the current authority for the redesign. Do not use an embedded wallpaper, fabricated Git/task data, fake graph edges or AI drawings as proof of the real workbench.

## Evidence on Hand

The product requirements are in `docs/CODEX_MASTER_PROMPT.md`; current research and its provenance are indexed by `docs/codelad/design/README.md`. Native captures, privacy fixtures and package identities are recorded under `docs/codelad/validation/`. The offered generated UI reference image has not been supplied; no screenshot-fidelity claim is established.

## Product Principles

- Keep source central and tools contextual.
- Preserve editor state, native affordances and extension compatibility.
- Use existing services and real project data; run actions only after user choice.
- Keep privacy boundaries and unavailable checks visible.
- Land reversible, reviewable steps with real runtime evidence.

## Accessibility & Inclusion

Keep keyboard parity, visible focus, theme/high-contrast support and reduced-motion/transparency fallbacks. Application zoom does not count as OS DPI validation.

## Rollout

The user confirmed that the first Quiet Shell UI should be the default on `dev`, with the underlying editor, extensions, Git and terminal preserved. A user setting must allow returning to the conventional workbench. The supplied task requires real application screenshots rather than AI drawings; this implementation is code-led. No general comp/code workflow preference is stored beyond this task.
