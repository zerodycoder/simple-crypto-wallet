import { test, expect } from "@playwright/test";

test.describe("Welcome Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays app name and tagline", async ({ page }) => {
    await expect(page.getByText("SimpleCrypto")).toBeVisible();
    await expect(page.getByText("Your secure, extensible crypto wallet")).toBeVisible();
  });

  test("displays all feature highlights", async ({ page }) => {
    await expect(page.getByText("Non-custodial")).toBeVisible();
    await expect(page.getByText("Fast & lightweight")).toBeVisible();
    await expect(page.getByText("Extensible", { exact: true })).toBeVisible();
  });

  test("Create New Wallet button navigates to /create", async ({ page }) => {
    await page.getByText("Create New Wallet").click();
    await expect(page).toHaveURL("/create");
  });

  test("Import Existing Wallet button navigates to /import", async ({ page }) => {
    await page.getByText("Import Existing Wallet").click();
    await expect(page).toHaveURL("/import");
  });
});
