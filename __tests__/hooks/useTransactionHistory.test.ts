import { renderHook, waitFor, act } from "@testing-library/react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";

const ADDRESS = "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266";

function makeTransfer(hash: string, from: string, to: string) {
  return {
    hash,
    from,
    to,
    value: 0.01,
    metadata: { blockTimestamp: "2024-01-01T00:00:00Z" },
    category: "external",
  };
}

function mockAlchemyResponse(transfers: object[], pageKey?: string) {
  return {
    jsonrpc: "2.0",
    result: { transfers, pageKey },
    id: 1,
  };
}

describe("useTransactionHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and merges sent and received transactions", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: async () => mockAlchemyResponse([
          makeTransfer("0xsent1", ADDRESS, "0xother"),
        ]),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => mockAlchemyResponse([
          makeTransfer("0xreceived1", "0xother", ADDRESS),
        ]),
      } as Response);

    const { result } = renderHook(() =>
      useTransactionHistory(ADDRESS, "sepolia")
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.transactions.map((t) => t.hash)).toContain("0xsent1");
    expect(result.current.transactions.map((t) => t.hash)).toContain("0xreceived1");
  });

  it("deduplicates transactions that appear in both sent and received", async () => {
    const duplicate = makeTransfer("0xduplicate", ADDRESS, ADDRESS);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: async () => mockAlchemyResponse([duplicate]) } as Response)
      .mockResolvedValueOnce({ json: async () => mockAlchemyResponse([duplicate]) } as Response);

    const { result } = renderHook(() =>
      useTransactionHistory(ADDRESS, "sepolia")
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.transactions).toHaveLength(1);
  });

  it("sets hasMore to true when pageKey is returned", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: async () => mockAlchemyResponse([makeTransfer("0xsent1", ADDRESS, "0xother")], "page-key-sent"),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => mockAlchemyResponse([]),
      } as Response);

    const { result } = renderHook(() =>
      useTransactionHistory(ADDRESS, "sepolia")
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(true);
  });

  it("sets hasMore to false when no pageKey returned", async () => {
    global.fetch = jest.fn()
      .mockResolvedValue({ json: async () => mockAlchemyResponse([]) } as Response);

    const { result } = renderHook(() =>
      useTransactionHistory(ADDRESS, "sepolia")
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(false);
  });

  it("loadMore appends new transactions", async () => {
    // Initial fetch
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: async () => mockAlchemyResponse(
          [makeTransfer("0xsent1", ADDRESS, "0xother")],
          "next-page-key"
        ),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => mockAlchemyResponse([]),
      } as Response)
      // loadMore fetch
      .mockResolvedValueOnce({
        json: async () => mockAlchemyResponse([makeTransfer("0xsent2", ADDRESS, "0xother")]),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => mockAlchemyResponse([]),
      } as Response);

    const { result } = renderHook(() =>
      useTransactionHistory(ADDRESS, "sepolia")
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.transactions).toHaveLength(1);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.transactions.map((t) => t.hash)).toContain("0xsent2");
  });

  it("loadMore does not add duplicates", async () => {
    const tx = makeTransfer("0xsame", ADDRESS, "0xother");

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: async () => mockAlchemyResponse([tx], "next-page"),
      } as Response)
      .mockResolvedValueOnce({ json: async () => mockAlchemyResponse([]) } as Response)
      .mockResolvedValueOnce({ json: async () => mockAlchemyResponse([tx]) } as Response)
      .mockResolvedValueOnce({ json: async () => mockAlchemyResponse([]) } as Response);

    const { result } = renderHook(() =>
      useTransactionHistory(ADDRESS, "sepolia")
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.loadMore(); });

    expect(result.current.transactions).toHaveLength(1);
  });

  it("refetch resets and reloads from scratch", async () => {
    global.fetch = jest.fn()
      .mockResolvedValue({ json: async () => mockAlchemyResponse([makeTransfer("0xtx1", ADDRESS, "0xother")]) } as Response);

    const { result } = renderHook(() =>
      useTransactionHistory(ADDRESS, "sepolia")
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    global.fetch = jest.fn()
      .mockResolvedValue({ json: async () => mockAlchemyResponse([makeTransfer("0xtx2", ADDRESS, "0xother")]) } as Response);

    await act(async () => { await result.current.refetch(); });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.transactions[0].hash).toBe("0xtx2");
  });

  it("returns empty list and no error when address is null", async () => {
    const { result } = renderHook(() =>
      useTransactionHistory(null, "sepolia")
    );
    expect(result.current.transactions).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });
});
