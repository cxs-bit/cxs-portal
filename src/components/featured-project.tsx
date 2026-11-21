"use client";

import { useEffect, useState } from "react";
import { HomeFeature } from "@/components/home-feature";
import { selectSessionProject } from "@/lib/featured-project";
import type { Project } from "@/lib/site";

export function FeaturedProject({ initial, projects }: { initial: Project; projects: readonly Project[] }) {
  const [selectedHref, setSelectedHref] = useState(initial.href);
  const selected = projects.find(({ href }) => href === selectedHref) ?? initial;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const project = selectSessionProject(projects, window.sessionStorage);
        if (project) setSelectedHref(project.href);
      } catch {
        setSelectedHref(initial.href);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [initial.href, projects]);

  return <HomeFeature item={selected} action="View project" />;
}
