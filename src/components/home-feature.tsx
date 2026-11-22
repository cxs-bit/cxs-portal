import Image from "next/image";
import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { buttonVariants } from "@/components/ui/button";
import type { Project } from "@/lib/site";

export function HomeFeature({ item, action }: { item: Project; action: string }) {
  return (
    <section id="featured-work" className="site-wrap home-feature" aria-labelledby="featured-title" tabIndex={-1}>
      <div className="feature-copy">
        <h2 id="featured-title">{item.title}</h2>
        <p>{item.description}</p>
        <div className="home-actions">
          <Link href={item.href} className={buttonVariants({ variant: "secondary", size: "lg" })}>
            {action}<HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
          </Link>
          {item.href !== "/projects" && <Link href="/projects" className="text-link">All projects</Link>}
        </div>
      </div>
      {item.screenshot && (
        <div className="feature-frame">
          <Image
            src={item.screenshot.src}
            alt={item.screenshot.alt}
            fill
            sizes="(max-width: 78rem) 84vw, 63rem"
          />
        </div>
      )}
    </section>
  );
}
