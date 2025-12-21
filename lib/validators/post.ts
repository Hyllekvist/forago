import { z } from "zod";

export const PostSchema = z.object({
  type: z.enum(["Identification", "How-to", "Recipe", "Guide"]),
  title: z.string().min(6).max(120),
  body: z.string().max(8000).optional().default(""),
});
