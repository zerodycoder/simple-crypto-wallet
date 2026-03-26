import { renderHook, waitFor, act } from "@testing-library/react";
import { useEthPrice } from "@/hooks/useEthPrice";

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;

describe("useEthPrice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fetches price from /api/price on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ usd: 3500 }),
      ok: true,
    });

    const { result } = renderHook(() => useEthPrice());

    await waitFor(() => {
      expect(result.current.price).toBe(3500);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/price");
  });

  it("starts with null price before fetch completes", () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ usd: 3500 }),
    });

    const { result } = renderHook(() => useEthPrice());
    expect(result.current.price).toBeNull();
  });

  it("silently ignores fetch errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useEthPrice());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.price).toBeNull();
  });

  it("silently ignores missing usd field in response", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ error: "something went wrong" }),
    });

    const { result } = renderHook(() => useEthPrice());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.price).toBeNull();
  });

  it("refetches every 60 seconds", async () => {
    mockFetch
      .mockResolvedValueOnce({ json: async () => ({ usd: 3500 }) })
      .mockResolvedValueOnce({ json: async () => ({ usd: 3600 }) });

    const { result } = renderHook(() => useEthPrice());

    await waitFor(() => expect(result.current.price).toBe(3500));

    act(() => jest.advanceTimersByTime(60000));

    await waitFor(() => expect(result.current.price).toBe(3600));

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  describe("toUsd", () => {
    it("converts ETH amount to formatted USD string", async () => {
      mockFetch.mockResolvedValueOnce({ json: async () => ({ usd: 3000 }) });

      const { result } = renderHook(() => useEthPrice());
      await waitFor(() => expect(result.current.price).toBe(3000));

      expect(result.current.toUsd("1")).toBe("$3,000.00");
    });

    it("returns null when price is not loaded yet", () => {
      mockFetch.mockResolvedValueOnce({ json: async () => ({ usd: 3000 }) });

      const { result } = renderHook(() => useEthPrice());
      expect(result.current.toUsd("1")).toBeNull();
    });

    it("returns null for empty amount", async () => {
      mockFetch.mockResolvedValueOnce({ json: async () => ({ usd: 3000 }) });

      const { result } = renderHook(() => useEthPrice());
      await waitFor(() => expect(result.current.price).toBe(3000));

      expect(result.current.toUsd("")).toBeNull();
    });

    it("correctly calculates fractional ETH amounts", async () => {
      mockFetch.mockResolvedValueOnce({ json: async () => ({ usd: 2000 }) });

      const { result } = renderHook(() => useEthPrice());
      await waitFor(() => expect(result.current.price).toBe(2000));

      expect(result.current.toUsd("0.5")).toBe("$1,000.00");
    });
  });
});
