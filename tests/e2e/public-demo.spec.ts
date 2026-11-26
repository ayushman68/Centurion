import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("guests explore scenarios without accessing private portfolios", async ({ page, request }) => {
  const workspaceRequests: string[] = [];
  page.on("request", req => { if (req.url().includes("/api/workspace")) workspaceRequests.push(req.url()); });
  await page.goto("/");
  await expect(page.getByRole("complementary", { name: "Sample portfolio overview" })).toContainText("$100,000");
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  }
  await page.getByText("Menu", { exact: true }).click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Security", exact: true }).click();
  await expect(page.locator(".mobile-menu")).not.toHaveAttribute("open", "");
  await page.getByText("Menu", { exact: true }).click();
  await page.getByText("Menu", { exact: true }).press("Escape");
  await expect(page.locator(".mobile-menu")).not.toHaveAttribute("open", "");
  await page.getByRole("link", { name: "Getting Started", exact: true }).click();
  await expect(page).toHaveURL(/#getting-started$/);
  await page.getByRole("link", { name: "Support Resources", exact: true }).last().click();
  await page.getByText("Do I need an account to explore?", { exact: true }).click();
  await expect(page.getByText("No. The homepage and demo include fictional holdings", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Explore the demo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your first look inside Centurion." })).toBeVisible();
  await expect(page.getByTestId("demo-value")).toHaveText("$91,500");
  await page.getByRole("button", { name: "-30%", exact: true }).click();
  await expect(page.getByTestId("demo-value")).toHaveText("$74,500");
  await page.getByRole("button", { name: "Reset scenario" }).click();
  await page.getByLabel("Price change").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("demo-value")).toHaveText("$92,350");
  expect(workspaceRequests).toEqual([]);
  expect((await request.get("/api/workspace/portfolios")).status()).toBe(401);
  await page.goto("/login");
  await page.getByRole("link", { name: "Try without signing in" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByTestId("demo-value")).toHaveText("$91,500");
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);
  }
  await page.getByRole("link", { name: "Create your workspace" }).click();
  await expect(page).toHaveURL(/mode=register/);
});
