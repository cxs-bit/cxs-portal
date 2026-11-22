import { expect, test } from "@playwright/test";

test.describe("server-rendered homepage", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the build note and its navigation before JavaScript runs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Building for the web Showing the work" })).toBeVisible();
    const feature = page.getByRole("region", { name: "A starting point" });
    await expect(feature.getByRole("heading")).toBeVisible();
    await expect(feature.getByRole("link", { name: "Read the build note" })).toHaveAttribute("href", "/blog/starting-point");
  });
});

test("keeps the headline visible when the TV intro is unavailable", async ({ page }) => {
  await page.route("**/models/crt-tv.glb", route => route.abort());
  await page.goto("/");
  await expect(page.locator("#portfolio-page")).toHaveAttribute("data-crt-intro", "static");
  const heading = page.getByRole("heading", { name: "Building for the web Showing the work" });
  await expect(heading).toBeVisible();
  await expect(heading.locator(".text-type__cursor")).toHaveCount(0);
  await expect(heading.locator("[data-pending]")).toHaveCount(0);
});

test("jumps from the hero to the published build note by keyboard at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const explore = page.getByRole("link", { name: "Explore the work" });
  await explore.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/#featured-work");

  const feature = page.getByRole("region", { name: "A starting point" });
  await expect(feature).toBeFocused();
  await expect(feature.getByRole("img", { name: /Rally Educativo Ecológico dashboard/ })).toBeInViewport();
  const buildNote = feature.getByRole("link", { name: "Read the build note" });
  await page.keyboard.press("Tab");
  await expect(buildNote).toBeFocused();
  await expect.poll(async () => {
    const dock = (await page.locator(".site-dock").boundingBox())!;
    const action = (await buildNote.boundingBox())!;
    return action.y + action.height < dock.y;
  }).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/blog/starting-point");
});

test("keeps a focused logo still and shows a wrapping list with reduced motion", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("cxs-crt-intro-seen", "1"));
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/#technology-title");

  const technologies = page.getByRole("region", { name: "Built with" });
  const loop = technologies.getByRole("region", { name: "Technology partners" });
  const track = loop.locator(".logoloop__track");
  const position = () => track.evaluate((element) => element.style.transform);
  await expect(technologies.getByRole("button")).toHaveCount(0);
  await expect(loop).toHaveCSS("--logoloop-logoHeight", "50px");
  await expect(loop).toHaveCSS("--logoloop-gap", "56px");
  const initial = await position();
  await expect.poll(position).not.toBe(initial);
  const logo = loop.getByRole("link").first();
  await logo.focus();
  await expect(logo).toBeFocused();
  await expect.poll(() => track.evaluate(async (element) => {
    const before = element.style.transform;
    await new Promise((resolve) => setTimeout(resolve, 100));
    return element.style.transform === before;
  })).toBe(true);
  const paused = await position();
  await page.getByRole("link", { name: "Read the build note" }).focus();
  await loop.scrollIntoViewIfNeeded();
  await expect.poll(position).not.toBe(paused);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(loop).toHaveCount(0, { timeout: 15000 });
  const list = technologies.getByRole("list");
  await expect(list).toHaveCount(1);
  await expect(list.getByRole("listitem")).toHaveText(["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP", "MDX"]);
  await expect(list).toHaveCSS("flex-wrap", "wrap");
  await expect(list.getByRole("link", { name: "React" })).toHaveAttribute("href", "https://react.dev");
});
