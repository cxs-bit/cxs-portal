import { expect, test } from "@playwright/test";

test("serves direct channel destinations and protects draft assets", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { name: "Building for the web Showing the work" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/portfolio$/);
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await navigation.getByRole("button", { name: "Menu" }).click();
  const links = navigation.getByRole("group", { name: "TV channels" });
  await expect(links.getByRole("link", { name: "Portfolio", exact: true })).toHaveAttribute("aria-current", "page");
  const published = await links.getByRole("link").allTextContents();
  for (const name of ["Work", "Personal"]) {
    const response = await page.goto("/" + name.toLowerCase());
    if (published.includes(name)) {
      expect(response?.status()).toBe(200);
      expect(await response!.text()).not.toContain("hero-title");
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", name);
    } else {
      expect(response?.status()).toBe(404);
    }
    const search = await request.get("/api/search?q=" + name);
    const { results } = await search.json() as { results: { href: string }[] };
    expect(results.some(result => result.href === "/" + name.toLowerCase())).toBe(published.includes(name));
  }
  expect((await request.get("/preview/channel-assets/work/carlos-sosa-cv.pdf")).status()).toBe(404);
});

test("loads the playlist only after keyboard activation and preserves its dimensions", async ({ page }) => {
  let playerRequests = 0;
  await page.route("https://www.youtube-nocookie.com/**", route => {
    playerRequests += 1;
    return route.fulfill({ contentType: "text/html", body: "" });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/personal");
  const externalLink = page.getByRole("link", { name: "Open in YouTube Music" });
  test.skip(!(await externalLink.count()), "No public playlist is configured.");
  const play = page.getByRole("link", { name: "Play playlist" });
  const player = page.locator(".channel-player");
  const frame = player.locator("iframe");
  const url = new URL((await externalLink.getAttribute("href"))!);
  await expect(play).toHaveAttribute("href", url.href);
  await expect(frame).toHaveCount(0);
  expect(playerRequests).toBe(0);
  const before = await player.boundingBox();
  await play.focus();
  await play.press("Enter");
  await expect(frame).toBeFocused();
  await expect.poll(() => playerRequests).toBe(1);
  const src = new URL((await frame.getAttribute("src"))!);
  expect(src.origin).toBe("https://www.youtube-nocookie.com");
  expect(src.searchParams.get("list")).toBe(url.searchParams.get("list"));
  expect(await player.boundingBox()).toEqual(before);
  await expect(externalLink).toBeVisible();
});

test("opens direct channel choices when reduced motion disables the selector", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/portfolio");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  if (page.viewportSize()!.width < 560) {
    await navigation.getByRole("button", { name: "Menu" }).click();
  }
  await navigation.getByRole("link", { name: "Change channel" }).click();
  await expect(page).toHaveURL("/?tune=portfolio#channels");
  await expect(page.getByRole("dialog", { name: "TV channel selector" })).toHaveCount(0);
  const portfolio = navigation.getByRole("group", { name: "TV channels" }).getByRole("link", { name: "Portfolio" });
  await expect(portfolio).toBeVisible();
  await expect(portfolio).toHaveAttribute("href", "/portfolio");
});

test("provides a direct playlist link without JavaScript", async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false, reducedMotion: "reduce" });
  try {
    await page.goto("/personal");
    const externalLink = page.getByRole("link", { name: "Open in YouTube Music" });
    test.skip(!(await externalLink.count()), "No public playlist is configured.");
    const href = (await externalLink.getAttribute("href"))!;
    await page.route(href, route => route.fulfill({ contentType: "text/html", body: "Playlist destination" }));
    await page.getByRole("link", { name: "Play playlist" }).click();
    await expect(page).toHaveURL(href);
  } finally {
    await page.close();
  }
});

test("tunes without navigating and restores the selector through browser history", async ({ page, browserName }) => {
  test.slow(); // Exercises two model loads and both directions of browser history.
  test.skip(browserName !== "chromium", "The animated scene runs on the software Chromium renderer.");
  await page.goto("/?tune=portfolio");
  const selector = page.getByRole("dialog", { name: "TV channel selector" });
  await expect(selector).toBeVisible({ timeout: 20000 });
  const next = selector.getByRole("button", { name: "Next channel" });
  await expect(selector.locator(".tv-channel-count")).toContainText(/CH 01 \/ 0[1-3]/);
  const historyLength = () => page.evaluate(() => history.length);
  const before = await historyLength();
  let name = "Portfolio";
  if (await next.count()) {
    await page.keyboard.press("ArrowLeft");
    await expect(selector.getByRole("status")).toHaveText(/^(Work|Personal)$/);
    await page.keyboard.press("ArrowRight");
    await expect(selector.getByRole("status")).toHaveText("Portfolio");
    await next.click();
    await expect(selector.locator(".tv-channel-count")).toContainText(/CH 02 \/ 0[23]/);
    name = (await selector.getByRole("status").textContent())!;
    expect(await historyLength()).toEqual(before);
    await expect(page).toHaveURL(/\/\?tune=portfolio$/);
    const power = selector.getByRole("button", { name: /turn ON\/OFF/ });
    await power.click();
    await expect(next).toBeDisabled();
    await expect(selector.getByText("TV OFF", { exact: true })).toBeVisible();
    await power.click();
  }
  const enter = selector.getByRole("button", { name: "Enter " + name });
  await enter.click();
  await expect(page).toHaveURL("/" + name.toLowerCase());
  await expect(page.locator("#main")).toBeFocused();
  expect(await historyLength()).toBe(before + 1);
  await page.goBack({ waitUntil: "commit" });
  await expect(selector).toBeVisible();
  await expect(enter).toBeVisible();
  await page.goForward({ waitUntil: "commit" });
  await expect(page).toHaveURL("/" + name.toLowerCase());
  await expect(selector).toHaveCount(0);
  await page.reload();
  await expect(selector).toHaveCount(0);
  if (page.viewportSize()!.width < 560) {
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Menu" }).click();
  }
  await page.getByRole("link", { name: "Change channel" }).click();
  await expect(enter).toBeVisible({ timeout: 20000 });
});
