import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("complete workspace journey, authorization, transactional sales and accessibility", async ({
  page,
  playwright,
}) => {
  const suffix = Date.now();
  const email = `owner-${suffix}@example.com`;
  const password = "Test-only-strong-password-31";
  await page.goto("/login?mode=register");
  await page.getByLabel("Full name").fill("Alex Morgan");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/workspace/);
  await page
    .getByRole("button", { name: "Create portfolio", exact: true })
    .click();
  await page.getByLabel("Portfolio name").fill("Core equity strategy");
  await page.getByLabel("Use sample positions").check();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create portfolio", exact: true })
    .click();
  await expect(page.getByText("$1,299,300", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/desktop-overview.png",
    fullPage: true,
  });
  const violations = (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze()
  ).violations;
  expect(violations).toEqual([]);
  const list = await (await page.request.get("/api/workspace")).json();
  const id = list.data.items[0].id;
  const read = async () =>
    (await (await page.request.get(`/api/workspace/${id}`)).json()).data;
  const before = await read();
  const holding = before.holdings[0];
  const order = {
    holdingId: holding.id,
    quantity: 100,
    idempotencyKey: crypto.randomUUID(),
  };
  const headers = { Origin: "http://localhost:3000" };
  const orders = await Promise.all([
    page.request.post(`/api/workspace/${id}/orders`, { data: order, headers }),
    page.request.post(`/api/workspace/${id}/orders`, { data: order, headers }),
  ]);
  expect(orders.map((r) => r.status())).toEqual([201, 201]);
  expect((await orders[0].json()).data.id).toBe(
    (await orders[1].json()).data.id,
  );
  const after = await read();
  expect(after.risk.nav).toBe(before.risk.nav);
  expect(Number(after.holdings[0].quantity)).toBe(
    Number(holding.quantity) - 100,
  );
  expect(after.risk.var99).toBeLessThan(before.risk.var99);
  expect(
    (
      await page.request.post(`/api/workspace/${id}/orders`, {
        data: { ...order, quantity: 200 },
        headers,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.post(`/api/workspace/${id}/orders`, {
        data: {
          ...order,
          quantity: 999999,
          idempotencyKey: crypto.randomUUID(),
        },
        headers,
      })
    ).status(),
  ).toBe(409);
  expect((await read()).portfolio.cash).toBe(after.portfolio.cash);
  expect(
    (
      await page.request.post(`/api/workspace/${id}/holdings`, {
        data: { symbol: "BAD", quantity: -1, price: 10, volatility: 0.02 },
        headers,
      })
    ).status(),
  ).toBe(422);
  expect(
    (
      await page.request.patch(`/api/workspace/${id}/settings`, {
        data: { riskLimit: 0.1 },
        headers: { Origin: "https://evil.example" },
      })
    ).status(),
  ).toBe(403);
  const outsider = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
  });
  expect((await outsider.get(`/api/workspace/${id}`)).status()).toBe(401);
  const otherEmail = `viewer-${suffix}@example.com`;
  expect(
    (
      await outsider.post("/api/auth/sign-up/email", {
        data: { name: "Read Only", email: otherEmail, password },
        headers,
      })
    ).ok(),
  ).toBeTruthy();
  expect((await outsider.get(`/api/workspace/${id}`)).status()).toBe(404);
  expect(
    (
      await page.request.post(`/api/workspace/${id}/members`, {
        data: { email: otherEmail, role: "viewer" },
        headers,
      })
    ).ok(),
  ).toBeTruthy();
  expect((await outsider.get(`/api/workspace/${id}`)).status()).toBe(200);
  expect(
    (
      await outsider.post(`/api/workspace/${id}/orders`, {
        data: { ...order, idempotencyKey: crypto.randomUUID() },
        headers,
      })
    ).status(),
  ).toBe(403);
  const memberList = (
    await (await page.request.get(`/api/workspace/${id}/members`)).json()
  ).data;
  const viewer = memberList.find(
    (m: { email: string }) => m.email === otherEmail,
  );
  expect(
    (
      await page.request.delete(`/api/workspace/${id}/members`, {
        data: { userId: viewer.user_id },
        headers,
      })
    ).ok(),
  ).toBeTruthy();
  expect((await outsider.get(`/api/workspace/${id}`)).status()).toBe(404);
  await outsider.dispose();
  await page.getByRole("button", { name: "Positions", exact: true }).click();
  await page.getByRole("button", { name: "Add position", exact: true }).click();
  await page.getByLabel("Symbol", { exact: true }).fill("TEST");
  await page.getByLabel("Quantity", { exact: true }).fill("10");
  await page.getByLabel("Entry price").fill("100");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "TEST Equity / ETF" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reduce TEST exposure" }).click();
  await page.getByLabel("Quantity to sell").fill("5");
  await page.getByRole("button", { name: "Confirm paper sale" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Paper sale recorded" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Scenarios", exact: true }).click();
  await page.getByRole("button", { name: "-30% shock", exact: true }).click();
  await expect(page.getByText("-30%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "paper sell executed" }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/mobile-overview.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole("button", { name: "New portfolio", exact: true })
    .click();
  await expect(page.getByLabel("Portfolio name")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your risk, in perspective." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  expect((await page.request.get(`/api/workspace/${id}`)).status()).toBe(401);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", {exact:true}).fill(password);
  await page.getByRole("button", {name:"Sign in", exact:true}).click();
  await expect(page).toHaveURL(/workspace/);
  await expect(page.getByText("$1,299,300", {exact:true})).toBeVisible();
});
