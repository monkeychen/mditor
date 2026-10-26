import '@testing-library/jest-dom';

// Mock clipboard API in jsdom
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: async (_text: string) => Promise.resolve(),
      write: async (_items: unknown[]) => Promise.resolve(),
    },
    writable: true,
  });
}
