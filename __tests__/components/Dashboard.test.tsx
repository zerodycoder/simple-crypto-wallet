import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/dashboard/page";

const mockPush = jest.fn();
const mockLock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/store/useWalletStore", () => ({
  useWalletStore: () => ({
    wallet: {
      address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
      encryptedKey: '{"version":3}',
    },
    network: "sepolia",
    setWallet: jest.fn(),
    lock: mockLock,
  }),
}));

jest.mock("@/hooks/useBalance", () => ({
  useBalance: () => ({
    balance: "1.250000",
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock("@/hooks/useTransactionHistory", () => ({
  useTransactionHistory: () => ({
    transactions: [
      {
        hash: "0xabc123",
        from: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
        to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        value: "0.010000",
        timestamp: 1700000000000,
        status: "confirmed",
      },
      {
        hash: "0xdef456",
        from: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        to: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
        value: "0.050000",
        timestamp: 1700000100000,
        status: "confirmed",
      },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock("@/lib/crypto", () => ({
  loadWalletFromStorage: jest.fn().mockReturnValue({
    address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
    encryptedKey: '{"version":3}',
  }),
}));

jest.mock("@/hooks/useAutoLock", () => ({
  useAutoLock: jest.fn(),
}));

jest.mock("@/hooks/useEthPrice", () => ({
  useEthPrice: () => ({ price: null, isLoading: false, toUsd: () => null }),
}));

jest.mock("@/components/wallet/NetworkSwitcher", () => ({
  NetworkSwitcher: () => <div data-testid="network-switcher" />,
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockLock.mockClear();
  });

  it("renders the app name", () => {
    render(<DashboardPage />);
    expect(screen.getByText("SimpleCrypto")).toBeInTheDocument();
  });

  it("displays the wallet balance", () => {
    render(<DashboardPage />);
    expect(screen.getByText("1.250000")).toBeInTheDocument();
  });

  it("displays the shortened wallet address", () => {
    render(<DashboardPage />);
    expect(screen.getByText("0xf39F...2266")).toBeInTheDocument();
  });

  it("shows Sepolia Testnet badge", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Sepolia Testnet")).toBeInTheDocument();
  });

  it("renders Send and Receive buttons", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Send")).toBeInTheDocument();
    expect(screen.getByText("Receive")).toBeInTheDocument();
  });

  it("navigates to /send on Send click", async () => {
    render(<DashboardPage />);
    await userEvent.click(screen.getByText("Send"));
    expect(mockPush).toHaveBeenCalledWith("/send");
  });

  it("navigates to /receive on Receive click", async () => {
    render(<DashboardPage />);
    await userEvent.click(screen.getByText("Receive"));
    expect(mockPush).toHaveBeenCalledWith("/receive");
  });

  it("displays transaction history", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Recent Transactions")).toBeInTheDocument();
    expect(screen.getAllByText("Sent")).toHaveLength(1);
    expect(screen.getAllByText("Received")).toHaveLength(1);
  });

  it("shows sent transaction with negative amount", () => {
    render(<DashboardPage />);
    expect(screen.getByText("-0.010000 ETH")).toBeInTheDocument();
  });

  it("shows received transaction with positive amount", () => {
    render(<DashboardPage />);
    expect(screen.getByText("+0.050000 ETH")).toBeInTheDocument();
  });

  it("navigates to /settings on Settings click", async () => {
    render(<DashboardPage />);
    const settingsButton = screen.getByRole("button", { name: "Settings" });
    await userEvent.click(settingsButton);
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("locks wallet and redirects to home on lock click", async () => {
    render(<DashboardPage />);
    const lockButton = screen.getByRole("button", { name: "Lock wallet" });
    await userEvent.click(lockButton);
    await waitFor(() => {
      expect(mockLock).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("copies address to clipboard on address click", async () => {
    const writeText = jest.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    render(<DashboardPage />);
    await userEvent.click(screen.getByText("0xf39F...2266"));
    expect(writeText).toHaveBeenCalledWith("0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266");
  });
});
