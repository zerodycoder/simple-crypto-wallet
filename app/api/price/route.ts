import { NextResponse } from "next/server";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

export async function GET() {
  try {
    const res = await fetch(COINGECKO_URL, {
      next: { revalidate: 60 }, // cache 60 seconds
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch price" }, { status: 502 });
    }

    const data = await res.json();
    const price: number = data?.ethereum?.usd;

    if (!price) {
      return NextResponse.json({ error: "Invalid response" }, { status: 502 });
    }

    return NextResponse.json({ usd: price });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
