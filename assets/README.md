# Codelad artwork

User-supplied replacement identity assets, received 2026-10-29. These are the source artwork for Codelad; retain their bytes and names.

- `codeLad-symbol-art-2048.png`: transparent app artwork for raster exports.
- `codeLad-windows.ico`: supplied Windows icon, copied unchanged to the application and web favicon resources.
- `codeLad-flat-vector.svg`: compact flat mark for the title bar and scalable resource SVG.
- `codeLad-symbol-artwork.svg`: full artwork source, retained alongside the raster.
- `codeLad-lockup-*-transparent-2400.png`: dark/light-background wordmarks, also used by the repository README.
- `codeLad-splash-*-1920x1080.png`: retained splash compositions for future use; no startup splash is currently implemented.

The export script is `scripts/codelad/generate-icons.mts`. It uses an optional existing sharp installation and is not part of normal app installation. See [branding notes](../docs/codelad/branding.md) for output mapping and validation limits.
