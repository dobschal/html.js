const html = require("./html");
const {Observable, Computed} = require("@dobschal/observable");

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

test("Replaces placeholder with string", () => {
    const element = html`
        <div>
            <span>${"Hello World"}</span>
        </div>
    `;
    expect(element.querySelector("span").textContent).toBe("Hello World");
});

test("Replaces placeholder with observable", () => {
    const observable = Observable("Hello World");
    const element = html`
        <div>
            <span>${observable}</span>
        </div>
    `;
    expect(element.querySelector("span").textContent).toBe("Hello World");
});

test("Replaces placeholder with observable and updates", () => {
    const observable = Observable("Hello World");
    const element = html`
        <div>
            <span>${observable}</span>
        </div>
    `;
    observable.value = "Hello Universe";
    expect(element.querySelector("span").textContent).toBe("Hello Universe");
});

test("Replaces placeholder with computed value", () => {
    const observable = Observable("Hello");
    const computed = Computed(() => observable.value + " World");
    const element = html`
        <div>
            <span>${computed}</span>
        </div>
    `;
    expect(element.querySelector("span").textContent).toBe("Hello World");
});

test("Replaces placeholder with computed value and updates", () => {
    const observable = Observable("Hello");
    const computed = Computed(() => observable.value + " World");
    const element = html`
        <div>
            <span>${computed}</span>
        </div>
    `;
    observable.value = "Hello Universe";
    expect(element.querySelector("span").textContent).toBe("Hello Universe World");
});

test("Applies event listener to element", () => {
    const observable = Observable(0);
    const element = html`
        <button onclick="${() => observable.value++}"></button>
    `;
    element.click();
    expect(observable.value).toBe(1);
});

test("Binds observable value to input element", () => {
    const observable = Observable("Hello World");
    const element = html`
        <input type="text" value="${observable}">
    `;
    expect(element.value).toBe("Hello World");
});

test("Binds input element value to observable", () => {
    const observable = Observable("Hello World");
    const element = html`
        <input type="text" value="${observable}">
    `;
    element.value = "Hello Universe";
    element.dispatchEvent(new Event("input"));
    expect(observable.value).toBe("Hello Universe");
});
