const html = require("./html");
const {Observable, Computed} = require("@dobschal/observable");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

test("Binds input element value to observable and updates", () => {
    const observable = Observable("Hello World");
    const element = html`
        <input type="text" value="${observable}">
    `;
    observable.value = "Hello Universe";
    expect(element.value).toBe("Hello Universe");
});

test("Renders list of elements based on observable array", () => {
    const users = Observable(["Maria", "Klaus", "Peter", "Samantha"]);
    const element = html`
        <ul>
            ${users.map(value => html`
                <li>${value}</li>
            `)}
        </ul>
    `;
    expect(element.querySelectorAll("li").length).toBe(4);
    expect(element.querySelectorAll("li")[0].textContent).toBe("Maria");
    expect(element.querySelectorAll("li")[1].textContent).toBe("Klaus");
});

test("Renders list of elements based on observable array and updates", () => {
    const users = Observable(["Maria", "Klaus", "Peter", "Samantha"]);
    const element = html`
        <ul>
            ${users.map(value => html`
                <li>${value}</li>
            `)}
        </ul>
    `;
    users.value.push("Steve");
    expect(element.querySelectorAll("li").length).toBe(5);
    expect(element.querySelectorAll("li")[4].textContent).toBe("Steve");
});

test("Renders list of elements based on observable array and removes item", () => {
    const users = Observable(["Maria", "Klaus", "Peter", "Samantha"]);
    const element = html`
        <ul>
            ${users.map(value => html`
                <li>${value}</li>
            `)}
        </ul>
    `;
    users.value = ["Maria", "Klaus", "Peter"];
    expect(element.querySelectorAll("li").length).toBe(3);
    expect(element.querySelectorAll("li")[2].textContent).toBe("Peter");
});

test("Having an attribute on the root element based on observable works", async () => {

    const state = Observable({ isOpen: true});

    function Component() {
        return html`
            <dialog ${() => state.value.isOpen ? "open" : ""}>
                <p>Example</p>
            </dialog>
        `;
    }

    const elements = html`
        <div>
            <h1>Yeah</h1>
        </div>
        <div>
            <h2>Uuuuh</h2>
        </div>
        ${Component()}
    `;
    expect(elements.at(-1).hasAttribute("open")).toBe(true); // or expect(elements.at(-1).get("open")).toBe(true);
    state.value.isOpen = false;
    expect(elements.at(-1).hasAttribute("open")).toBe(false);
});
