import type { ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { formatPostDate, isArticleAsset, type PostSummary } from "@/lib/post-schema";

export function Article({ post, preview = false }: {
  post: { summary: PostSummary; body: string };
  preview?: boolean;
}) {
  const { summary, body } = post;

  function ArticleImage({ src, alt, width, height }: ComponentProps<"img">) {
    const file = typeof src === "string" && src.startsWith("./") ? src.slice(2) : "";
    if (!isArticleAsset(file)) {
      throw new Error(`Invalid image in ${summary.slug}. Use ./filename.webp and see the publishing guide.`);
    }

    const url = preview ? `/preview/assets/${summary.slug}/${file}` : `/images/blog/${summary.slug}/${file}`;
    const parsedWidth = Number(width);
    const parsedHeight = Number(height);
    if (parsedWidth > 0 && parsedHeight > 0) {
      return <Image src={url} alt={alt ?? ""} width={parsedWidth} height={parsedHeight}
        sizes="(max-width: 760px) 92vw, 720px" unoptimized={preview} />;
    }
    return (
      <span className="article-image">
        <Image src={url} alt={alt ?? ""} fill sizes="(max-width: 760px) 92vw, 720px" unoptimized={preview} />
      </span>
    );
  }

  return (
    <article className="reading-wrap">
      <Link href={preview ? "/preview" : "/blog"} className="text-link" prefetch={preview ? false : undefined}>
        {preview ? "All drafts" : "All devlog entries"}
      </Link>
      <header className="article-heading">
        <time dateTime={summary.date}>{formatPostDate(summary.date)}</time>
        {preview && <span className="post-tag">Draft</span>}
        <h1>{summary.title}</h1>
        <p>{summary.description}</p>
        {summary.tags.length > 0 && <ul className="article-tags" aria-label="Tags">
          {summary.tags.map((tag, index) => <li key={`${tag}-${index}`}>{tag}</li>)}
        </ul>}
      </header>
      <div className="prose">
        <MDXRemote
          source={body}
          components={{ img: ArticleImage, Image: ArticleImage }}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </div>
    </article>
  );
}
