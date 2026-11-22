import Image from "next/image";
import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Project } from "@/lib/site";

export function HomeFeature({ item, action }: { item: Project; action: string }) {
  const caption = (
    <div className="feature-copy">
      <h2 id="featured-title">{item.title}</h2>
      <p>{item.description}</p>
    </div>
  );

  return (
    <section id="featured-work" className="site-wrap home-feature" aria-labelledby="featured-title" tabIndex={-1}>
      <div
        className="feature-frame"
        data-screenshot={Boolean(item.screenshot)}
        style={{ aspectRatio: item.screenshot?.aspectRatio }}
      >
        {item.screenshot ? (
          <Image
            src={item.screenshot.src}
            alt={item.screenshot.alt}
            fill
            sizes="(max-width: 78rem) 89vw, 68rem"
          />
        ) : caption}
      </div>
      <div className="feature-caption">
        {item.screenshot && caption}
        <Link href={item.href} className="text-link feature-link">
          {action}<HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
