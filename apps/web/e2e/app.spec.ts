import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Explore seed, copy, and URL reproduction", async ({ page }) => {
  await page.goto("/?seed=8f3a21c4");
  await expect(page.getByText("Current normalized seed: 8f3a21c4")).toBeVisible();

  const firstHex = page.locator(".swatch-row code").first();
  const expectedHex = await firstHex.textContent();
  await page.locator(".swatch-row").first().getByRole("button", { name: "Copy" }).click();
  await expect(page.getByText(`Copied ${expectedHex}.`)).toBeVisible();

  await page.reload();
  await expect(page.locator(".swatch-row code").first()).toHaveText(expectedHex ?? "");
});

test("Configure validation and CSS export", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Configure" }).click();
  const baseColor = page.getByLabel("HEX color");
  const committed = await baseColor.inputValue();
  await baseColor.fill("invalid");
  await baseColor.blur();
  await expect(baseColor).toHaveValue(committed);
  await expect(page.getByText("Enter #RGB or #RRGGBB.")).toBeVisible();

  await baseColor.fill("#abc");
  await baseColor.press("Enter");
  await expect(baseColor).toHaveValue("#AABBCC");
  await page.getByLabel("Color relationship").selectOption("tetradic");
  await page.getByLabel("Color steps").selectOption("9");
  await page.getByRole("button", { name: "Copy CSS" }).click();
  await expect(page.getByText("Copied CSS output.")).toBeVisible();
  await expect(page.getByLabel("CSS output")).toHaveValue(/--palette-color-4-900/);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download file" }).click();
  expect((await download).suggestedFilename()).toBe("quick-palette.css");
  await expect(page.getByText("Downloaded quick-palette.css.")).toBeVisible();
});

test("theme persistence and primary actions work from the keyboard", async ({ page }) => {
  await page.goto("/?seed=8f3a21c4");
  await page.getByLabel("Theme").selectOption("dark");
  await page.reload();
  await expect(page.getByLabel("Theme")).toHaveValue("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  for (let index = 0; index < 5; index += 1) await page.keyboard.press("Tab");
  const next = page.getByRole("button", { name: "Next palette" });
  await expect(next).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).not.toHaveURL(/seed=8f3a21c4/);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Edit this palette" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Build your palette" })).toBeVisible();
});

for (const { name, viewport } of [
  { name: "narrow", viewport: { width: 320, height: 800 } },
  { name: "wide", viewport: { width: 1280, height: 900 } },
]) {
  test(`${name} layout has no overflow and passes axe in both themes`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    for (const theme of ["Light", "Dark"] as const) {
      await page.getByLabel("Theme").selectOption(theme.toLowerCase());
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
      await page.screenshot({ path: `test-results/${name}-${theme.toLowerCase()}.png`, fullPage: true });
    }
  });
}
