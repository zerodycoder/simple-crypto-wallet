import { test, expect } from "@playwright/test";

test.describe("Create Wallet Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/create");
  });

  test("shows password step by default", async ({ page }) => {
    await expect(page.getByText("Create Password")).toBeVisible();
    await expect(page.getByPlaceholder("Min. 8 characters")).toBeVisible();
  });

  test("shows step indicator with 3 steps", async ({ page }) => {
    await expect(page.getByText("1")).toBeVisible();
    await expect(page.getByText("2")).toBeVisible();
    await expect(page.getByText("3")).toBeVisible();
  });

  test("Back button returns to welcome page", async ({ page }) => {
    await page.getByText("Back").click();
    await expect(page).toHaveURL("/");
  });

  test("shows error toast when password is too short", async ({ page }) => {
    await page.getByPlaceholder("Min. 8 characters").fill("short");
    await page.getByPlaceholder("Repeat password").fill("short");
    await page.getByText("Continue").click();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("shows error toast when passwords do not match", async ({ page }) => {
    await page.getByPlaceholder("Min. 8 characters").fill("password123");
    await page.getByPlaceholder("Repeat password").fill("different123");
    await page.getByText("Continue").click();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("advances to mnemonic step with valid password", async ({ page }) => {
    await page.getByPlaceholder("Min. 8 characters").fill("password123");
    await page.getByPlaceholder("Repeat password").fill("password123");
    await page.getByText("Continue").click();
    await expect(page.getByText("Save Seed Phrase")).toBeVisible({ timeout: 15000 });
  });

  test("mnemonic step shows 12 words", async ({ page }) => {
    await page.getByPlaceholder("Min. 8 characters").fill("password123");
    await page.getByPlaceholder("Repeat password").fill("password123");
    await page.getByText("Continue").click();
    await expect(page.getByText("Save Seed Phrase")).toBeVisible({ timeout: 15000 });

    // Check 12 numbered word slots exist
    for (let i = 1; i <= 12; i++) {
      await expect(page.getByText(`${i}.`, { exact: true })).toBeVisible();
    }
  });

  test("copy button copies mnemonic", async ({ page }) => {
    await page.getByPlaceholder("Min. 8 characters").fill("password123");
    await page.getByPlaceholder("Repeat password").fill("password123");
    await page.getByText("Continue").click();
    await expect(page.getByText("Save Seed Phrase")).toBeVisible({ timeout: 15000 });

    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByText("Copy to clipboard").click();
    await expect(page.getByText("Copied!")).toBeVisible({ timeout: 3000 });
  });

  test("advances to verify step", async ({ page }) => {
    await page.getByPlaceholder("Min. 8 characters").fill("password123");
    await page.getByPlaceholder("Repeat password").fill("password123");
    await page.getByText("Continue").click();
    await expect(page.getByText("Save Seed Phrase")).toBeVisible({ timeout: 15000 });

    await page.getByText("I have saved my phrase").click();
    await expect(page.getByText("Verify Phrase")).toBeVisible();
    await expect(page.getByText(/Word #\d+/).first()).toBeVisible();
  });

  test("full create wallet flow completes successfully", async ({ page }) => {
    // Step 1: password
    await page.getByPlaceholder("Min. 8 characters").fill("password123");
    await page.getByPlaceholder("Repeat password").fill("password123");
    await page.getByText("Continue").click();
    await expect(page.getByText("Save Seed Phrase")).toBeVisible({ timeout: 15000 });

    // Collect mnemonic words
    const wordElements = await page.locator(".font-mono").allInnerTexts();
    const words = wordElements.filter((w) => !w.includes("...") && w.trim().length > 0);

    await page.getByText("I have saved my phrase").click();
    await expect(page.getByText("Verify Phrase")).toBeVisible();

    // Fill in verify inputs using the collected words
    const inputs = page.getByPlaceholder(/Enter word #/);
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const label = await page.getByText(`Word #`).nth(i).textContent();
      const idx = parseInt(label?.replace("Word #", "") ?? "1") - 1;
      await inputs.nth(i).fill(words[idx] ?? "");
    }

    await page.getByText("Create Wallet").click();
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
  });
});
