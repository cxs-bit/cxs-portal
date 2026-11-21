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
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height + 125);
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
  await page.addInitScript(() => sessionStorage.setItem("cxs-crt-intro-seen", "1"));
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
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(search).toBeFocused();

  await search.click();
  await input.fill("starting point");
  await expect(page.getByRole("menuitem", { name: "A starting point" })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/blog/starting-point");
  await expect(page.getByRole("heading", { name: "A starting point" })).toBeVisible();
});

test("persists themes and preserves readable reduced-motion layouts", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect(root).toHaveClass(/\bdark\b/);
  const background = page.locator(".site-crt");
  await expect(background).toHaveCSS("background-color", "rgb(9, 28, 27)");
  await expect(root).not.toHaveClass(/\blenis\b/);
  await page.getByLabel("Color theme").selectOption("light");
  await expect(root).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("heading", { name: "Building for the web." })).toBeVisible();
  await expect(background).toBeVisible();
  await expect(background).toHaveCSS("position", "fixed");
  await expect(background).toHaveCSS("pointer-events", "none");
  await expect(background).toHaveCSS("background-image", /radial-gradient/);
  await expect(background).not.toHaveCSS("background-image", /repeating-linear-gradient/);
  await expect(background.locator("canvas")).toHaveCount(0);
  await background.evaluate((element) => element.setAttribute("data-test-retained", "true"));

  for (const width of [320, 640, 768, 1280]) {
    await page.setViewportSize({ width, height: 840 });
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fits, `Page overflows at ${width}px`).toBe(true);
  }

  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByRole("heading", { name: "Latest writing" })).toBeInViewport();

  await page.getByRole("link", { name: "Browse projects" }).click();
  await expect(page.getByRole("heading", { name: "No projects published yet" })).toBeVisible();
  await expect(background).toBeVisible();
  await expect(background).toHaveAttribute("data-test-retained", "true");
  await expect(page.getByRole("link", { name: "Read the devlog" })).toBeVisible();
});

test("serves public metadata and keeps preview routes private in production", async ({ page, request }) => {
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
