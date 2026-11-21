import type { Project } from "./site";

export const featuredProjectKey = "cxs-featured-project";

export function selectSessionProject(projects: readonly Project[], storage: Pick<Storage, "getItem" | "setItem">) {
  if (!projects.length) return undefined;

  const savedHref = storage.getItem(featuredProjectKey);
  const savedProject = projects.find(({ href }) => href === savedHref);
  if (savedProject) return savedProject;

  const project = projects[Math.floor(Math.random() * projects.length)];
  storage.setItem(featuredProjectKey, project.href);
  return project;
}
