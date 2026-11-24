import { expect, test } from "@playwright/test";

test("opens deep links and repeat visits without fetching the TV model", async ({ page }) => {
  let models = 0;
  page.on("request", request => {
    if (new URL(request.url()).pathname === "/models/crt-tv.glb") models++;
  });
  await page.goto("/#contact");
  await expect(page.locator("#portfolio-page")).toHaveAttribute("data-crt-intro", "ready");
  await expect(page.locator("#contact")).toBeInViewport();
  await page.goto("/portfolio#contact");
  await expect(page.locator("#contact")).toBeInViewport();
  await page.evaluate(() => sessionStorage.setItem("cxs-crt-intro-seen", "1"));
  await page.goto("/");
  await expect(page.locator("#portfolio-page")).toHaveAttribute("data-crt-intro", "ready");
  await expect(page.getByRole("link", { name: "Change channel" })).toBeInViewport();
  expect(models).toBe(0);
});

test("returns keyboard access to the page if the TV loses its graphics context", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Uses Chromium's software WebGL renderer.");
  await page.goto("/?tune=portfolio");
  await expect(page.getByRole("dialog", { name: "TV channel selector" })).toBeVisible({ timeout: 20000 });
  await page.locator(".crt-intro-stage canvas").evaluate(canvas => canvas.dispatchEvent(new Event("webglcontextlost")));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#portfolio-page")).toHaveJSProperty("inert", false);
  await expect(page.locator("#main")).toBeFocused();
  await expect(page.getByRole("navigation", { name: "TV channels" })).toBeInViewport();
});

