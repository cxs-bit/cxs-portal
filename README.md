# CXS Portfolio

A Next.js software portfolio with a Git-based devlog and owner-only draft preview.

## Develop locally

Use Node.js 24 and pnpm 10.33.0.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Copy `.env.example` to `.env.local` to add profile
details or opt into local draft preview. The portfolio runs without secrets.
Set `PORTFOLIO_NAME` and a short first-person `PORTFOLIO_BIO` for the homepage.
The first sentence of the bio appears in the hero. `PORTFOLIO_SKILLS` accepts
comma-separated technology names. The loop includes React, Next.js,
TypeScript, and Tailwind CSS, plus the configured technologies. Names
recognized by Simple Icons include their brand mark. Set `PORTFOLIO_EMAIL`
to a public email address and use
`PORTFOLIO_LINKEDIN_URL`, `PORTFOLIO_INSTAGRAM_URL`, and `PORTFOLIO_GITHUB_URL`
for public profiles. `PORTFOLIO_CONTACT_URL` also supports an existing contact
page. Set `SITE_URL` to the public HTTPS origin in Vercel Production so
canonicals, social metadata, and the sitemap use the production address.

The shadcn Maia preset (`b6Z8EJSgS`) uses Figtree for body and display text
pending verification of Thunder’s license.
Once the official license allows the intended web embedding and distribution,
self-host the licensed WOFF2 and set `--font-thunder` to its family name.

## TV channels

Share `/portfolio` for projects, `/work` for the professional profile, and
`/personal` for the portrait and music. The shop at `/` offers channels that
have content. The arrows tune the preview. Scroll or use the entry button
to open the selected destination.

The presence of an approved `content/channels/work.json` or
`content/channels/personal.json` publishes that channel. Each file takes the
following shape. Replace the example values with owner-approved material.

```json
{
  "introduction": "Professional introduction",
  "cv": { "href": "/files/cv.pdf", "label": "Read my CV (PDF)" },
  "approach": ["A working principle"],
  "education": [{ "qualification": "Qualification", "school": "Institution", "period": "Dates" }]
}
```

```json
{
  "portrait": { "href": "/images/portrait.webp", "alt": "Photo description", "caption": "Photo caption" },
  "playlist": "https://music.youtube.com/playlist?list=YOUR_PLAYLIST_ID",
  "fact": "A fact about this portfolio."
}
```

Omit unfinished fields to use the section placeholders. The portrait card appears
when a photo, caption, and alt text are supplied. Use the shared URL of a
public or unlisted YouTube Music playlist. The player follows the playlist order
and provides a direct link for tracks that restrict embedded playback.

Stage drafts in the Git-ignored `content/channels/private/` directory using
the same filenames. Sign in at `/preview` with the owner account and open the
shop. Store draft files under `private/work/` or `private/personal/` and link
to `/preview/channel-assets/work/<file>` or its Personal equivalent.
After approval, move the assets to public paths, update their links, and
publish the JSON. URLs may also point to approved HTTPS assets.

## Write and publish

Add a kebab-case `.mdx` file under `content/blog/`, using the filename as the slug.

```md
---
title: A project update
description: A short summary for search, the archive, and link previews.
date: 2026-11-18
status: draft
tags: [Portfolio]
---

Write your update here.
```

Use trusted MDX from this repository. Start article sections at heading level
two. For images, use `![Description](./image.webp)` or
`<Image src="./image.webp" alt="Description" width="1200" height="800" />`.
The dimensions reserve the exact aspect ratio. Use PNG, JPEG, WebP, or AVIF.

- Store draft images in `content/blog/_assets/<slug>/`. When the Git repository
  is public, keep drafts and their images local or use a private source
  repository for draft hosting. Keep unpublished files off the production
  branch.
- When publishing, move the post’s images to `public/images/blog/<slug>/`,
  change its status to `published`, and merge the post through Git. Public
  articles, search, the sitemap, and social cards use the published catalog.
- Add real project entries to `src/lib/site.ts` when there is work to link to.
  Use a unique `href` for each project. To include a homepage screenshot, add
  `screenshot: { src: "/images/projects/project-name.webp", alt: "Description of the screenshot" }`
  and put the public image in `public/images/projects/`.

## Configure draft preview

1. Create separate GitHub OAuth apps for local use and the stable Vercel
   `preview` branch URL. Set each authorization callback to its origin plus
   `/api/auth/callback/github`.
2. Set `AUTH_URL` to that environment’s origin, add the GitHub app client ID
   and secret as `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`, and generate a
   separate `AUTH_SECRET` for each environment, for example with
   `openssl rand -base64 32`.
3. Set `PORTFOLIO_OWNER_GITHUB_ID` to the owner’s numeric GitHub account ID
   and `ENABLE_DRAFT_PREVIEW=true`. Scope the Vercel variables to Preview on
   the `preview` branch. Enable Vercel’s system environment variables so
   the app receives deployment and branch information.
4. On the configured origin, open `/preview`, sign in with the owner account,
   and open a test draft. Without an owner session, direct draft article links
   lead to sign-in and draft image URLs return 404.

GitHub OAuth and preview are disabled in production and on other Vercel
branches. Keep credentials in local or Vercel environment settings.

## Verify and deploy

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm api:generate
pnpm build
pnpm exec playwright install --with-deps
pnpm test:e2e
```

Check that `pnpm api:generate` leaves the generated client unchanged after
generation. CI repeats these checks and tests desktop and mobile layouts.

Import the intended Git repository in Vercel using the Next.js preset,
Node.js 24, and `prod` as the production branch. Make changes on `dev`
and promote tested commits to `prod` for release. Set the production origin
and profile variables. Use the Vercel branch URL to check draft sign-in and
verify the public pages, search, and share metadata before production.
After release, check the public routes, sitemap, and 404s against that
deployment URL. Use Vercel’s rollback action to restore the last successful
deployment if a release check fails.

## Background and artwork

The homepage intro uses [CRT-TV by SketchyBot](https://sketchfab.com/3d-models/crt-tv-5f827ab96d184431a0179ceb7c463157), distributed under the [Sketchfab Standard license](https://sketchfab.com/licenses). The model is stored at `public/models/crt-tv.glb`.

The homepage previews a project from the public catalog. When the catalog is
empty, the published “A starting point” build note uses the CRT intro
screenshot at `public/images/starting-point-crt.webp`.

The shared layout uses a fixed React Bits CRTWarp background. The dark
background stays visible when reduced motion is enabled or WebGL2 is
unavailable.

`public/images/hero-sculpture.webp` was generated with the built-in image
generator from this prompt.

> Create a landscape website hero artwork, no text or graphic overlay.
> Photorealistic editorial CGI of a single flowing brushed-metal ribbon
> folded into a complex, open, asymmetrical knot that looks like a
> monumental polished sculpture. Place it centered in the right half with
> room around the silhouette, pure near-black empty black left third and
> corners. Hard directional studio lighting with a vivid warm
> vermilion-orange rim, sculptural cool silver metallic highlights on the
> folds, subtle film grain. Rest on a barely visible matte charcoal plane.
> Bold independent developer portfolio, subtle brutalist industrial art
> direction, premium analog studio photo, high contrast. Wide landscape
> 3:2 composition. No typography, people, repeating elements, grids, or
> watermark.
# cxs-portal
