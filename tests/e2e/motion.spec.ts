import { test, expect } from "@playwright/test";

test("decorative motion follows the pointer, reflects scrolling, and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".site-motion")).toHaveAttribute("data-enabled", "true");
  await page.mouse.move(300, 250);
  await expect(page.locator(".pointer-aura")).toHaveClass(/is-visible/);
  expect(await page.locator(".site-motion").evaluate(el => getComputedStyle(el).pointerEvents)).toBe("none");
  await page.getByRole("link", { name: "Explore the demo", exact: true }).click();
  await expect.poll(() => page.locator(".scroll-progress").evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "-30%", exact: true }).click();
  await expect(page.getByTestId("demo-value")).toHaveText("$74,500");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".site-motion")).toBeHidden();
  await page.getByRole("button", { name: "Reset scenario", exact: true }).click();
  await expect(page.getByTestId("demo-value")).toHaveText("$91,500");
});

test("touch devices do not display a pointer follower", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/demo");
  await expect(page.locator(".pointer-aura")).toBeHidden();
  await page.getByRole("button", { name: "+10%", exact: true }).tap();
  await expect(page.getByTestId("demo-value")).toHaveText("$108,500");
  await context.close();
});
