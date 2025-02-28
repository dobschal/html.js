const html = require("./html");

test("Creates HTMLElement", () => {
    const element = html`
        <div></div>`;
    expect(element instanceof HTMLElement).toBe(true);
});

test("Creates HTMLElements as array", () => {
    const elements = html`
        <div></div>
        <div></div>`;
    const htmlElements = elements.filter(el => (el instanceof HTMLElement));
    expect(Array.isArray(htmlElements)).toBe(true);
    expect(htmlElements.length).toBe(2);
    expect(htmlElements.every((element) => element instanceof HTMLElement)).toBe(true);
});

test("Replaces placeholder with HTMLElement", () => {
    const element = document.createElement("div");
    const elements = html`
        <div></div>
        ${element}
        <div></div>`;
    const htmlElements = elements.filter(el => (el instanceof HTMLElement));
    expect(htmlElements[1]).toBe(element);
});

// TODO: More tests
