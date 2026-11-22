# AGENTS.md

## Project

CXS is a personal software portfolio and project devlog. The homepage uses
expressive motion and articles prioritize reading. Support an empty project
index and blog archive. Use owner-provided facts, links, and project
information.

## Development

- Make all portfolio changes on `dev`. Promote tested commits to `prod`
  for a production release.
- Use Next.js App Router, strict TypeScript, Tailwind CSS, and pnpm on  
  Node.js 24. Deploy through Git on Vercel.
- Default to Server Components. Keep browser-only logic in small client
  components. Use shadcn/ui for shared controls, React Aria for search,
  and React Bits CRTWarp for the site-wide background. The shadcn preset
  is Maia, code `b6Z8EJSgS`.
- Use Thunder for headings once its web embedding and redistribution terms
  are verified. Use the preset’s Figtree for body text and as the display
  fallback.
- Preserve responsive layouts, keyboard navigation, visible focus, and the
  visible search trigger. Keep article text in semantic HTML. Scope GSAP and
  Lenis to the homepage, respect reduced motion, and clean up on navigation.
- Update `api/openapi.yaml` when changing the search contract. Run
  `pnpm api:generate` to refresh the Orval client.

## Publishing

- Write trusted local MDX under `content/blog/`. Use a lowercase kebab-case
  filename for the slug. Include title, description, date, and status.
- Use the published-content loader for all public surfaces. Keep draft
  rendering and draft assets behind server-side GitHub owner verification
  and the Auth.js JWT session. Keep unpublished material and assets out of
  public Git history and public asset directories.
- Enable preview locally and on the designated Vercel preview branch only.
  See the README for credential, image, and publishing setup.

## Verification

- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before
  handoff. Run `pnpm test:e2e` against the production build for changes to
  navigation, search, themes, or content behavior.
- Check affected layouts on mobile and desktop. Verify keyboard behavior,
  focus, and reduced motion where relevant. For content changes, verify
  metadata and the public visibility of drafts and their assets.
