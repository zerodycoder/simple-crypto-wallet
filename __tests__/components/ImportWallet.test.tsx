import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImportWalletPage from "@/app/import/page";

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

import { toast } from "sonner";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/wallet", () => ({
  importWalletFromMnemonic: jest.fn().mockResolvedValue({
    address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
    encryptedKey: '{"version":3}',
  }),
  importWalletFromPrivateKey: jest.fn().mockResolvedValue({
    address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
    encryptedKey: '{"version":3}',
  }),
}));

jest.mock("@/lib/crypto", () => ({
  saveWalletToStorage: jest.fn(),
}));

jest.mock("@/store/useWalletStore", () => ({
  useWalletStore: () => ({ setWallet: jest.fn() }),
}));

describe("ImportWalletPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the import page with both tabs", () => {
    render(<ImportWalletPage />);
    expect(screen.getByText("Seed Phrase")).toBeInTheDocument();
    expect(screen.getByText("Private Key")).toBeInTheDocument();
  });

  it("renders seed phrase tab by default", () => {
    render(<ImportWalletPage />);
    expect(screen.getByPlaceholderText(/Enter your 12 words/i)).toBeInTheDocument();
  });

  it("switches to private key tab on click", async () => {
    render(<ImportWalletPage />);
    await userEvent.click(screen.getByText("Private Key"));
    expect(screen.getByPlaceholderText("0x...")).toBeInTheDocument();
  });

  it("shows error when password is too short", async () => {
    render(<ImportWalletPage />);
    await userEvent.type(screen.getByPlaceholderText(/Enter your 12 words/i), "word1 word2 word3");
    await userEvent.type(screen.getByPlaceholderText("Min. 8 characters"), "short");
    await userEvent.type(screen.getByPlaceholderText("Repeat password"), "short");
    await userEvent.click(screen.getByRole("button", { name: "Import Wallet" }));
    expect(toast.error).toHaveBeenCalledWith("Password must be at least 8 characters");
  });

  it("shows error when passwords do not match", async () => {
    render(<ImportWalletPage />);
    await userEvent.type(screen.getByPlaceholderText(/Enter your 12 words/i), "word1 word2 word3");
    await userEvent.type(screen.getByPlaceholderText("Min. 8 characters"), "password123");
    await userEvent.type(screen.getByPlaceholderText("Repeat password"), "different123");
    await userEvent.click(screen.getByRole("button", { name: "Import Wallet" }));
    expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
  });

  it("navigates to dashboard on successful mnemonic import", async () => {
    render(<ImportWalletPage />);
    await userEvent.type(
      screen.getByPlaceholderText(/Enter your 12 words/i),
      "test test test test test test test test test test test junk"
    );
    await userEvent.type(screen.getByPlaceholderText("Min. 8 characters"), "password123");
    await userEvent.type(screen.getByPlaceholderText("Repeat password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Import Wallet" }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });

  it("goes back to welcome on Back click", async () => {
    render(<ImportWalletPage />);
    await userEvent.click(screen.getByText("Back"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
