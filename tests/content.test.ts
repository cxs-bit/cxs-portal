import { describe, expect, it } from "vitest";
import { parsePostSummary, publishedPosts } from "../src/lib/post-schema";
import { rankSearchResults } from "../src/lib/search";
import type { SearchResult } from "../src/generated/portfolio";

const frontmatter = { title: "Update", description: "An update.", date: "2026-11-18", status: "published" };

describe("devlog metadata", () => {
  it("normalizes YAML dates and defaults optional tags", () => {
    expect(parsePostSummary("update", { ...frontmatter, date: new Date("2026-11-18") }))
      .toEqual({ ...frontmatter, slug: "update", tags: [] });
  });

  it("rejects malformed slugs, missing status, and invalid dates", () => {
    expect(() => parsePostSummary("InvalidSlug", frontmatter)).toThrow("Invalid devlog slug");
    expect(() => parsePostSummary("update", { ...frontmatter, status: undefined })).toThrow("Invalid frontmatter");
    expect(() => parsePostSummary("update", { ...frontmatter, date: "2026-02-31" })).toThrow("Invalid frontmatter");
  });

  it("orders published posts by date and excludes drafts", () => {
    const posts = [
      parsePostSummary("first", { ...frontmatter, date: "2026-10-18" }),
      parsePostSummary("draft", { ...frontmatter, status: "draft" }),
      parsePostSummary("second", frontmatter),
    ];
    expect(publishedPosts(posts).map(({ slug }) => slug)).toEqual(["second", "first"]);
  });
});

describe("portfolio search", () => {
  function entry(href: string, title: string, description = "", keywords?: string[]) {
    const result: SearchResult = { title, description, href, kind: "post" };
    return { result, keywords };
  }

  it("prioritizes title matches and supports tags without changing result descriptions", () => {
    const results = rankSearchResults([
      entry("/tag", "Another post", "About this site.", ["devlog"]),
      entry("/description", "My update", "A new devlog entry."),
      entry("/partial", "Devlog update"),
      entry("/exact", "Devlog"),
    ], " DEVLOG ");
    expect(results.map(({ href }) => href)).toEqual(["/exact", "/partial", "/tag", "/description"]);
    expect(results[2].description).toBe("About this site.");
  });

  it("limits results and handles blank and unmatched queries", () => {
    const entries = Array.from({ length: 12 }, (_, index) => entry(`/project-${index}`, `Project ${index}`));
    expect(rankSearchResults(entries, "project")).toHaveLength(8);
    expect(rankSearchResults(entries, "   ")).toEqual([]);
    expect(rankSearchResults(entries, "missing")).toEqual([]);
  });
});
