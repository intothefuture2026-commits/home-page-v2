# OG Image Guide

This folder is for social preview images used by `og:image` and `twitter:image`.

## Current file

- `og-cover.jpg`
  - Current source: copied from `../hero/main-hero1.png`
  - Current usage: linked from `index.html` metadata

## Reuse pattern

When cloning this project for another homepage:

1. Replace `og-cover.jpg` with the new project's social preview image.
2. Keep the same filename if you want to avoid changing metadata.
3. Update these values in `index.html`:
   - `title`
   - `description`
   - `canonical`
   - `og:title`
   - `og:description`
   - `og:url`
   - `twitter:title`
   - `twitter:description`

## Recommended image spec

- Size: `1200x630` preferred
- Format: `.jpg`
- Composition:
  - Keep the building or main visual centered
  - Avoid putting important text too close to the edges
  - Use a layout that still reads well when cropped in chat apps

## Note

The current `og-cover.jpg` is a direct reuse of the hero image, so it works as a default.
For best results, create a dedicated OG crop later and overwrite this file.
