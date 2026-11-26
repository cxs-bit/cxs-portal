import { expect, test } from "@playwright/test";

test.describe("server-rendered homepage", () => {
  test.use({ javaScriptEnabled: false });

  test("opens the top navigation and follows a direct link without JavaScript", async ({ page }) => {
    await page.goto("/portfolio");
    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    const menu = navigation.locator("summary").filter({ hasText: "Menu" });
    const projects = navigation.getByRole("link", { name: "Projects" });
    await expect(projects).toBeHidden();
    await menu.focus();
    await page.keyboard.press("Enter");
    await expect(projects).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Change channel" })).toHaveAttribute("href", "/?tune=portfolio#channels");
    await projects.click();
    await expect(page).toHaveURL("/projects");
    await menu.click();
    await expect(projects).toHaveAttribute("aria-current", "page");
  });

  test("shows the featured project and its link before JavaScript runs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Building for the web Showing the work" })).toBeVisible();
    const feature = page.getByRole("region", { name: "Rally Scoring" });
    await expect(feature.getByRole("heading")).toBeVisible();
    await expect(feature.getByRole("link", { name: "View project" })).toHaveAttribute("href", "https://rally-scoring.vercel.app/");
    await expect(feature.getByRole("link", { name: "All projects" })).toHaveAttribute("href", "/projects");
    const about = page.getByRole("region", { name: "About me" });
    await expect(about.getByRole("link", { name: "Read my devlog" })).toHaveAttribute("href", "/blog");
    await page.getByRole("link", { name: "Contact me", exact: true }).click();
    const contact = page.getByRole("region", { name: "Contact me" });
    await expect(contact).toBeFocused();
    await expect(contact.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", /^https?:/);
    await expect(contact.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", /^https?:/);
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

test("jumps from the hero to the featured project by keyboard at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const explore = page.getByRole("link", { name: "Explore the work" });
  await explore.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/#featured-work");

  const feature = page.getByRole("region", { name: "Rally Scoring" });
  await expect(feature).toBeFocused();
  await expect(feature.getByRole("img", { name: /Rally dashboard/ })).toBeInViewport();
  const projectLink = feature.getByRole("link", { name: "View project" });
  await page.keyboard.press("Tab");
  await expect(projectLink).toBeFocused();
  await expect.poll(async () => {
    const header = (await page.locator(".site-card-nav").boundingBox())!;
    const action = (await projectLink.boundingBox())!;
    return action.y >= header.y + header.height && action.y + action.height <= 720;
  }).toBe(true);
  await expect(projectLink).toHaveAttribute("href", "https://rally-scoring.vercel.app/");
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
  await expect(loop).toHaveCSS("--logoloop-logoHeight", "75px");
  await expect(loop).toHaveCSS("--logoloop-gap", "56px");
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 720 });
    await expect.poll(() => loop.evaluate((element) => {
      const { left, right } = element.getBoundingClientRect();
      return left === 0 && right === document.documentElement.clientWidth;
    })).toBe(true);
  }
  await loop.scrollIntoViewIfNeeded();
  const initial = await position();
  await expect.poll(position).not.toBe(initial);
  // Keyboard focus can center a logo, changing which link is first visible.
  const focusedName = await loop.getByRole("link").first().evaluate(link => {
    (link as HTMLAnchorElement).focus();
    return link.getAttribute("aria-label")!;
  });
  const logo = loop.getByRole("link", { name: focusedName, exact: true });
  await expect(logo).toBeFocused();
  await expect.poll(() => track.evaluate(async (element) => {
    const before = element.style.transform;
    await new Promise((resolve) => setTimeout(resolve, 100));
    return element.style.transform === before;
  })).toBe(true);
  const paused = await position();
  await page.getByRole("link", { name: "View project" }).focus();
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
