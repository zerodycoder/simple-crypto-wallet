import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWalletPage from "@/app/create/page";

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
  createNewWallet: jest.fn().mockResolvedValue({
    wallet: {
      address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
      encryptedKey: '{"version":3}',
    },
    mnemonic: "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12",
  }),
}));

jest.mock("@/lib/crypto", () => ({
  saveWalletToStorage: jest.fn(),
}));

jest.mock("@/store/useWalletStore", () => ({
  useWalletStore: () => ({ setWallet: jest.fn() }),
}));

describe("CreateWalletPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
    jest.clearAllMocks();
  });

  it("renders the password step by default", () => {
    render(<CreateWalletPage />);
    expect(screen.getByText("Create Password")).toBeInTheDocument();
  });

  it("shows error when password is too short", async () => {
    render(<CreateWalletPage />);
    await userEvent.type(screen.getByPlaceholderText("Min. 8 characters"), "short");
    await userEvent.type(screen.getByPlaceholderText("Repeat password"), "short");
    await userEvent.click(screen.getByText("Continue"));
    expect(toast.error).toHaveBeenCalledWith("Password must be at least 8 characters");
  });

  it("shows error when passwords do not match", async () => {
    render(<CreateWalletPage />);
    await userEvent.type(screen.getByPlaceholderText("Min. 8 characters"), "password123");
    await userEvent.type(screen.getByPlaceholderText("Repeat password"), "differentpass");
    await userEvent.click(screen.getByText("Continue"));
    expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
  });

  it("advances to mnemonic step after valid password", async () => {
    render(<CreateWalletPage />);
    await userEvent.type(screen.getByPlaceholderText("Min. 8 characters"), "password123");
    await userEvent.type(screen.getByPlaceholderText("Repeat password"), "password123");
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => {
      expect(screen.getByText("Save Seed Phrase")).toBeInTheDocument();
    });
  });

  it("displays 12 mnemonic words on the mnemonic step", async () => {
    render(<CreateWalletPage />);
    await userEvent.type(screen.getByPlaceholderText("Min. 8 characters"), "password123");
    await userEvent.type(screen.getByPlaceholderText("Repeat password"), "password123");
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => {
      expect(screen.getByText("word1")).toBeInTheDocument();
      expect(screen.getByText("word12")).toBeInTheDocument();
    });
  });

  it("advances to verify step after clicking save phrase button", async () => {
    render(<CreateWalletPage />);
    await userEvent.type(screen.getByPlaceholderText("Min. 8 characters"), "password123");
    await userEvent.type(screen.getByPlaceholderText("Repeat password"), "password123");
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => screen.getByText("I have saved my phrase"));
    await userEvent.click(screen.getByText("I have saved my phrase"));
    expect(screen.getByText("Verify Phrase")).toBeInTheDocument();
  });

  it("goes back to welcome page from password step", async () => {
    render(<CreateWalletPage />);
    await userEvent.click(screen.getByText("Back"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
