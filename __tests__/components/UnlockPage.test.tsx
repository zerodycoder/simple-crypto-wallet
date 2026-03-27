import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UnlockPage from "@/app/unlock/page";
import { toast } from "sonner";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSetWallet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock("@/store/useWalletStore", () => ({
  useWalletStore: () => ({
    wallet: null,
    isLocked: true,
    setWallet: mockSetWallet,
  }),
}));

const mockStoredWallet = {
  address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
  encryptedKey: '{"version":3,"address":"f39fd6e51aad88f6f4ce6ab8827279cfffb92266"}',
};

jest.mock("@/lib/crypto", () => ({
  loadWalletFromStorage: jest.fn().mockReturnValue({
    address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
    encryptedKey: '{"version":3,"address":"f39fd6e51aad88f6f4ce6ab8827279cfffb92266"}',
  }),
  removeWalletFromStorage: jest.fn(),
  decryptPrivateKey: jest.fn(),
}));

jest.mock("@/lib/wallet", () => ({
  shortenAddress: (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4),
}));

describe("UnlockPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockSetWallet.mockClear();
    (toast.error as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
  });

  it("renders the welcome back heading", async () => {
    render(<UnlockPage />);
    expect(await screen.findByText("Welcome back")).toBeInTheDocument();
  });

  it("shows the shortened wallet address", async () => {
    render(<UnlockPage />);
    expect(await screen.findByText("0xf39F...2266")).toBeInTheDocument();
  });

  it("renders the password input", async () => {
    render(<UnlockPage />);
    expect(await screen.findByLabelText("Password")).toBeInTheDocument();
  });

  it("unlock button is disabled when password is empty", async () => {
    render(<UnlockPage />);
    const btn = await screen.findByRole("button", { name: /unlock wallet/i });
    expect(btn).toBeDisabled();
  });

  it("unlock button is enabled when password is entered", async () => {
    render(<UnlockPage />);
    const input = await screen.findByLabelText("Password");
    await userEvent.type(input, "secret");
    const btn = screen.getByRole("button", { name: /unlock wallet/i });
    expect(btn).not.toBeDisabled();
  });

  it("calls decryptPrivateKey and setWallet on correct password", async () => {
    const { decryptPrivateKey } = require("@/lib/crypto");
    (decryptPrivateKey as jest.Mock).mockResolvedValueOnce("0xprivatekey");

    render(<UnlockPage />);
    await userEvent.type(await screen.findByLabelText("Password"), "correct");
    await userEvent.click(screen.getByRole("button", { name: /unlock wallet/i }));

    await waitFor(() => {
      expect(decryptPrivateKey).toHaveBeenCalledWith(mockStoredWallet.encryptedKey, "correct");
      expect(mockSetWallet).toHaveBeenCalledWith(mockStoredWallet);
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error toast on wrong password", async () => {
    const { decryptPrivateKey } = require("@/lib/crypto");
    (decryptPrivateKey as jest.Mock).mockRejectedValueOnce(new Error("invalid password"));

    render(<UnlockPage />);
    await userEvent.type(await screen.findByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /unlock wallet/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Incorrect password");
      expect(mockSetWallet).not.toHaveBeenCalled();
    });
  });

  it("toggles password visibility", async () => {
    render(<UnlockPage />);
    const input = await screen.findByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");

    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("removes wallet and redirects to / on remove click", async () => {
    const { removeWalletFromStorage } = require("@/lib/crypto");

    render(<UnlockPage />);
    await userEvent.click(await screen.findByText(/remove wallet from this device/i));

    expect(removeWalletFromStorage).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Wallet removed");
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("redirects to / when no wallet in storage", () => {
    const { loadWalletFromStorage } = require("@/lib/crypto");
    (loadWalletFromStorage as jest.Mock).mockReturnValueOnce(null);

    render(<UnlockPage />);
    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
