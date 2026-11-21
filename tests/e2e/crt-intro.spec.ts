import { expect, test } from "@playwright/test";

test("allows keyboard entry and remembers it for the session", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "This test uses Chromium's software WebGL renderer.");
  await page.goto("/");
  const enter = page.getByRole("button", { name: "Enter portfolio" });
  await expect(enter).toBeVisible({ timeout: 20000 });
  await expect(enter).toBeFocused();
  const power = page.getByRole("button", { name: "Click to turn ON/OFF" });
  await expect(power).toHaveAttribute("aria-pressed", "true");
  const label = power.getByText("Click to turn ON/OFF");
  const labelBounds = (await label.boundingBox())!;
  const tvBounds = (await power.boundingBox())!;
  expect(labelBounds.y + labelBounds.height).toBeLessThan(tvBounds.y);
  await power.click();
  await expect(power).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");
  await expect(power).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(power).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Tab");
  await expect(enter).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Building for the web." })).toBeVisible();
  await expect(enter).toHaveCount(0);
  await page.reload();
  await expect(enter).toHaveCount(0);
});

test("scrolls into the page, back into the TV, and into the page again", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "This test uses Chromium's software WebGL renderer.");
  await page.goto("/");
  const intro = page.getByRole("dialog", { name: "Enter the portfolio" });
  await expect(intro).toBeVisible({ timeout: 20000 });
  const noise = page.locator(".crt-intro-noise");
  await expect(noise).toHaveCSS("mix-blend-mode", "overlay");
  await expect(noise).toHaveCSS("clip-path", /polygon\(evenodd/);
  await expect(page.locator("html")).toHaveClass(/\blenis\b/);
  const portfolio = page.locator("#portfolio-page");
  const logo = intro.locator(".crt-intro-logo");
  const background = page.locator(".site-crt canvas");
  const viewport = page.viewportSize()!;
  const frame = { x: 0, y: 0, ...viewport };
  await expect(portfolio).toHaveCSS("opacity", "0");
  await expect(logo).toHaveCSS("opacity", "1");
  await expect.poll(async () => (await background.boundingBox())?.width).toBeLessThan(viewport.width);
  const initialWidth = (await background.boundingBox())!.width;
  const heading = await page.locator("#hero-title").elementHandle();
  await page.mouse.move(170, 260);
  const distance = await portfolio.evaluate(node => parseFloat(node.style.marginTop));
  // The mobile heading crosses the center of the glass earlier in the zoom.
  const narrow = viewport.width < 700;
  await page.mouse.wheel(0, Math.round(distance * (narrow ? 0.68 : 0.775)));
  await expect.poll(() => portfolio.evaluate(node => Number(getComputedStyle(node).opacity))).toBeCloseTo(narrow ? 0.2 : 0.5, 1);
  await expect.poll(() => logo.evaluate(node => Number(getComputedStyle(node).opacity))).toBeLessThan(0.1);
  await expect.poll(async () => (await background.boundingBox())?.width).toBeGreaterThan(initialWidth);
  await page.mouse.wheel(0, 2000);
  await expect(intro).toHaveCount(0);
  await expect(noise).toHaveCount(0);
  await expect(portfolio).toHaveCSS("opacity", "1");
  await expect.poll(() => background.boundingBox()).toEqual(frame);
  expect(await heading?.evaluate(node => node === document.querySelector("#hero-title"))).toBe(true);
  await page.mouse.wheel(0, -3000);
  await expect(intro).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(portfolio).toHaveCSS("opacity", "0");
  await expect(logo).toHaveCSS("opacity", "1");
  await page.mouse.wheel(0, 2000);
  await expect(intro).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Browse projects" })).toBeVisible();
});

test("keeps a slow-loading model above the page the visitor is reading", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "This test uses Chromium's software WebGL renderer.");
  await page.route("**/models/crt-tv.glb", async route => {
    await new Promise(resolve => setTimeout(resolve, 2100));
    await route.continue();
  });
  await page.goto("/");
  const portfolio = page.locator("#portfolio-page");
  await expect.poll(() => portfolio.evaluate(element => parseFloat(element.style.marginTop)), { timeout: 20000 }).toBeGreaterThan(0);
  await expect(page.getByRole("heading", { name: "Building for the web." })).toBeInViewport();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.mouse.move(170, 260);
  await page.mouse.wheel(0, -2000);
  await expect(page.getByRole("dialog", { name: "Enter the portfolio" })).toBeVisible();
});