test("allows keyboard entry and remembers it for the session", async ({ page, browserName }) => {
  test.slow(); // Includes two complete typing cycles after the animated handoff.
  test.skip(browserName !== "chromium", "This test uses Chromium's software WebGL renderer.");
  await page.goto("/");
  const enter = page.getByRole("button", { name: "Enter Portfolio" });
  await expect(enter).toBeVisible({ timeout: 20000 });
  await expect(enter).toBeFocused();
  await expect(page.locator(".site-dock")).toBeHidden();
  await page.keyboard.press("Control+k");
  await expect(page.locator(".dock-search")).toHaveAttribute("aria-expanded", "false");
  await expect(enter).toBeFocused();
  const power = page.getByRole("button", { name: /(?:Click|Tap) to turn ON\/OFF/ });
  await expect(power).toHaveAttribute("aria-pressed", "true");
  const label = power.locator(".crt-power-label");
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
  const heading = page.getByRole("heading", { name: "Building for the web Showing the work" });
  const cursor = heading.locator(".text-type__cursor");
  await expect(heading).toBeVisible();
  await expect(cursor).toBeVisible();
  const text = heading.locator(".text-type");
  const layout = await text.evaluateHandle(element => {
    const heights = new Set([element.clientHeight]);
    const observer = new ResizeObserver(() => heights.add(element.clientHeight));
    observer.observe(element);
    return { heights, observer };
  });
  const pending = heading.locator("[data-pending]");
  const completed = cursor.and(heading.locator("[data-idle]"));
  await expect(pending.first()).toBeAttached();
  await expect(completed).toBeAttached({ timeout: 15000 });
  await expect(pending.first()).toBeAttached();
  await expect(completed).toBeAttached({ timeout: 15000 });
  const heights = await layout.evaluate(({ heights, observer }) => {
    observer.disconnect();
    return Array.from(heights);
  });
  expect(heights, "Heading height throughout typing and backspacing").toHaveLength(1);
  await layout.dispose();
  await expect(enter).toHaveCount(0);
  await expect(page.locator("#main")).toBeFocused();
  await expect(page.locator(".site-dock")).toBeVisible();
  await page.getByRole("link", { name: "Explore the work" }).click();
  const featureTop = () => page.locator("#featured-work").evaluate(section => section.getBoundingClientRect().top);
  await expect.poll(featureTop).toBeLessThan(100);
  const previousTop = await featureTop();
  await page.evaluate(() => { location.hash = "contact"; });
  await expect(page.locator("#contact")).toBeInViewport();
  await page.goBack({ waitUntil: "commit" });
  await expect(page).toHaveURL(/\/portfolio#featured-work$/);
  await expect.poll(async () => Math.abs(await featureTop() - previousTop)).toBeLessThan(2);
  await page.reload();
  await expect(enter).toHaveCount(0);
});

test("scrolls into the page, back into the TV, and into the page again", async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== "chromium", "This test uses Chromium's software WebGL renderer.");
  await page.goto("/");
  const intro = page.getByRole("dialog", { name: "TV channel selector" });
  await expect(intro).toBeVisible({ timeout: 20000 });
  const noise = page.locator(".crt-intro-noise");
  await expect(noise).toHaveCSS("mix-blend-mode", "overlay");
  await expect(noise).toHaveCSS("clip-path", /polygon\(evenodd/);
  await expect(page.locator("html")).toHaveClass(/\blenis\b/);
  const portfolio = page.locator("#portfolio-page");
  const dock = page.locator(".site-dock");
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
  const midpoint = narrow ? 0.68 : 0.775;
  await page.mouse.wheel(0, Math.round(distance * midpoint));
  await expect.poll(() => portfolio.evaluate(node => Number(getComputedStyle(node).opacity))).toBeCloseTo(narrow ? 0.2 : 0.5, 1);
  await expect.poll(() => logo.evaluate(node => Number(getComputedStyle(node).opacity))).toBeLessThan(0.1);
  await expect.poll(async () => (await background.boundingBox())?.width).toBeGreaterThan(initialWidth);
  await page.mouse.wheel(0, Math.round(distance * (0.85 - midpoint)));
  await expect.poll(() => dock.evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(0.1);
  await expect.poll(() => dock.evaluate(node => Number(getComputedStyle(node).opacity))).toBeLessThan(1);
  await expect(portfolio).toHaveJSProperty("inert", true);

  await page.mouse.wheel(0, 4000);
  await expect(intro).toHaveCount(0);
  await expect(noise).toHaveCount(0);
  await expect(portfolio).toHaveCSS("opacity", "1");
  await expect.poll(() => background.boundingBox()).toEqual(frame);
  expect(await heading?.evaluate(node => node === document.querySelector("#hero-title"))).toBe(true);
  const distanceFromHero = () => page.evaluate(entry => Math.abs(window.scrollY - entry), distance);
  await expect.poll(distanceFromHero).toBeLessThanOrEqual(1);
  await expect(page.locator("html")).not.toHaveClass(/\blenis-scrolling\b/);

  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(distance + 75);
  await expect(page.locator("html")).not.toHaveClass(/\blenis-scrolling\b/);

  const heldAtHero = await page.evaluate(entry => new Promise<boolean>(resolve => {
    window.addEventListener("scroll", () => {
      resolve(document.getElementById("portfolio-page")!.classList.contains("crt-page-edge"));
    }, { once: true });
    window.scrollTo({ top: entry - 30, behavior: "instant" });
  }), distance);
  expect(heldAtHero).toBe(true);
  await expect(intro).toHaveCount(0);
  await expect.poll(distanceFromHero).toBeLessThanOrEqual(1);

  await page.evaluate(() => new Promise<void>((resolve) => {
    window.addEventListener("scroll", () => resolve(), { once: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }));
  await expect(intro).toBeVisible({ timeout: 15000 });
  await expect(portfolio).toHaveCSS("opacity", "0");
  await expect(logo).toHaveCSS("opacity", "1");
  await expect(intro.getByRole("button", { name: "Skip intro" })).toHaveCount(0);
  if (isMobile) await intro.getByRole("button", { name: "Enter Portfolio" }).tap();
  else await page.keyboard.press("Escape");
  await expect(intro).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Explore the work" })).toBeVisible();
  await expect(page.locator("#main")).toBeFocused();
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
  await expect(page.getByRole("heading", { name: "Building for the web Showing the work" })).toBeInViewport();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.getByRole("dialog", { name: "TV channel selector" })).toBeVisible({ timeout: 15000 });
});
