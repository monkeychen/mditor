import '@testing-library/jest-dom';

// Polyfill SVG layout APIs in jsdom for Mermaid rendering
if (typeof SVGElement !== 'undefined') {
  if (!(SVGElement.prototype as any).getBBox) {
    (SVGElement.prototype as any).getBBox = function () {
      return {
        x: 0,
        y: 0,
        width: 120,
        height: 40,
        top: 0,
        left: 0,
        bottom: 40,
        right: 120,
        toJSON: () => {},
      };
    };
  }
  if (!('getComputedTextLength' in SVGElement.prototype)) {
    (SVGElement.prototype as any).getComputedTextLength = function () {
      return 60;
    };
  }
}

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
