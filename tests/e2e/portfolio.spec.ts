import { expect, test } from "@playwright/test";

test("lights nearby buttons while preserving the native cursor", async ({ page }) => {
  await page.goto("/projects");
  const spotlight = page.locator(".pointer-spotlight");
  const search = page.getByRole("button", { name: "Search", exact: true });
  await expect(search).not.toHaveCSS("cursor", "none");

  if (!await page.evaluate(() => matchMedia("(any-hover: hover) and (any-pointer: fine)").matches)) {
    await expect(spotlight).toBeHidden();
    return;
  }

  const bounds = (await search.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y - 125);
  await expect(spotlight).toHaveJSProperty("hidden", false);
  await expect(search).toHaveCSS("background-image", /radial-gradient/);
  await page.mouse.move(8, (page.viewportSize()?.height ?? 400) / 2);
  await expect(search).toHaveCSS("background-image", "none");

  await search.hover();
  await expect(search).toHaveCSS("background-image", /radial-gradient/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(spotlight).toHaveJSProperty("hidden", true);
  await expect(search).toHaveCSS("background-image", "none");
});

test("supports keyboard navigation and search dismissal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  const search = page.getByRole("button", { name: "Search", exact: true });
  await search.focus();
  await page.keyboard.press("Control+k");
  const input = page.getByRole("textbox", { name: "Search portfolio" });
  await expect(input).toBeFocused();
  await expect(page.getByText("Quick links")).toBeVisible();
  await input.fill("nothingmatches");
  await expect(page.getByRole("status")).toHaveText("No results found.");
  await expect(page.getByRole("menuitem", { name: "Projects" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(search).toBeFocused();

  await search.click();
  let firstSearch = true;
  await page.route("**/api/search?*", async (route) => {
    if (!firstSearch) {
      await route.continue();
      return;
    }
    firstSearch = false;
    await route.fulfill({ status: 503, body: "Unavailable" });
  });
  await input.fill("starting point");
  await expect(page.getByRole("status")).toHaveText("Search is temporarily unavailable.");
  await expect(page.getByRole("menuitem", { name: "Devlog" })).toBeVisible();
  await page.getByRole("button", { name: "Retry search" }).click();
  await expect(input).toHaveValue("starting point");
  await expect(input).toBeFocused();
  const result = page.getByRole("menuitem", { name: "A starting point" });
  await expect(result).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(result).toHaveAttribute("data-focused", "true");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/blog/starting-point");
  await expect(page.getByRole("heading", { name: "A starting point" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Devlog" }))
    .toHaveAttribute("aria-current", "location");
});

test("keeps the dark palette and preserves readable reduced-motion layouts", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/");
  const root = page.locator("html");
  await expect(root).toHaveClass(/\bdark\b/);
  await expect(root).toHaveCSS("color-scheme", "dark");
  const background = page.locator(".site-crt");
  await expect(background).toHaveCSS("background-color", "rgb(9, 28, 27)");
  await expect(root).not.toHaveClass(/\blenis\b/);
  await expect(page.getByRole("combobox", { name: "Color theme" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Building for the web Showing the work" })).toBeVisible();
  await expect(page.locator(".text-type__cursor")).toHaveCount(0);
  await expect(background).toBeVisible();
  await expect(background).toHaveCSS("position", "fixed");
  await expect(background).toHaveCSS("pointer-events", "none");
  await expect(background).toHaveCSS("background-image", "none");
  await expect(background.locator("canvas")).toHaveCount(0);
  await background.evaluate((element) => element.setAttribute("data-test-retained", "true"));
  const dock = page.locator(".site-dock");
  await expect(dock).toHaveCSS("position", "fixed");

  for (const width of [320, 640, 768, 1280]) {
    await page.setViewportSize({ width, height: 840 });
    await expect.poll(() => page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ), { message: `Page overflows at ${width}px` }).toBe(true);
    await expect.poll(async () => {
      const bounds = (await dock.boundingBox())!;
      return Math.abs(bounds.x + bounds.width / 2 - width / 2) < 2 && bounds.y + bounds.height < 840;
    }).toBe(true);
  }

  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByRole("link", { name: "Explore the work" })).toBeInViewport();

  await dock.getByRole("link", { name: "Projects" }).click();
  await expect(page.getByRole("heading", { name: "Rally Scoring" })).toBeVisible();
  await expect(dock.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
  await expect(background).toBeVisible();
  await expect(background).toHaveAttribute("data-test-retained", "true");
  await expect(page.getByRole("link", { name: "Visit Rally Scoring" })).toHaveAttribute("href", "https://rally-scoring.vercel.app/");
  await expect(page.getByRole("img", { name: /Standings ranked by team score/ })).toBeVisible();
  await dock.getByRole("link", { name: "Devlog" }).click();
  await page.getByRole("link", { name: "A starting point" }).click();
  await expect(page.getByRole("heading", { name: "A starting point" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to the devlog" })).toBeVisible();
});

test("serves public metadata and keeps preview routes private in production", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/opengraph-image/);
  await page.goto("/projects");
  const projectImage = page.locator('meta[property="og:image"]');
  await expect(projectImage).toHaveAttribute("content", /\/projects\/opengraph-image/);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", (await projectImage.getAttribute("content"))!);
  await expect(page.locator('meta[property="og:video"]')).toHaveAttribute("content", /^https?:\/\/.+\/rally-scoring-demo\.mp4$/);
  await page.goto("/blog/starting-point");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "A starting point");
  const postImage = page.locator('meta[property="og:image"]');
  await expect(postImage).toHaveAttribute("content", /\/blog\/starting-point\/opengraph-image/);
  const postImagePath = new URL((await postImage.getAttribute("content"))!).pathname;
  expect((await request.get("/opengraph-image")).headers()["content-type"]).toContain("image/png");
  expect((await request.get(postImagePath)).headers()["content-type"]).toContain("image/png");
  expect((await request.get("/blog/unknown")).status()).toBe(404);
  expect((await request.get("/robots.txt")).headers()["content-type"]).toContain("text/plain");
  expect((await request.get("/sitemap.xml")).headers()["content-type"]).toContain("xml");
  expect((await request.get("/preview")).status()).toBe(404);
  expect((await request.get("/preview/blog/hidden")).status()).toBe(404);
  expect((await request.get("/api/auth/session")).status()).toBe(404);
  expect((await request.get("/preview/assets/hidden/draft.png")).status()).toBe(404);
});
