# Codelad identity assets

The user rejected the current asset design on 2026-10-29 and will supply a replacement logo. Treat the checked-in mark and generated exports as temporary development assets, not approved branding. Do not redesign or regenerate them while awaiting that source artwork. Native Windows/macOS validation of the final branding must use the replacement.

The app mark is an angular C/code-bracket in mint on a dark tile, authored as [SVG](../../resources/codelad/icon.svg). It distinguishes the fork in launcher/task-switcher/title-bar contexts while keeping document content visually primary. It is an independent geometric asset, with no external images/fonts or Microsoft logo reused. Existing source/license notices are retained.

App/title-bar, Linux launcher, Windows executable/tile, web/PWA/favicon, macOS ICNS and Windows installer bitmaps are exported from the same source. Existing code.* resource filenames are preserved because upstream packaging references them; displayed application/profile/protocol names remain Codelad. The welcome walkthrough title uses product.nameShort. This does not rename extension README content, upstream legal notices or documentation links.

```bash
# Optional asset-authoring prerequisites: librsvg rsvg-convert and ImageMagick magick.
node scripts/codelad/generate-icons.mts
```

Normal installs/builds use checked-in assets and need neither authoring binary. The generator uses a temporary directory and cleans it, writes multi-size ICO, PNG-backed ICNS representations and scale-specific installer BMPs. Asset bytes can vary with renderer versions. Outputs were generated with librsvg and ImageMagick on Linux and visually inspected. Windows/macOS native icon/installer rendering is not yet tested. Apple's [high-resolution icon guide](https://developer.apple.com/library/archive/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html) describes iconset/iconutil for further native validation.

The mark is Phase 1 identity work, not the Phase 2 glass redesign or a claim of reference-image fidelity. A broader audit of inherited document icons and copy remains before release.
