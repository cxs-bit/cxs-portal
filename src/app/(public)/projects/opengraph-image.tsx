import { projects } from "@/lib/site";
import { socialCard, socialSize } from "@/lib/social-card";

export const alt = "Featured project from CXS Portfolio";
export const size = socialSize;
export const contentType = "image/png";

export default function ProjectsImage() {
  const rally = projects.find(project => project.demo?.id === "rally-scoring-demo");
  return rally
    ? socialCard(rally.title, "Project demo", "rally-scoring")
    : socialCard("Projects", "Portfolio");
}
