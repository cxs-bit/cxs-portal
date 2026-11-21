import { afterEach, describe, expect, it, vi } from "vitest";
import { featuredProjectKey, selectSessionProject } from "../src/lib/featured-project";
import type { Project } from "../src/lib/site";

const first: Project = { title: "First", description: "The first project.", href: "/first" };
const second: Project = {
  title: "Second", description: "The second project.", href: "/second",
  screenshot: { src: "/images/second.webp", alt: "The second project’s screen" },
};

function session(savedHref?: string) {
  const data = new Map<string, string>();
  if (savedHref) data.set(featuredProjectKey, savedHref);

  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("featured projects", () => {
  it("leaves the session untouched when the catalog is empty", () => {
    const storage = session();
    expect(selectSessionProject([], storage)).toBeUndefined();
    expect(storage.getItem(featuredProjectKey)).toBeNull();
  });

  it("always selects the sole project even without a screenshot", () => {
    const storage = session("/removed");
    expect(selectSessionProject([first], storage)).toBe(first);
    expect(storage.getItem(featuredProjectKey)).toBe(first.href);
  });

  it("selects a random project once per session and keeps it when the catalog is reordered", () => {
    const random = vi.spyOn(Math, "random").mockReturnValueOnce(0.9).mockReturnValueOnce(0.1);
    const storage = session();
    expect(selectSessionProject([first, second], storage)).toBe(second);
    expect(selectSessionProject([second, first], storage)).toBe(second);
    expect(selectSessionProject([first, second], session())).toBe(first);
    expect(random).toHaveBeenCalledTimes(2);
  });

  it("replaces an expired selection with a project from the current catalog", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const storage = session("/removed");
    expect(selectSessionProject([first, second], storage)).toBe(second);
    expect(storage.getItem(featuredProjectKey)).toBe(second.href);
  });
});
