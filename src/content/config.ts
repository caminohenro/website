import { defineCollection, z } from 'astro:content';

const essays = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.coerce.date(),
    location: z.string().optional(),
    kilometersWalked: z.number().optional(),
    excerpt: z.string(),
    substackUrl: z.string().url().optional(), 
    source: z.enum(['native', 'substack']).optional(), 
    tags: z.array(z.string()).optional(), 
    readingTime: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { essays };
