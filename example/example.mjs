import {Computed, Observable} from "@dobschal/observable";

import html from "../src/html.js";

const count = Observable(0);
const elementShown = Observable(true);
const users = Observable([
    {name: "Alice"},
    {name: "Bob"},
    {name: "Charlie"},
    {name: "David"},
    {name: "Eve"},
]);
const username = Observable("Steve");
const description = Observable("This is a description");
const createdAt = Observable(new Date());

const isUsernameValid = Computed(() => username.value.length > 0);

function removeUser(user) {
    users.value = users.value.filter(u => u !== user);
}

function addUser() {
    users.value = [...users.value, {name: username.value}];
    username.value = "";
}

function Button(text, onclick) {
    return html`
        <button onclick="${onclick}">${text}</button>`;
}

const element = html`
    <main>
        <h1>HTML JS</h1>

        <h2>Button click to count up and show number</h2>
        <p>
            <button onclick="${() => count.value++}">Count up</button>
            <span><b>Count is:</b> ${count}</span>
        </p>

        <h2>Give element CSS classes dynamically based on observable/computed</h2>
        <p>
            This is a <span class="${count.map(value => value % 2 === 0 ? "red" : "blue")}">dynamic</span> styled
            element.
        </p>

        <h2>Hide and show elements dynamically based on observable/computed</h2>
        <p>
            <button onclick="${() => (elementShown.value = !elementShown.value)}">
                Toggle
            </button>
            ${() => elementShown.value ? `<span>This is a hidden element.</span>` : ""}
        </p>

        <h2>Render list of HTML elements dynamically based on observable array</h2>
        <p>
        <ul>
            ${users.map(user => html`
                <li onclick="${() => removeUser(user)}">${user.name}</li>
            `)}
        </ul>
        <input
                type="text"
                placeholder="Enter the users name..."
                value="${username}">
        <span if="${isUsernameValid}">
            ${Button(() => `Add ${username.value}`, addUser)}
        </span>
        <span else>Enter a name to add a user</span>
        </p>

        <h2>Use if/else attribute to show or hide elements</h2>
        <p>
            ${Button("Toggle", () => elementShown.value = !elementShown.value)}
            span is shown:
            <span if="${() => elementShown.value}">true</span>
            <span else>false</span>
        </p>

        <h2>TextArea and Select binding</h2>
        <p>
            <b>Textarea:</b> <br>
            <textarea value="${description}"></textarea><br>
            <b>Output:</b> <br>
        <pre>${description}</pre>
        ${Button("Clear", () => description.value = "")}
        </p>

        <h2>Render Date and update if date changes</h2>
        <p>
            ${() => createdAt.value.toLocaleString()}
            ${Button("Update", () => createdAt.value = new Date())}
        </p>
    </main>
`;

document.body.append(element);

