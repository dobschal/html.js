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

test("Splicing in undefined as value should work", () => {
    const val = undefined;
    const elements = html`
        <div>
            <h1>Yeah</h1>
        </div>
        <div>
            <h2>Uuuuh</h2>
        </div>
        ${val}
    `;
    expect(elements.filter(el => el instanceof HTMLElement).length).toBe(2);
});

test("Applying empty class should work", () => {
    const elements = html`
        <div class="${""}">
            <h1>Yeah</h1>
        </div>
        <div class="${undefined}">
            <h2>Uuuuh</h2>
        </div>
    `;
    expect(elements.filter(el => el instanceof HTMLElement).at(0).classList.length).toBe(0);
    expect(elements.filter(el => el instanceof HTMLElement).at(1).classList.length).toBe(0);
});

test("Applying an attribute with value should work", () => {
    const isShown = Observable(true);
    const element = html`
        <div ${() => isShown.value ? "class=\"show\"" : ""}>
    `;
    expect(element.classList.contains("show")).toBe(true);
    isShown.value = false;
    expect(element.classList.contains("show")).toBe(false);
});

test("input binding a nested property should work", () => {
    const state = Observable({ name: "Alice" });
    const element = html`
        <input type="text" value="${() => state.value.name}">
    `;
    expect(element.value).toBe("Alice");
    state.value.name = "Bob";
    expect(element.value).toBe("Bob");
});

test("user should be able to set the state of a input checkbox element", () => {
    const checked = Observable(false);
    const element = html`
        <input type="checkbox" checked="${checked}">
    `;
    expect(element.getAttribute("checked")).toBe("false");
    checked.value = true;
    expect(element.getAttribute("checked")).toBe("true");
});

test("empty observable element in inner HTML should work", () => {
    const value = Observable(undefined);
    const element = html`
        <div>${value}</div>
    `;
    expect(element.textContent).toBe("");
    value.value = "Hello World";
    expect(element.textContent).toBe("Hello World");
});

test("empty nested observable in inner HTML should work", () => {
    const value = Observable({ text: undefined });
    const element = html`
        <div>${() => value.value.text}</div>
    `;
    expect(element.textContent).toBe("");
    value.value.text = "Hello World";
    expect(element.textContent).toBe("Hello World");
});

test("empty nested plain object in inner HTML should work", () => {
    const value = { text: "" };
    const someClass = Observable("yeah");
    const element = html`
        <div class="${someClass}">${value.text}</div>
    `;
    expect(element.textContent).toBe("");
    value.text = "Hello World";
    expect(element.textContent).toBe("");
    someClass.value = "nope";
    expect(element.textContent).toBe("");
    expect(element.classList.contains("nope")).toBe(true);
});

test("style binding should work", () => {

    const entry = {
        category: {
            color: "blue"
        }
    };

    const style = Computed(() => {
        if (!entry.category?.color) return "dsfsd";
        return "background-color: red";
    });

    const element = html`
        <tr style="${style}">
            <td>Hello WOrld</td>
        </tr>
    `;

    expect(element.style.backgroundColor).toBe("red");
});

test("XSS: string interpolation uses text nodes, not innerHTML", () => {
    const malicious = "<img src=x onerror=alert(1)>";
    const element = html`
        <div>${malicious}</div>
    `;
    expect(element.querySelector("img")).toBeNull();
    expect(element.textContent).toBe(malicious);
});

test("XSS: observable string interpolation uses text nodes", () => {
    const obs = Observable("<script>alert(1)</script>");
    const element = html`
        <div>${obs}</div>
    `;
    expect(element.querySelector("script")).toBeNull();
    expect(element.textContent).toBe("<script>alert(1)</script>");
});

test("XSS: array of strings uses text nodes", () => {
    const items = ["<b>bold</b>", "<i>italic</i>"];
    const element = html`
        <div>${items}</div>
    `;
    expect(element.querySelector("b")).toBeNull();
    expect(element.querySelector("i")).toBeNull();
    expect(element.textContent).toBe("<b>bold</b><i>italic</i>");
});

test("Attribute value containing = should not be truncated", () => {
    const element = html`
        <div ${'data-url="https://example.com?a=1&b=2"'}></div>
    `;
    expect(element.getAttribute("data-url")).toBe("https://example.com?a=1&b=2");
});

test("dispose() cleans up subscriptions", () => {
    const obs = Observable("initial");
    const element = html`
        <div>${obs}</div>
    `;
    expect(element.textContent).toBe("initial");
    element.dispose();
    obs.value = "updated";
    expect(element.textContent).toBe("initial");
});

test("dispose() works on array result", () => {
    const obs = Observable("hello");
    const elements = html`
        <div>${obs}</div>
        <span>static</span>
    `;
    expect(typeof elements.dispose).toBe("function");
    elements.dispose();
    obs.value = "changed";
    expect(elements[0].textContent).toBe("hello");
});

test("Handles > inside quoted attribute values correctly", () => {
    const clickHandler = jest.fn();
    const element = html`
        <div title="a > b" onclick="${clickHandler}">content</div>
    `;
    expect(element.getAttribute("title")).toBe("a > b");
    element.click();
    expect(clickHandler).toHaveBeenCalled();
});

// --- replaceStringOrHTMLElement: null, number, boolean, empty array, mixed array, unsupported type ---

test("Replaces placeholder with null", () => {
    const element = html`
        <div>${null}</div>
    `;
    expect(element.textContent).toBe("");
});

