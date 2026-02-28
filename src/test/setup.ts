import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Polyfill ResizeObserver for Radix UI components (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock all Tauri APIs globally
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path: string) => `asset://localhost${path}`),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  save: vi.fn(),
  message: vi.fn(),
  ask: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readDir: vi.fn(),
  exists: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-shell", () => ({
  Command: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  open: vi.fn(),
}));
