import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const creations = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/creations" }),
  schema: z.object({
    title: z.string(),
    image: z.string(),
    type: z.enum(["flyer", "brochure", "affiche", "packaging", "identite", "logo", "web", "autre"]),
    description: z.string().optional(),
    likes: z.number().default(0),
    date: z.string().optional(),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string().optional(),
    affiche: z.string(),
  }),
});

export const collections = {
  creations: creations,
  events: events,
};
