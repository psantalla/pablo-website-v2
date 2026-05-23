## Notes

Workflow uses `build` instead of `build-ghpages`. Custom domain serves from root, no path prefix needed. The `build-ghpages` / `start-ghpages` scripts (with `--pathprefix=/<repo-name>/`) are removed; re-add them if forking without a custom domain.

## Added functionality

**Projects system**: Works like posts/tags. Added `/projects/`, `/project-topics/`, and pages per topic.

**Post updates**: Optional `updated` date field and `changelog` array in frontmatter. Adds "Updated" timestamp and expandable changelog to posts. Includes JSON-LD `dateModified` for SEO.

**Image optimization**: All images processed by `@11ty/eleventy-img` plugin. SVG preserved as vectors (`svgShortCircuit: true`). Raster images (jpg/png) converted to AVIF/WebP. GIF converted to WebP animated with GIF fallback. Responsive `<picture>` tags with lazy loading.

**Video posters**: `scripts/video-posters.js` generates a sibling `.webp` for every `content/**/*.mp4` (first frame, via `ffmpeg`). Runs on `prestart`/`prebuild`, so local dev and the GitHub Action regenerate them automatically; posters are gitignored. To move this to another host or machine: ensure `ffmpeg` is on PATH (CI: installed via `apt-get` in the workflow; local: `brew install ffmpeg`).
