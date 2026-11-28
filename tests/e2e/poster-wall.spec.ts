import { expect, test } from "@playwright/test";

const tracks = [
  {
    id: "test-track-one",
    title: "Night Signal",
    description: "Test Artist One",
    image: "/images/projects/rally-scoring/dashboard.webp",
    kind: "track",
  },
  {
    id: "test-track-two",
    title: "Morning Signal",
    description: "Test Artist Two",
    image: "/images/projects/rally-scoring/teams.webp",
    kind: "track",
  },
];

test("previews and opens TV wall posters, browses neighbors, and restores focus", async ({ page, browserName, isMobile }) => {
  test.setTimeout(60_000);
  test.skip(browserName !== "chromium", "Uses Chromium's software WebGL renderer.");
  await page.route("**/api/tv/artwork", route => route.fulfill({
    json: { covers: tracks.map(track => track.image), posters: tracks },
  }));

  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto("/?tune=portfolio");
  const selector = page.getByRole("dialog", { name: "TV channel selector" });
  await expect(selector).toBeVisible({ timeout: 20000 });
  const explore = selector.getByRole("button", { name: "Explore wall" });
  const preview = selector.locator(".tv-poster-info");
  const viewer = page.getByRole("dialog", { name: "Poster viewer" });
  const closeViewer = viewer.getByRole("button", { name: "Close poster viewer" });
  const nextPoster = viewer.getByRole("button", { name: "Next poster" });
  const previousPoster = viewer.getByRole("button", { name: "Previous poster" });
  const status = selector.getByRole("status");
  const next = selector.getByRole("button", { name: "Next channel" });

  const glass = selector.locator(".crt-power-area");
  const initialWidth = (await glass.boundingBox())!.width;
  // Aim at the exposed dashboard print above the cabinet in each framing.
  if (isMobile) {
    await page.touchscreen.tap(120, 235);
  } else {
    await page.mouse.move(516, 172);
    await expect(preview.getByText("Scoring dashboard", { exact: true })).toBeVisible();
    await expect(viewer).toBeHidden();
    await expect.poll(async () => (await glass.boundingBox())!.width).toBeGreaterThan(initialWidth * 1.05);
    await page.mouse.click(516, 172);
  }
  await expect(viewer.getByRole("heading", { name: "Scoring dashboard", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(explore).toBeFocused();

  await explore.click();
  const portfolio = selector.getByRole("region", { name: "Portfolio poster wall" });
  const back = portfolio.getByRole("button", { name: "Back to TV" });
  const dashboard = portfolio.getByRole("button", { name: "Scoring dashboard" });
  await expect(back).toBeFocused();
  await expect(portfolio.getByRole("button", { name: "Team roster" })).toBeVisible();
  await expect(preview).toHaveCount(0);
  await expect(selector.locator(".crt-picture")).toHaveCSS("opacity", "0");

  if (!isMobile) {
    await dashboard.hover();
    await expect(preview.getByText("Scoring dashboard", { exact: true })).toBeVisible();
    await expect(viewer).toBeHidden();
    await back.hover();
    await expect(preview).toHaveCount(0);
    await page.keyboard.press("Tab");
    await expect(dashboard).toBeFocused();
    await expect(preview.getByText("Scoring dashboard", { exact: true })).toBeVisible();
  }
  if (isMobile) await dashboard.tap();
  else await page.keyboard.press("Enter");
  await expect(viewer.getByRole("heading", { name: "Scoring dashboard", exact: true })).toBeVisible();
  await expect(viewer.getByText(/Rally dashboard showing team and station totals/)).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(viewer.getByRole("heading", { name: "Team roster", exact: true })).toBeVisible();
  const expandedImage = viewer.getByRole("img", { name: "Team roster" });
  await expect(expandedImage).toHaveAttribute("src", "/images/projects/rally-scoring/teams.webp");
  await expect(expandedImage).toHaveCSS("object-fit", "contain");
  await page.keyboard.press("ArrowLeft");
  await expect(viewer.getByRole("heading", { name: "Scoring dashboard", exact: true })).toBeVisible();
  await closeViewer.click();
  await expect(viewer).toBeHidden();
  await expect(dashboard).toBeFocused();
  if (isMobile) await back.tap();
  else await page.keyboard.press("Escape");
  await expect(portfolio).toHaveCount(0);
  await expect(preview).toHaveCount(0);
  await expect(explore).toBeFocused();
  await expect(status).toHaveText("Portfolio");

  await next.click();
  await expect(status).toHaveText("Work");
  await explore.click();
  const work = selector.getByRole("region", { name: "Work poster wall" });
  const portrait = work.getByRole("button", { name: "Carlos Sosa" });
  await expect(portrait.locator(".wall-print-initials")).toHaveText("CS");
  await portrait.click();
  await expect(viewer.getByRole("heading", { name: "Carlos Sosa", exact: true })).toBeVisible();
  await expect(viewer.getByText("Portrait coming soon.", { exact: true })).toBeVisible();
  await expect(nextPoster).toBeHidden();
  await expect(previousPoster).toBeHidden();
  await closeViewer.click();
  await expect(portrait).toBeFocused();
  await work.getByRole("button", { name: "Back to TV" }).click();

  await next.click();
  await expect(status).toHaveText("Personal");
  await explore.click();
  const personal = selector.getByRole("region", { name: "Personal poster wall" });
  await expect(preview).toHaveCount(0);
  await expect(personal.getByRole("button", { name: tracks[1].title })).toBeVisible();
  const track = personal.getByRole("button", { name: tracks[0].title });
  await track.click();
  await expect(viewer.getByRole("heading", { name: tracks[0].title, exact: true })).toBeVisible();
  await expect(viewer.getByText(tracks[0].description, { exact: true })).toBeVisible();
  await nextPoster.click();
  await expect(viewer.getByRole("heading", { name: tracks[1].title, exact: true })).toBeVisible();
  await previousPoster.click();
  await expect(viewer.getByRole("heading", { name: tracks[0].title, exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(track).toBeFocused();
  await personal.getByRole("button", { name: "Back to TV" }).click();
  await next.click();
  await expect(status).toHaveText("Portfolio");
  await expect(preview).toHaveCount(0);
  await explore.click();
  await expect(dashboard).toBeVisible();
  await expect(portfolio.getByRole("button", { name: tracks[0].title })).toHaveCount(0);
});
