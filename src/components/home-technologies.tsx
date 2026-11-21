import "server-only";

import * as icons from "simple-icons";
import { CodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TechnologyLoop } from "@/components/technology-loop";

const suppliedLogos = [
  { title: "React", href: "https://react.dev", hoverColor: "#61dafb" },
  { title: "Next.js", href: "https://nextjs.org" },
  { title: "TypeScript", href: "https://www.typescriptlang.org", hoverColor: "#3178c6" },
  { title: "Tailwind CSS", href: "https://tailwindcss.com", hoverColor: "#38bdf8" },
];

function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const marks = new Map<string, string>();
const suppliedByName = new Map(suppliedLogos.map((logo) => [normalize(logo.title), logo]));
for (const { title, slug, path } of Object.values(icons)) {
  marks.set(slug, path);
  marks.set(normalize(title), path);
}

export function HomeTechnologies({ skills }: { skills: readonly string[] }) {
  const initial = skills.length ? skills : [...suppliedLogos.map(({ title }) => title), "GSAP", "MDX"];
  const names = new Map(initial.map((title) => [normalize(title), title]));
  for (const [key, { title }] of suppliedByName) {
    if (!names.has(key)) names.set(key, title);
  }

  const logos = Array.from(names, ([key, title]) => {
    const path = marks.get(key);
    return {
      ...suppliedByName.get(key),
      title,
      node: path ? (
        <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
          <path d={path} />
        </svg>
      ) : <HugeiconsIcon icon={CodeIcon} size="1em" aria-hidden="true" />,
    };
  });

  return <TechnologyLoop title={skills.length ? "Technologies" : "Built with"} logos={logos} />;
}
