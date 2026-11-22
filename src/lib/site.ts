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
  screenshot?: { src: string; alt: string; aspectRatio?: number };
};

export const projects: readonly Project[] = [];
