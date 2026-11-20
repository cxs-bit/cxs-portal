# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Visitors come to browse the owner's software projects and read about how they were built. Which audience to prioritize is open.

The owner writes posts, previews drafts, and publishes work through Git.

## Product Purpose

CXS Portfolio is a personal software portfolio and devlog about building for the web. The project index gives visitors a place to explore work when there is something to share. The devlog records what changed, which decisions mattered, and what still needs work.

## Operating Context

The owner writes trusted local MDX in `content/blog/`. The filename is the lowercase kebab-case slug. Each post includes a title, description, date, and status. Posts live alongside the site code so changes and the notes about them can be reviewed together. The site deploys through Git on Vercel.

## Capabilities and Constraints

- Visitors can browse the homepage, project index, and devlog and use the visible site search. The project index and devlog archive both support an empty state.
- Public articles, search, the sitemap, and social previews use the published content catalog.
- Draft articles and assets require server-side verification of the owner's GitHub identity and an Auth.js JWT session. Draft preview is available locally and on the designated Vercel preview branch when configured. Keep unpublished material and assets out of public Git history and public asset directories.

## Brand Commitments

The site is named CXS Portfolio. Use owner-provided facts, profile details, links, and project information.

## Evidence on Hand

- `content/blog/starting-point.mdx` is the first published devlog entry. It documents the portfolio itself and describes what future entries will cover.
- `src/lib/site.ts` contains the project catalog and optional owner profile details. The project catalog is currently empty.

## Product Principles

- Publish real work when there is something visitors can explore. Keep the portfolio usable while the catalog is sparse.
- Write about decisions and work in progress alongside finished outcomes.
- Optimize articles for reading and reserve expressive motion for the homepage experience.

## Accessibility & Inclusion

Support mobile and desktop layouts, keyboard navigation, visible keyboard focus, and a visible search trigger. Keep articles in semantic HTML and respect reduced-motion preferences.
