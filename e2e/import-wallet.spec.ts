import { test, expect } from "@playwright/test";

const TEST_MNEMONIC =
  "test test test test test test test test test test test junk";
const TEST_PASSWORD = "password123";

test.describe("Import Wallet Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/import");
  });

  test("shows seed phrase tab by default", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Import Wallet" })).toBeVisible();
    await expect(page.getByPlaceholder(/Enter your 12 words/i)).toBeVisible();
  });

  test("switches to private key tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Private Key" }).click();
    await expect(page.getByPlaceholder("0x...")).toBeVisible();
  });

  test("Back button returns to welcome page", async ({ page }) => {
    await page.getByText("Back").click();
    await expect(page).toHaveURL("/");
  });

  test("shows error when password is too short", async ({ page }) => {
    await page.getByPlaceholder(/Enter your 12 words/i).fill(TEST_MNEMONIC);
    await page.getByPlaceholder("Min. 8 characters").fill("short");
    await page.getByPlaceholder("Repeat password").fill("short");
    await page.getByRole("button", { name: "Import Wallet" }).click();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("shows error when passwords do not match", async ({ page }) => {
    await page.getByPlaceholder(/Enter your 12 words/i).fill(TEST_MNEMONIC);
    await page.getByPlaceholder("Min. 8 characters").fill(TEST_PASSWORD);
    await page.getByPlaceholder("Repeat password").fill("different123");
    await page.getByRole("button", { name: "Import Wallet" }).click();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("imports wallet from mnemonic and redirects to dashboard", async ({ page }) => {
    await page.getByPlaceholder(/Enter your 12 words/i).fill(TEST_MNEMONIC);
    await page.getByPlaceholder("Min. 8 characters").fill(TEST_PASSWORD);
    await page.getByPlaceholder("Repeat password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Import Wallet" }).click();
    await expect(page).toHaveURL("/dashboard", { timeout: 15000 });
  });

  test("dashboard shows correct address after import", async ({ page }) => {
    await page.getByPlaceholder(/Enter your 12 words/i).fill(TEST_MNEMONIC);
    await page.getByPlaceholder("Min. 8 characters").fill(TEST_PASSWORD);
    await page.getByPlaceholder("Repeat password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Import Wallet" }).click();
    await expect(page).toHaveURL("/dashboard", { timeout: 15000 });
    // Hardhat default mnemonic address
    await expect(page.getByText(/0xf39F/i)).toBeVisible();
  });
});
