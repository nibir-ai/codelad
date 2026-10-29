# Codelad identity assets

The user supplied replacement artwork in `assets/` on 2026-10-29. These sources replace the rejected mint mark. Preserve the supplied artwork; do not generate another logo.

The supplied blue artwork is used for launcher, tile, web and macOS representations. The supplied flat vector is copied unchanged to [the resource SVG](../../resources/codelad/icon.svg) and the workbench title-bar SVG, where its simple silhouette stays readable in dense chrome. The supplied Windows ICO is copied byte-for-byte to the executable and favicon resources. Lockups and splash artwork remain available in [assets](../../assets/); the README uses the appropriate light/dark lockup. No decorative splash window was added to the editor's startup.

App/title-bar, Linux launcher, Windows executable/tile, web/PWA/favicon, macOS ICNS and Windows installer bitmaps are exported from the same source. Existing code.* resource filenames are preserved because upstream packaging references them; displayed application/profile/protocol names remain Codelad. The welcome walkthrough title uses product.nameShort. This does not rename extension README content, upstream legal notices or documentation links.

```bash
# Optional asset-authoring prerequisite: an existing sharp installation.
node scripts/codelad/generate-icons.mts
# Or pass --sharp-path <absolute-path-to-sharp-entrypoint> without adding it to the editor.
```

Normal installs/builds use checked-in assets and need no image-authoring library. The generator resizes the supplied PNG, retains alpha, writes PNG-backed ICNS representations and preserves all fourteen installer BMP dimensions using a 24-bit BMP encoder. It uses no temporary directories. Outputs were regenerated on Windows with the bundled sharp runtime; Windows ICO and both vector destinations match the source hashes. Native installer and macOS rendering still require validation on the relevant platform.

Executable metadata identifies Codelad Contributors, with upstream Microsoft copyright attribution retained. The macOS help-book name follows the product name. The AppX template uses `CN=Codelad` and Codelad Contributors instead of Microsoft's publisher identity; a future signed AppX requires a deliberately configured certificate with a matching subject. No signing certificate or production package identity was provisioned here.

The mark is Phase 1 identity work, not the Phase 2 glass redesign or a claim of reference-image fidelity. A broader audit of inherited document icons and copy remains before release.
