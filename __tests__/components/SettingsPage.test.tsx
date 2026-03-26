import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "@/app/settings/page";
import { toast } from "sonner";

const mockPush = jest.fn();
const mockUpdateSettings = jest.fn();
const mockSetNetwork = jest.fn();
const mockClearWallet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

jest.mock("@/lib/crypto", () => ({
  removeWalletFromStorage: jest.fn(),
}));

jest.mock("@/store/useWalletStore", () => ({
  useWalletStore: () => ({
    wallet: {
      address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
      encryptedKey: '{"version":3}',
    },
    settings: { lockTimeout: 5, defaultNetwork: "sepolia" },
    updateSettings: mockUpdateSettings,
    clearWallet: mockClearWallet,
    setNetwork: mockSetNetwork,
  }),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUpdateSettings.mockClear();
    mockSetNetwork.mockClear();
    mockClearWallet.mockClear();
    (toast.success as jest.Mock).mockClear();
  });

  it("renders all lock timeout options", () => {
    render(<SettingsPage />);
    expect(screen.getByText("1 minute")).toBeInTheDocument();
    expect(screen.getByText("5 minutes")).toBeInTheDocument();
    expect(screen.getByText("15 minutes")).toBeInTheDocument();
    expect(screen.getByText("30 minutes")).toBeInTheDocument();
    expect(screen.getByText("1 hour")).toBeInTheDocument();
  });

  it("renders network options", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Sepolia Testnet")).toBeInTheDocument();
    expect(screen.getByText("Ethereum Mainnet")).toBeInTheDocument();
  });

  it("calls updateSettings with selected lock timeout", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByText("15 minutes"));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ lockTimeout: 15 });
    expect(toast.success).toHaveBeenCalledWith("Auto-lock timeout updated");
  });

  it("calls updateSettings and setNetwork on network change", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByText("Ethereum Mainnet"));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ defaultNetwork: "mainnet" });
    expect(mockSetNetwork).toHaveBeenCalledWith("mainnet");
    expect(toast.success).toHaveBeenCalledWith("Default network updated");
  });

  it("removes wallet and redirects to / on danger zone button click", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByText("Remove Wallet from Device"));
    expect(mockClearWallet).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(toast.success).toHaveBeenCalledWith("Wallet removed from this device");
  });

  it("navigates to /dashboard on back button click", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("highlights the active lock timeout", () => {
    render(<SettingsPage />);
    // The active option (lockTimeout=5) should have indicator dot
    const fiveMinBtn = screen.getByText("5 minutes").closest("button");
    expect(fiveMinBtn?.className).toContain("bg-primary");
  });

  it("highlights the active network", () => {
    render(<SettingsPage />);
    const sepoliaBtn = screen.getByText("Sepolia Testnet").closest("button");
    expect(sepoliaBtn?.className).toContain("bg-primary");
  });
});
