// jsdom + antd 5 may need matchMedia / ResizeObserver polyfills.
if (typeof (window as any).matchMedia === 'undefined') {
    (window as any).matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    });
}

if (typeof (window as any).ResizeObserver === 'undefined') {
    (window as any).ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}
