## Notes

Workflow uses `build` instead of `build-ghpages`. Custom domain serves from root, no path prefix needed.

## Added functionality

**Projects system**: Works like posts/tags. Added `/projects/`, `/project-topics/`, and pages per topic.

**Post updates**: Optional `updated` date field and `changelog` array in frontmatter. Adds "Updated" timestamp and expandable changelog to posts. Includes JSON-LD `dateModified` for SEO.

**Image optimization**: All images processed by `@11ty/eleventy-img` plugin. SVG preserved as vectors (`svgShortCircuit: true`). Raster images (jpg/png) converted to AVIF/WebP. GIF converted to WebP animated with GIF fallback. Responsive `<picture>` tags with lazy loading.
