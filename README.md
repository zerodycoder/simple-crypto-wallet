# SimpleCrypto Wallet

A non-custodial Ethereum wallet built with Next.js, TypeScript, and ethers.js v6. Supports Sepolia testnet and Ethereum mainnet. Built as a portfolio project to demonstrate full-stack Web3 development.

---

## Features

- **Create wallet** — generates a 12-word mnemonic with 3-word verification step
- **Import wallet** — from seed phrase or raw private key
- **Send ETH** — real-time gas estimation, password-gated transaction signing
- **Receive** — QR code generation + one-click address copy
- **Transaction history** — sent and received transactions via Alchemy, with Etherscan links
- **ETH/USD price** — live price via CoinGecko, refreshed every 60 seconds
- **Auto-lock** — locks wallet after configurable inactivity timeout (1–60 min)
- **Settings** — change lock timeout, default network, or remove wallet from device
- **Unlock page** — returning users enter password to decrypt and restore session
- **Network switcher** — toggle between Sepolia testnet and Ethereum mainnet

---

## Security model

- Private key never leaves the browser in plaintext
- Keys are encrypted via ethers.js keystore v3 (AES-128-CTR + scrypt) and stored in `localStorage`
- Password is required to decrypt the key before every transaction
- The signed transaction hex is the only thing broadcast to the network

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Blockchain | ethers.js v6 |
| State | Zustand (with persist middleware) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| RPC | Alchemy JSON-RPC |
| Price | CoinGecko API (via Next.js API route) |
| Testing | Jest + React Testing Library + Playwright |

---

## Getting started

### Prerequisites

- Node.js 18+
- An [Alchemy](https://alchemy.com) account (free tier is enough)

### Setup

```bash
git clone https://github.com/zerodycoder/simple-crypto-wallet.git
cd simple-crypto-wallet
npm install
```

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing

```bash
# Unit + component tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (requires dev server running)
npm run test:e2e

# E2E with interactive UI
npm run test:e2e:ui
```

**135 unit/component tests** across lib, store, hooks, and pages.
**38 E2E tests** covering full user flows with Playwright + Chromium.

---

## Project structure

```
├── app/
│   ├── page.tsx           # Welcome / entry point
│   ├── create/            # 3-step wallet creation flow
│   ├── import/            # Import from mnemonic or private key
│   ├── unlock/            # Password unlock for returning users
│   ├── dashboard/         # Balance, history, actions
│   ├── send/              # Send ETH form
│   ├── receive/           # QR code + address
│   ├── settings/          # Auto-lock, network, danger zone
│   └── api/price/         # CoinGecko proxy (cached 60s)
├── lib/
│   ├── crypto.ts          # Encrypt/decrypt private key, localStorage helpers
│   ├── wallet.ts          # Wallet creation, import, address formatting
│   └── provider.ts        # Alchemy JsonRpcProvider factory
├── hooks/
│   ├── useBalance.ts      # ETH balance with 15s auto-refresh
│   ├── useTransaction.ts  # Send tx, gas estimate, receipt polling
│   ├── useTransactionHistory.ts  # Sent + received via alchemy_getAssetTransfers
│   ├── useEthPrice.ts     # ETH/USD price polling
│   └── useAutoLock.ts     # Inactivity timer, locks wallet on timeout
├── store/
│   └── useWalletStore.ts  # Zustand store (wallet, network, lock state, settings)
├── types/
│   └── wallet.ts          # Shared TypeScript interfaces
├── components/
│   └── wallet/            # NetworkSwitcher
├── __tests__/             # Jest unit + component tests
└── e2e/                   # Playwright E2E tests
```

---

## License

MIT
