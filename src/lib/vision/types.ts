export type Checkpoint = { id: string; label: string };

export type RefItem = {
  slug: string;
  name: string;
  latin?: string;
  imageUrl: string; // reference-billede for arten (brug jeres egne)
  checks: Checkpoint[];
};

export type Match = {
  slug: string;
  score: number; // cosine similarity (0..1 typisk)
};
