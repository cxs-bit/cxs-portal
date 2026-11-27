import { expect, test, type Page } from "@playwright/test";

const tvModelPath = "/models/crt-tv.glb";

test("opens deep links and repeat visits without fetching the TV model", async ({ page }) => {
  let models = 0;
  page.on("request", request => {
    if (new URL(request.url()).pathname === tvModelPath) models++;
  });
  await page.goto("/#contact");
  await expect(page.locator("#portfolio-page")).toHaveAttribute("data-crt-intro", "ready");
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(page.getByText("Tuning in…", { exact: true })).toBeHidden();
  await page.goto("/portfolio#contact");
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(page.getByText("Tuning in…", { exact: true })).toBeHidden();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("cxs-crt-intro-seen"))).toBe("1");
  await page.goto("/");
  await expect(page.locator("#portfolio-page")).toHaveAttribute("data-crt-intro", "ready");
  if (page.viewportSize()!.width < 560) {
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Menu" }).click();
  }
  await expect(page.getByRole("link", { name: "Change channel" })).toBeInViewport();
  expect(models).toBe(0);
});

test("bypasses the TV preloader on a fresh visit with reduced motion", async ({ page }) => {
  let models = 0;
  page.on("request", request => {
    if (new URL(request.url()).pathname === tvModelPath) models++;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#portfolio-page")).toHaveAttribute("data-crt-intro", "static");
  await expect(page.getByText("Tuning in…", { exact: true })).toBeHidden();
  await expect(page.getByRole("link", { name: "Skip to portfolio" })).toHaveCount(0);
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
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeInViewport();
});

test("allows keyboard entry and remembers it for the session", async ({ page, browserName }) => {
  test.slow(); // Includes two complete typing cycles after the animated handoff.
  test.skip(browserName !== "chromium", "This test uses Chromium's software WebGL renderer.");
  await page.goto("/");
  const enter = page.getByRole("button", { name: "Enter Portfolio" });
  await expect(enter).toBeVisible({ timeout: 20000 });
  await expect(enter).toBeFocused();
  await expect(page.locator(".site-card-nav")).toBeHidden();
  await page.keyboard.press("Control+k");
  await expect(page.locator(".nav-search")).toHaveAttribute("aria-expanded", "false");
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
  await expect(page.locator(".site-card-nav")).toBeVisible();
  await page.getByRole("link", { name: "Explore the work" }).click();
  const featureTop = () => page.locator("#featured-work").evaluate(section => section.getBoundingClientRect().top);
  const header = page.locator(".site-card-nav");
  await expect.poll(async () => {
    const bounds = (await header.boundingBox())!;
    return await featureTop() - (bounds.y + bounds.height);
  }).toBeGreaterThanOrEqual(0);
  await expect.poll(featureTop).toBeLessThan(160);
  const previousTop = await featureTop();
  await page.evaluate(() => { location.hash = "contact"; });
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(page.getByText("Tuning in…", { exact: true })).toBeHidden();
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
  await expect(intro.locator(".crt-intro-noise")).toHaveCount(0);
  await expect(page.locator("html")).toHaveClass(/\blenis\b/);
  const portfolio = page.locator("#portfolio-page");
  const header = page.locator(".site-card-nav");
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
  await expect.poll(() => header.evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(0.1);
  await expect.poll(() => header.evaluate(node => Number(getComputedStyle(node).opacity))).toBeLessThan(1);
  await expect(portfolio).toHaveJSProperty("inert", true);

  await page.mouse.wheel(0, 4000);
  await expect(intro).toHaveCount(0);
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

async function holdTvModel(page: Page) {
  const response = Promise.withResolvers<"continue" | "abort">();
  await page.route(`**${tvModelPath}`, async route => {
    const action = await response.promise;
    if (action === "continue") await route.continue();
    else await route.abort();
  });
  return response.resolve;
}

test("can skip before the application scripts arrive", async ({ page }) => {
  await page.route("**/_next/static/**/*.js", route => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const skip = page.getByRole("link", { name: "Skip to portfolio" });
  await expect(skip).toBeVisible();
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

for (const focusSkip of [false, true]) {
  test(`reveals the selector after loading with ${focusSkip ? "Skip" : "Enter"} focused`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Uses Chromium's software WebGL renderer.");
    const release = await holdTvModel(page);
    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const status = page.getByRole("status").filter({ hasText: /^Tuning in…$/ });
      const skip = page.getByRole("link", { name: "Skip to portfolio" });
      const enter = page.getByRole("button", { name: "Enter Portfolio" });
      await expect(status).toBeVisible();
      await expect(skip).toBeVisible();
      if (focusSkip) {
        await skip.focus();
        await expect(skip).toBeFocused();
      }
      release("continue");
      await expect(enter).toBeEnabled({ timeout: 10000 });
      await expect(status).toBeHidden();
      await expect(focusSkip ? skip : enter).toBeFocused();
      if (focusSkip) {
        await page.keyboard.press("Enter");
        await expect(page.locator("#main")).toBeFocused();
        await expect(page.getByRole("dialog", { name: "TV channel selector" })).toHaveCount(0);
      }
    } finally {
      release("abort");
    }
  });
}

test("skips a pending TV intro and still allows changing channels", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Uses Chromium's software WebGL renderer.");
  const release = await holdTvModel(page);
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const skip = page.getByRole("link", { name: "Skip to portfolio" });
    await expect(skip).toBeVisible();
    await skip.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
    await expect(page).toHaveURL(url => url.pathname === "/" && !url.search && ["", "#main"].includes(url.hash));
    await expect(skip).toHaveCount(0);

    release("continue");
    await page.unrouteAll({ behavior: "wait" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#portfolio-page")).toHaveAttribute("data-crt-intro", "ready");
    await expect(page.getByRole("dialog", { name: "TV channel selector" })).toHaveCount(0);
    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    if (page.viewportSize()!.width < 560) {
      await navigation.getByRole("button", { name: "Menu" }).click();
    }
    await navigation.getByRole("link", { name: "Change channel" }).click();
    await expect(page.getByRole("button", { name: "Enter Portfolio" })).toBeEnabled({ timeout: 10000 });
  } finally {
    release("abort");
  }
});

for (const failure of ["failed", "stalled"] as const) {
  test(`opens the homepage when the TV model has ${failure}`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Uses Chromium's software WebGL renderer.");
    const release = await holdTvModel(page);
    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const status = page.getByRole("status").filter({ hasText: /^Tuning in…$/ });
      await expect(status).toBeVisible();
      if (failure === "failed") release("abort");
      await expect(page.locator("#main")).toBeFocused({ timeout: 15000 });
      await expect(status).toHaveCount(0);
      await expect(page).toHaveURL("/");
      await expect.poll(() => page.evaluate(() => sessionStorage.getItem("cxs-crt-intro-seen"))).toBe("1");
      await expect(page.getByRole("dialog", { name: "TV channel selector" })).toHaveCount(0);
    } finally {
      release("abort");
    }
  });
}
