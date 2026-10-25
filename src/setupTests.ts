// Test setup file for Jest and React Testing Library
import '@testing-library/jest-dom';

// Mock localStorage for testing with a proper implementation
class LocalStorageMock {
  private store: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Set up localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
});

// jsdom には window.matchMedia が無いためモックする。
// prefers-reduced-motion などのメディアクエリ判定を使うコンポーネント向け。
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // 旧API（後方互換）
    removeListener: jest.fn(), // 旧API（後方互換）
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// jsdom/Node のテスト環境では crypto.randomUUID が未定義なことがあるため補う。
if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {},
    writable: true,
  });
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
  // テスト用の簡易UUID生成（本番では標準のcrypto.randomUUIDが使われる）
  (globalThis.crypto as { randomUUID: () => string }).randomUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

// Set up global console suppression for expected warnings in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  // Reset localStorage before each test
  localStorage.clear();
});

// Optionally suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};