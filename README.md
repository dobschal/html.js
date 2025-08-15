# HTML.js

A simple HTML in Javascript implementation featuring Model View Binding. It allows you to create HTML elements using
template literals and bind them to your model.

![Test](https://github.com/dobschal/HTML/actions/workflows/test.yml/badge.svg)
[![NPM](https://img.shields.io/npm/v/@dobschal/html.js)](https://www.npmjs.com/package/@dobschal/html.js)

## Installation

```bash
npm install --save @dobschal/html.js
```

## Examples

### Hello World

The example below creates a simple div element with the text "Hello World" and appends it to the body.

```javascript
import {html} from '@dobschal/html.js';

document.body.append(
    ...html`<div>Hello World</div>`
);
```

### Model View Binding

The created `view` is bound to the `count` observable. When the count changes, the view is updated:

```javascript
import {html} from '@dobschal/html.js';
import {Observable} from '@dobschal/observable';

const count = Observable(0);

const view = html`
    <p>👉 ${count}</p>
    <button onclick="${() => count.value++}">Count Up 🚀</button>
`;

document.body.append(...view);

```

## API

### html

`html` is a tagged template literal function that creates an HTML elements from a template string.

```javascript
// Create a div element with the text "Hello World"
const element = html`<div>Hello World</div>`;
console.log(element[0] instanceof HTMLElement); // true
```

In case the HTML template contains multiple elements, an array of elements is returned!
When appending to the DOM, you can use the spread operator to append all elements at once.
```javascript
document.body.append(...html`<div>Hello World</div>`);
```

### Components

You can create components by defining a function that returns an HTML element.

```javascript
function MyComponent() {
    return html`<div>Hello World</div>`;
}

function App() {
    return html`
        <div>
            ${MyComponent()}
        </div>
    `;
}

document.body.append(...App());
```

### Event Listeners

You can add event listeners to elements by using the standard HTML event attributes.

```javascript
html`
    <button onclick="${() => console.log('Clicked')}">Click Me</button>
`;
```

### Model View Binding

You can bind an observable to an element by using the observable directly in the template.

```javascript
import {Observable} from '@dobschal/observable';

const count = Observable(0);

const view = html`
    <p>👉 ${count}</p>
    <button onclick="${() => count.value++}">Count Up 🚀</button>
`;
```

### Conditional Rendering

You can conditionally render elements by using the ternary operator or the custom `if` attribute.

```javascript
const show = Observable(true);

// With the ternary operator
const view = html`
    ${show ? html`<div>Hello World</div>` : null}
`;

// With the if attribute
const view = html`
    <div if="${show}">Hello World</div>
`;
```

### List Rendering

You can render lists by using the `map` function on an array or observable array.

```javascript
const items = Observable([1, 2, 3]);

const view = html`
    <ul>
        ${items.map(item => html`<li>${item}</li>`)}
    </ul>
`;
```

# Author

![👋](https://avatars.githubusercontent.com/u/15888400?s=48&v=4)

Sascha Dobschal
