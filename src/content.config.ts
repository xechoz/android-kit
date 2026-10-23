import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

const components = defineCollection({
  loader: glob({ base: './src/content/components', pattern: '**/*.mdx' }),
  schema: z.object({
    locale: z.enum(['zh', 'en']),
    title: z.string(),
  }),
});

export const collections = { components };
