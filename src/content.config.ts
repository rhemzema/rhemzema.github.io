import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Projects collection — one file per project under src/content/projects/.
 * Body (MDX) is the dev-log "feed"; sidebar metadata lives in frontmatter.
 * The Zod schema below is the single source of truth: a typo in `status`
 * or a missing date fails the build instead of silently breaking the UI.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(['in-progress', 'on-hold', 'completed', 'dropped']),
    startDate: z.coerce.date(),
    // Optional cover image (path under /public, e.g. "/assets/foo.png")
    cover: z.string().optional(),
    // Sidebar intro paragraphs
    intro: z.array(z.string()).default([]),
    // Sidebar "Basic Requirements" chips
    requirements: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    // Hide from listings without deleting the file
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
