import type { SearchResult } from "@/generated/portfolio";

export function rankSearchResults(
  entries: { result: SearchResult; keywords?: string[] }[],
  rawQuery: string,
) {
  const query = rawQuery.trim().slice(0, 100).toLowerCase();
  const words = query.split(/\s+/);
  if (!query) return [];

  return entries
    .map(({ result, keywords = [] }) => {
      const title = result.title.toLowerCase();
      const description = result.description.toLowerCase();
      const searchable = `${title} ${description} ${keywords.join(" ").toLowerCase()}`;
      const score = title === query ? 4
        : title.includes(query) ? 3
        : words.every((word) => title.includes(word)) ? 2
        : words.every((word) => searchable.includes(word)) ? 1
        : 0;
      return { result, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ result }) => result);
}
