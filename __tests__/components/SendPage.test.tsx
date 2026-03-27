import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SendPage from "@/app/send/page";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockWallet = {
  address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
  encryptedKey: '{"version":3}',
};

jest.mock("@/store/useWalletStore", () => ({
  useWalletStore: () => ({
    wallet: mockWallet,
    network: "sepolia",
  }),
}));

jest.mock("@/hooks/useTransaction", () => ({
  useTransaction: () => ({
    sendTransaction: jest.fn().mockResolvedValue({
      hash: "0xabc123def456",
      status: "confirmed",
    }),
    estimateGas: jest.fn().mockResolvedValue("0.00001"),
    isLoading: false,
    error: null,
  }),
}));

jest.mock("@/hooks/useEthPrice", () => ({
  useEthPrice: () => ({
    price: 3000,
    toUsd: (eth: string) => `$${(parseFloat(eth) * 3000).toFixed(2)}`,
  }),
}));

describe("SendPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the send form", () => {
    render(<SendPage />);
    expect(screen.getByText("Send ETH")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0x...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
  });

  it("shows error for invalid address", async () => {
    render(<SendPage />);
    await userEvent.type(screen.getByPlaceholderText("0x..."), "invalid-address");
    await userEvent.type(screen.getByPlaceholderText("0.00"), "0.01");
    await userEvent.click(screen.getByText("Review Transaction"));
    expect(screen.getByText("Invalid Ethereum address")).toBeInTheDocument();
  });

  it("shows error for missing amount", async () => {
    render(<SendPage />);
    await userEvent.type(
      screen.getByPlaceholderText("0x..."),
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    );
    await userEvent.click(screen.getByText("Review Transaction"));
    expect(screen.getByText("Enter a valid amount")).toBeInTheDocument();
  });

  it("opens confirm dialog with valid inputs", async () => {
    render(<SendPage />);
    await userEvent.type(
      screen.getByPlaceholderText("0x..."),
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    );
    await userEvent.type(screen.getByPlaceholderText("0.00"), "0.01");
    await userEvent.click(screen.getByText("Review Transaction"));
    await waitFor(() => {
      expect(screen.getByText("Confirm Transaction")).toBeInTheDocument();
    });
  });

  it("confirm button is disabled without password", async () => {
    render(<SendPage />);
    await userEvent.type(
      screen.getByPlaceholderText("0x..."),
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    );
    await userEvent.type(screen.getByPlaceholderText("0.00"), "0.01");
    await userEvent.click(screen.getByText("Review Transaction"));
    await waitFor(() => screen.getByText("Confirm & Send"));
    expect(screen.getByText("Confirm & Send")).toBeDisabled();
  });

  it("shows transaction details in confirm dialog", async () => {
    render(<SendPage />);
    await userEvent.type(
      screen.getByPlaceholderText("0x..."),
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    );
    await userEvent.type(screen.getByPlaceholderText("0.00"), "0.01");
    await userEvent.click(screen.getByText("Review Transaction"));
    await waitFor(() => {
      expect(screen.getByText("0.01 ETH")).toBeInTheDocument();
      expect(screen.getByText("Sepolia Testnet")).toBeInTheDocument();
    });
  });

  it("closes dialog on Cancel click", async () => {
    render(<SendPage />);
    await userEvent.type(
      screen.getByPlaceholderText("0x..."),
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    );
    await userEvent.type(screen.getByPlaceholderText("0.00"), "0.01");
    await userEvent.click(screen.getByText("Review Transaction"));
    await waitFor(() => screen.getByText("Cancel"));
    await userEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Confirm Transaction")).not.toBeInTheDocument();
  });

  it("shows gas estimate in ETH after valid inputs", async () => {
    render(<SendPage />);
    await userEvent.type(
      screen.getByPlaceholderText("0x..."),
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    );
    await userEvent.type(screen.getByPlaceholderText("0.00"), "0.01");
    await waitFor(() => {
      expect(screen.getByText("0.00001000 ETH")).toBeInTheDocument();
    });
  });

  it("shows gas estimate in USD after valid inputs", async () => {
    render(<SendPage />);
    await userEvent.type(
      screen.getByPlaceholderText("0x..."),
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    );
    await userEvent.type(screen.getByPlaceholderText("0.00"), "0.01");
    await waitFor(() => {
      expect(screen.getByText("≈ $0.03")).toBeInTheDocument();
    });
  });

  it("navigates back to dashboard with refresh param on back button click", async () => {
    render(<SendPage />);
    await userEvent.click(screen.getByRole("button", { name: "" }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard?refresh=1");
  });
});
