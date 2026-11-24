import Image from "next/image";
import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { CSSProperties } from "react";
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
          {item.demo && <Link href={`/projects#${item.demo.id}`} className="text-link">Watch demo</Link>}
          {item.href !== "/projects" && <Link href="/projects" className="text-link">All projects</Link>}
        </div>
      </div>
      {item.screenshot && (
        <div
          className="feature-frame"
          style={{ "--feature-image-ratio": item.screenshot.aspectRatio ?? 16 / 9 } as CSSProperties}
        >
          <Image
            src={item.screenshot.src}
            alt={item.screenshot.alt}
            fill
            sizes="(max-width: 33rem) calc(89vw - 2rem - 2px), (max-width: 76.4rem) calc(83vw - 2px), (max-width: 83.4rem) calc(68rem - 6vw - 2px), calc(63rem - 2px)"
          />
        </div>
      )}
    </section>
  );
}