test("Replaces placeholder with number", () => {
    const element = html`
        <div>${42}</div>
    `;
    expect(element.textContent).toBe("42");
});

test("Replaces placeholder with boolean", () => {
    const element = html`
        <div>${true}</div>
    `;
    expect(element.textContent).toBe("true");
});

test("Replaces placeholder with empty array", () => {
    const element = html`
        <div>${[]}</div>
    `;
    expect(element.textContent).toBe("");
});

test("Replaces placeholder with mixed array of strings and HTMLElements", () => {
    const child = document.createElement("b");
    child.textContent = "bold";
    const element = html`
        <div>${["hello ", child, " world"]}</div>
    `;
    expect(element.querySelector("b")).toBe(child);
    expect(element.textContent).toBe("hello bold world");
});

test("Throws for unsupported placeholder type", () => {
    expect(() => html`
        <div>${{}}</div>
    `).toThrow("Unsupported type for template placeholder");
});

// --- handleIfAttribute: if, if-not, else sibling ---

test("if attribute shows element when truthy", () => {
    const shown = Observable(true);
    const element = html`
        <div>
            <span if="${shown}">visible</span>
        </div>
    `;
    expect(element.querySelector("span")).not.toBeNull();
    expect(element.textContent).toContain("visible");
});

test("if attribute hides element when falsy", () => {
    const shown = Observable(false);
    const element = html`
        <div>
            <span if="${shown}">visible</span>
        </div>
    `;
    expect(element.querySelector("span")).toBeNull();
});

test("if attribute toggles element visibility", () => {
    const shown = Observable(true);
    const element = html`
        <div>
            <span if="${shown}">visible</span>
        </div>
    `;
    expect(element.querySelector("span")).not.toBeNull();
    shown.value = false;
    expect(element.querySelector("span")).toBeNull();
    shown.value = true;
    expect(element.querySelector("span")).not.toBeNull();
});

test("if-not attribute hides element when truthy", () => {
    const hidden = Observable(true);
    const element = html`
        <div>
            <span if-not="${hidden}">hidden content</span>
        </div>
    `;
    expect(element.querySelector("span")).toBeNull();
});

test("if-not attribute shows element when falsy", () => {
    const hidden = Observable(false);
    const element = html`
        <div>
            <span if-not="${hidden}">visible content</span>
        </div>
    `;
    expect(element.querySelector("span")).not.toBeNull();
    expect(element.textContent).toContain("visible content");
});

test("if/else sibling toggle", () => {
    const shown = Observable(true);
    const element = html`
        <div>
            <span if="${shown}">yes</span>
            <span else>no</span>
        </div>
    `;
    expect(element.textContent).toContain("yes");
    expect(element.textContent).not.toContain("no");
    shown.value = false;
    expect(element.textContent).not.toContain("yes");
    expect(element.textContent).toContain("no");
});

test("if attribute works with inline function", () => {
    const state = Observable(true);
    const element = html`
        <div>
            <span if="${() => state.value}">shown</span>
        </div>
    `;
    expect(element.querySelector("span")).not.toBeNull();
    state.value = false;
    expect(element.querySelector("span")).toBeNull();
});

// --- replaceAttributePlaceholder: plain function in regular attribute, on-event error ---

test("Plain function in a regular attribute updates reactively", () => {
    const obs = Observable("blue");
    const element = html`
        <div data-color="${() => obs.value}"></div>
    `;
    expect(element.getAttribute("data-color")).toBe("blue");
    obs.value = "red";
    expect(element.getAttribute("data-color")).toBe("red");
});

test("Non-function on event handler throws", () => {
    expect(() => html`
        <button onclick="${"not a function"}"></button>
    `).toThrow("expects a function");
});

// --- Dynamic attribute without value (key-only, no =) ---

test("Dynamic attribute without value (key-only)", () => {
    const element = html`
        <input ${"disabled"}>
    `;
    expect(element.hasAttribute("disabled")).toBe(true);
});

// --- isInsideTag: single-quoted >, < inside quotes ---

test("Handles > inside single-quoted attribute values", () => {
    const value = "test";
    const element = html`
        <div title='a > b' data-x="${value}">content</div>
    `;
    expect(element.getAttribute("title")).toBe("a > b");
    expect(element.getAttribute("data-x")).toBe("test");
});

test("Handles < inside quoted attribute values", () => {
    const handler = jest.fn();
    const element = html`
        <div title="a < b" onclick="${handler}">content</div>
    `;
    expect(element.getAttribute("title")).toBe("a < b");
    element.click();
    expect(handler).toHaveBeenCalled();
});

// --- dispose: idempotent, class binding, attribute binding ---

test("dispose() is idempotent - calling twice does not throw", () => {
    const obs = Observable("hello");
    const element = html`
        <div>${obs}</div>
    `;
    element.dispose();
    element.dispose();
    obs.value = "changed";
    expect(element.textContent).toBe("hello");
});

test("dispose() stops class binding updates", () => {
    const cls = Observable("active");
    const element = html`
        <div class="${cls}">content</div>
    `;
    expect(element.classList.contains("active")).toBe(true);
    element.dispose();
    cls.value = "inactive";
    expect(element.classList.contains("active")).toBe(true);
    expect(element.classList.contains("inactive")).toBe(false);
});

test("dispose() stops attribute binding updates", () => {
    const color = Observable("red");
    const element = html`
        <div data-color="${color}">content</div>
    `;
    expect(element.getAttribute("data-color")).toBe("red");
    element.dispose();
    color.value = "blue";
    expect(element.getAttribute("data-color")).toBe("red");
});