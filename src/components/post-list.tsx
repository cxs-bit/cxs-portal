import Link from "next/link";
import { formatPostDate, type PostSummary } from "@/lib/post-schema";

export function PostList({ posts, preview = false }: { posts: PostSummary[]; preview?: boolean }) {
  if (posts.length === 0) return <p className="empty-copy">{preview ? "There are no drafts to preview." : "There are no published entries yet."}</p>;

  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link className="post-row" href={`${preview ? "/preview" : ""}/blog/${post.slug}`} prefetch={preview ? false : undefined}>
            <h3>{post.title}</h3>
            <p>{post.description}</p>
            <div className="post-meta">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              {post.tags[0] && <span className="post-tag">{post.tags[0]}</span>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
