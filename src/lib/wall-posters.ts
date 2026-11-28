export type WallPoster = {
  id: string;
  title: string;
  description: string;
  source?: string;
  image?: string;
  kind: "project" | "technology" | "portrait" | "track" | "playlist";
};

export type WallPosterCatalog = Record<"portfolio" | "work", WallPoster[]>;
