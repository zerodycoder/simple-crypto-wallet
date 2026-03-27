import "@testing-library/jest-dom";
import { webcrypto } from "crypto";

// ethers.js needs Web Crypto API — patch it for Jest/Node environment
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  writable: false,
});

// IntersectionObserver is not available in jsdom
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;
