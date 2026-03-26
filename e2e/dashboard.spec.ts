import { test, expect } from "@playwright/test";

const TEST_MNEMONIC =
  "test test test test test test test test test test test junk";
const TEST_PASSWORD = "password123";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Import wallet first to get to dashboard
    await page.goto("/import");
    await page.getByPlaceholder(/Enter your 12 words/i).fill(TEST_MNEMONIC);
    await page.getByPlaceholder("Min. 8 characters").fill(TEST_PASSWORD);
    await page.getByPlaceholder("Repeat password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Import Wallet" }).click();
    await expect(page).toHaveURL("/dashboard", { timeout: 15000 });
  });

  test("shows wallet address", async ({ page }) => {
    await expect(page.getByRole("button", { name: /0xf39F/i })).toBeVisible();
  });

  test("shows ETH balance label", async ({ page }) => {
    await expect(page.getByText("ETH", { exact: true })).toBeVisible();
  });

  test("shows network badge", async ({ page }) => {
    await expect(page.getByText("Sepolia Testnet")).toBeVisible();
  });

  test("shows Send and Receive buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Receive" })).toBeVisible();
  });

  test("Send button navigates to /send", async ({ page }) => {
    await page.getByText("Send").click();
    await expect(page).toHaveURL("/send");
  });

  test("Receive button navigates to /receive", async ({ page }) => {
    await page.getByRole("button", { name: "Receive" }).click();
    await expect(page).toHaveURL("/receive");
  });

  test("can switch to Mainnet", async ({ page }) => {
    await page.getByText("Mainnet").click();
    await expect(page.getByText("Ethereum Mainnet")).toBeVisible();
  });

  test("lock button returns to welcome page", async ({ page }) => {
    await page.getByRole("button", { name: "Lock wallet" }).click();
    await expect(page).toHaveURL("/");
  });

  test("address copy button works", async ({ page }) => {
    await page.getByRole("button", { name: /0xf39F/i }).click();
    await expect(page.getByText("Address copied")).toBeVisible();
  });
});

test.describe("Send Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/import");
    await page.getByPlaceholder(/Enter your 12 words/i).fill(TEST_MNEMONIC);
    await page.getByPlaceholder("Min. 8 characters").fill(TEST_PASSWORD);
    await page.getByPlaceholder("Repeat password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Import Wallet" }).click();
    await expect(page).toHaveURL("/dashboard", { timeout: 15000 });
    await page.getByText("Send").click();
    await expect(page).toHaveURL("/send");
  });

  test("shows send form", async ({ page }) => {
    await expect(page.getByText("Send ETH")).toBeVisible();
    await expect(page.getByPlaceholder("0x...")).toBeVisible();
    await expect(page.getByPlaceholder("0.00")).toBeVisible();
  });

  test("shows validation error for invalid address", async ({ page }) => {
    await page.getByPlaceholder("0x...").fill("invalid");
    await page.getByPlaceholder("0.00").fill("0.01");
    await page.getByText("Review Transaction").click();
    await expect(page.getByText("Invalid Ethereum address")).toBeVisible();
  });

  test("shows validation error for missing amount", async ({ page }) => {
    await page.getByPlaceholder("0x...").fill("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    await page.getByText("Review Transaction").click();
    await expect(page.getByText("Enter a valid amount")).toBeVisible();
  });

  test("opens confirm dialog with valid inputs", async ({ page }) => {
    await page.getByPlaceholder("0x...").fill("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    await page.getByPlaceholder("0.00").fill("0.01");
    await page.getByText("Review Transaction").click();
    await expect(page.getByText("Confirm Transaction")).toBeVisible();
  });

  test("cancel closes confirm dialog", async ({ page }) => {
    await page.getByPlaceholder("0x...").fill("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    await page.getByPlaceholder("0.00").fill("0.01");
    await page.getByText("Review Transaction").click();
    await expect(page.getByText("Confirm Transaction")).toBeVisible();
    await page.getByText("Cancel").click();
    await expect(page.getByText("Confirm Transaction")).not.toBeVisible();
  });
});

test.describe("Receive Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/import");
    await page.getByPlaceholder(/Enter your 12 words/i).fill(TEST_MNEMONIC);
    await page.getByPlaceholder("Min. 8 characters").fill(TEST_PASSWORD);
    await page.getByPlaceholder("Repeat password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Import Wallet" }).click();
    await expect(page).toHaveURL("/dashboard", { timeout: 15000 });
    await page.getByRole("button", { name: "Receive" }).click();
    await expect(page).toHaveURL("/receive");
  });

  test("shows QR code canvas", async ({ page }) => {
    await expect(page.locator("canvas")).toBeVisible({ timeout: 8000 });
  });

  test("shows full wallet address", async ({ page }) => {
    await expect(page.getByText(/0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266/i)).toBeVisible();
  });

  test("copy address button works", async ({ page }) => {
    await page.getByText("Copy Address").click();
    await expect(page.getByText("Address copied to clipboard")).toBeVisible();
  });

  test("back button returns to dashboard", async ({ page }) => {
    await page.getByRole("button").first().click();
    await expect(page).toHaveURL("/dashboard");
  });
});
