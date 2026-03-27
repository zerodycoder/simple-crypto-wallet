import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WelcomePage from "@/app/page";

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("@/lib/crypto", () => ({
  loadWalletFromStorage: jest.fn().mockReturnValue(null),
}));

describe("WelcomePage", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it("renders the app name", () => {
    render(<WelcomePage />);
    expect(screen.getByText("SimpleCrypto")).toBeInTheDocument();
  });

  it("renders Create New Wallet button", () => {
    render(<WelcomePage />);
    expect(screen.getByText("Create New Wallet")).toBeInTheDocument();
  });

  it("renders Import Existing Wallet button", () => {
    render(<WelcomePage />);
    expect(screen.getByText("Import Existing Wallet")).toBeInTheDocument();
  });

  it("navigates to /create when Create button is clicked", async () => {
    render(<WelcomePage />);
    await userEvent.click(screen.getByText("Create New Wallet"));
    expect(mockPush).toHaveBeenCalledWith("/create");
  });

  it("navigates to /import when Import button is clicked", async () => {
    render(<WelcomePage />);
    await userEvent.click(screen.getByText("Import Existing Wallet"));
    expect(mockPush).toHaveBeenCalledWith("/import");
  });

  it("renders all 3 feature highlights", () => {
    render(<WelcomePage />);
    expect(screen.getByText("Non-custodial")).toBeInTheDocument();
    expect(screen.getByText("Fast & lightweight")).toBeInTheDocument();
    expect(screen.getByText("Extensible")).toBeInTheDocument();
  });

  it("renders the disclaimer text", () => {
    render(<WelcomePage />);
    expect(screen.getByText(/solely responsible/i)).toBeInTheDocument();
  });

  it("redirects to /unlock when a stored wallet exists", async () => {
    const { loadWalletFromStorage } = require("@/lib/crypto");
    (loadWalletFromStorage as jest.Mock).mockReturnValueOnce({
      address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
      encryptedKey: '{"version":3}',
    });
    render(<WelcomePage />);
    await screen.findByText("SimpleCrypto");
    expect(mockReplace).toHaveBeenCalledWith("/unlock");
  });

  it("does not redirect when no wallet in storage", async () => {
    render(<WelcomePage />);
    await screen.findByText("SimpleCrypto");
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
