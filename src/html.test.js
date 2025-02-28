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
    expect(Array.isArray(elements)).toBe(true);
    expect(elements.length).toBe(2);
    expect(elements.every((element) => element instanceof HTMLElement)).toBe(true);
});

test("Replaces placeholder with HTMLElement", () => {
    const element = document.createElement("div");
    const elements = html`
        <div></div>${element}
        <div></div>`;
    expect(elements[1]).toBe(element);
});

// TODO: More tests
