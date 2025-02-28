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
    html`<div>Hello World</div>`
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

document.body.append(view);

```

