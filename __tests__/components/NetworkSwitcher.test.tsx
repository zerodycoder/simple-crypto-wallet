import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NetworkSwitcher } from "@/components/wallet/NetworkSwitcher";
import { useWalletStore } from "@/store/useWalletStore";

describe("NetworkSwitcher", () => {
  beforeEach(() => {
    useWalletStore.setState({ network: "sepolia" });
  });

  it("renders Sepolia and Mainnet buttons", () => {
    render(<NetworkSwitcher />);
    expect(screen.getByText("Sepolia")).toBeInTheDocument();
    expect(screen.getByText("Mainnet")).toBeInTheDocument();
  });

  it("Sepolia button is active by default", () => {
    render(<NetworkSwitcher />);
    const sepoliaBtn = screen.getByText("Sepolia");
    expect(sepoliaBtn.className).toContain("bg-primary");
  });

  it("switches to mainnet when Mainnet is clicked", async () => {
    render(<NetworkSwitcher />);
    await userEvent.click(screen.getByText("Mainnet"));
    expect(useWalletStore.getState().network).toBe("mainnet");
  });

  it("switches back to sepolia when Sepolia is clicked", async () => {
    useWalletStore.setState({ network: "mainnet" });
    render(<NetworkSwitcher />);
    await userEvent.click(screen.getByText("Sepolia"));
    expect(useWalletStore.getState().network).toBe("sepolia");
  });
});
