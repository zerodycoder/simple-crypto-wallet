/**
 * @jest-environment node
 */
import { GET } from "@/app/api/price/route";

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

describe("GET /api/price", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns ETH price in USD", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ethereum: { usd: 3500 } }),
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ usd: 3500 });
  });

  it("returns 502 when CoinGecko responds with non-ok status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.error).toBe("Failed to fetch price");
  });

  it("returns 502 when response is missing usd field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ethereum: {} }),
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.error).toBe("Invalid response");
  });

  it("returns 500 on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal error");
  });
});
