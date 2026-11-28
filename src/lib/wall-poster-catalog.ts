import "server-only";

import { getPublishedChannels } from "./channels";
import { projects, site } from "./site";
import type { WallPosterCatalog } from "./wall-posters";

export async function getWallPosterCatalog(): Promise<WallPosterCatalog> {
  const { personal } = await getPublishedChannels();
  const portrait = personal?.portrait;
  const portfolio: WallPosterCatalog["portfolio"] = projects.flatMap((project) => {
    const screenshots = project.gallery?.length
      ? project.gallery
      : project.screenshot ? [{ ...project.screenshot, caption: project.title }] : [];

    return [
      ...screenshots.map((screenshot) => ({
        id: screenshot.src,
        title: screenshot.caption,
        source: project.title,
        description: screenshot.alt,
        image: screenshot.src,
        kind: "project" as const,
      })),
      ...(project.technologies ?? []).map((technology) => ({
        id: `${project.href}-${technology.title}`,
        title: technology.title,
        description: `Used in ${project.title}.`,
        image: technology.logo,
        kind: "technology" as const,
      })),
    ];
  });

  return {
    portfolio,
    work: [{
      id: "work-portrait",
      title: site.name ?? "Carlos Sosa",
      description: portrait?.alt ?? "Portrait coming soon.",
      image: portrait?.href,
      kind: "portrait",
    }],
  };
}
