import { z } from "zod";

export const FindSchema = z.object({
  species_slug: z.string().min(2).max(80),
  quality: z.number().int().min(1).max(5),
  notes: z.string().max(2000).optional().default(""),
  cell_id: z.string().min(6).max(80),
  precision_level: z.number().int().min(0).max(4).default(2),
});
