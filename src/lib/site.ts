import "server-only";

export const site = {
  title: "CXS Portfolio",
  description: "A software portfolio and devlog about building for the web.",
  name: process.env.PORTFOLIO_NAME?.trim(),
  bio: process.env.PORTFOLIO_BIO?.trim(),
  skills: [...new Set((process.env.PORTFOLIO_SKILLS ?? "").split(",").map((skill) => skill.trim()).filter(Boolean))],
  github: process.env.PORTFOLIO_GITHUB_URL?.trim(),
  linkedin: process.env.PORTFOLIO_LINKEDIN_URL?.trim(),
  instagram: process.env.PORTFOLIO_INSTAGRAM_URL?.trim(),
  email: process.env.PORTFOLIO_EMAIL?.trim(),
  contact: process.env.PORTFOLIO_CONTACT_URL?.trim(),
};

export const siteUrl = new URL(process.env.SITE_URL || "http://localhost:3000");
export const indexable = Boolean(process.env.SITE_URL && process.env.VERCEL_ENV !== "preview");

export type Project = {
  title: string;
  description: string;
  href: string;
  gallery?: readonly { src: string; alt: string; caption: string; width: number; height: number }[];
  screenshot?: { src: string; alt: string; aspectRatio?: number };
};

const rallyDashboard = {
  src: "/images/projects/rally-scoring/dashboard.webp",
  alt: "Rally dashboard showing team and station totals, the leading team, and scores awaiting review",
  aspectRatio: 1440 / 545,
  caption: "Scoring dashboard",
  width: 1440,
  height: 545,
};

export const projects: readonly Project[] = [{
  title: "Rally Scoring",
  description: "A scoring system for the Rally Educativo Ecológico Domingo Savio. Judges score teams at each station, and spectators can follow their progress in the public standings.",
  href: "https://rally-scoring.vercel.app/",
  screenshot: rallyDashboard,
  gallery: [
    rallyDashboard,
    {
      src: "/images/projects/rally-scoring/teams.webp",
      alt: "Team roster showing member counts, scores, progress, and departure and arrival times",
      caption: "Team roster",
      width: 1440,
      height: 748,
    },
    {
      src: "/images/projects/rally-scoring/stations.webp",
      alt: "Station list organized by subject, with start and finish roles and question availability",
      caption: "Rally stations",
      width: 1440,
      height: 748,
    },
    {
      src: "/images/projects/rally-scoring/questions.webp",
      alt: "Question manager showing a multiple-choice item worth 13 points at the natural sciences station",
      caption: "Station questions",
      width: 1440,
      height: 748,
    },
    {
      src: "/images/projects/rally-scoring/results.webp",
      alt: "Standings ranked by team score, with elapsed time and progress bars for each team",
      caption: "Team standings",
      width: 1440,
      height: 748,
    },
  ],
}];
