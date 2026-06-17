# ruiqian.dev — Personal Website

My personal portfolio. Built with [Astro](https://astro.build), Markdown
content, and hand-written CSS/JS. Deploys as a static site.

## Stack
- **Astro** — components + content collections, ships zero JS by default
- **Markdown/MDX** — one file per project under `src/content/projects/`
- **Vanilla CSS** — design tokens in `src/styles/global.css` (see `DESIGN.md`)
- **Hosting** — static `dist/` (GitHub Pages / Cloudflare Pages)

## Develop
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output -> dist/
npm run preview  # preview the production build
```

## Add a project
Create `src/content/projects/<slug>.mdx` with frontmatter:

```mdx
---
title: My Thing
summary: One-line description
status: in-progress      # in-progress | on-hold | completed | dropped
startDate: 2026-07-01
cover: /assets/my-thing.png
intro:
  - First sidebar paragraph.
requirements: [Compact, Cheap]
repo: https://github.com/you/my-thing   # optional
---

<FeedHeading>Dev Log</FeedHeading>

<LogEntry title="Day 1" date="Jul 1, 2026">
  <ImageGrid images={[{ src: '/assets/my-thing.png', alt: 'My Thing' }]} />
  What I did today.
</LogEntry>
```

It appears automatically in the projects grid, the home arc deck, filters,
and sorting.

## Structure
```
src/
  content/projects/   project Markdown (the source of truth)
  content.config.ts   Zod schema for project frontmatter
  layouts/Base.astro  <head>, theme guard, shared script
  components/         Nav, Footer, ThemeToggle, ImageGrid, LogEntry…
  pages/             index, projects, projects/[slug], resume, 404
  styles/global.css  design tokens + site-wide styles
public/              icons, images, assets, CNAME, /scripts/*.js
_legacy/             the previous vanilla HTML site (reference only)
```
