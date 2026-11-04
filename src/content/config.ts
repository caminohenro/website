import { defineCollection, z } from 'astro:content';

const essaysCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.coerce.date(),
    location: z.string(),
    kilometersWalked: z.number().optional(),
    readingTime: z.string().optional(),
    excerpt: z.string(),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
    translationControl: z.enum(['auto', 'queue', 'ignore']).default('auto'),
  }),
});

export const collections = {
  essays: essaysCollection,
};
