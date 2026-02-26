const {Computed} = require("@dobschal/observable");

let id = 0;

function convertStringToDomNodes(htmlString) {
    const fakeParent = document.createElement("template");
    fakeParent.innerHTML = htmlString;
    return Array.from(fakeParent.content.childNodes);
}

function resolveReactive(arg, callback) {
    if (arg?.isObservable) return arg.subscribe(callback);
    if (typeof arg === "function") return Computed(arg).subscribe(callback);
    callback(arg);
    return null;
}

function isInsideTag(str) {
    let inTag = false;
    let quote = null;
    for (let j = 0; j < str.length; j++) {
        const ch = str[j];
        if (quote) {
            if (ch === quote) quote = null;
        } else if (inTag) {
            if (ch === "\"" || ch === "'") {
                quote = ch;
            } else if (ch === ">") {
                inTag = false;
            }
        } else if (ch === "<") {
            inTag = true;
        }
    }
    return inTag;
}

function isArrayOfSupportedValues(value) {
    return Array.isArray(value)
        && value.every((item) => ["string", "number", "boolean"].includes(typeof item) || item instanceof HTMLElement || item instanceof Node);
}

function isEmptyArray(value) {
    return Array.isArray(value) && value.length === 0;
}

function replaceStringOrHTMLElement(placeholderNode, value) {
    if (value === undefined || value === null || value === "" || isEmptyArray(value)) {
        const commentNode = document.createComment(" ❤️ ");
        placeholderNode.replaceWith(commentNode);
        return [commentNode];
    } else if (isArrayOfSupportedValues(value)) {
        const domNodes = [];
        for (const item of value) {
            if (item instanceof HTMLElement || item instanceof Node) {
                domNodes.push(item);
            } else {
                domNodes.push(document.createTextNode(String(item)));
            }
        }
        placeholderNode.replaceWith(...domNodes);
        return domNodes;
    } else if (value instanceof HTMLElement) {
        placeholderNode.replaceWith(value);
        return [value];
    } else if (["string", "number", "boolean"].includes(typeof value)) {
        const textNode = document.createTextNode(String(value));
        placeholderNode.replaceWith(textNode);
        return [textNode];
    } else {
        throw new Error("Unsupported type for template placeholder: " + value);
    }
}

function replacePlaceholderNode(placeholderNode, arg) {
    let elements = [placeholderNode];
    return resolveReactive(arg, (value) => {
        for (let i = 1; i < elements.length; i++) {
            const element = elements[i];
            element.remove();
        }
        elements = replaceStringOrHTMLElement(elements[0], value);
    });
}

function makePlaceholderId(i, instanceId) {
    return `_r_${instanceId}_${i}_`;
}

function findNodeByAttributeValue(fakeParent, placeholder) {
    const elementWalker = document.createTreeWalker(
        fakeParent,
        NodeFilter.SHOW_ELEMENT,
    );
    while (elementWalker.nextNode()) {
        const node = elementWalker.currentNode;
        for (const attributeName of node.getAttributeNames()) {
            const value = node.getAttribute(attributeName);
            if (value.includes(placeholder)) {
                return [node, attributeName];
            }
        }
    }
    return [];
}

function findNodeByAttributeKey(fakeParent, attributeKey) {
    const elementWalker = document.createTreeWalker(
        fakeParent,
        NodeFilter.SHOW_ELEMENT,
    );
    while (elementWalker.nextNode()) {
        const node = elementWalker.currentNode;
        if (node.getAttributeNames().includes(attributeKey)) {
            return node;
        }
    }
    return undefined;
}

function handleClassList(node, arg, placeholder) {
    let currentClass = placeholder;
    return resolveReactive(arg, (value) => {
        if (currentClass) node.classList.remove(currentClass);
        if (value) node.classList.add(value);
        currentClass = value;
    });
}

// this handles the case that the whole attribute including key and value is
// spliced in the template. Inside the placeholder attribute we store the
// actual returned attribute key and be able to update it
function handleDynamicAttribute(node, arg, placeholder) {

    function update(val) {
        const eqIndex = val.indexOf("=");
        let key, value;
        if (eqIndex === -1) {
            key = val;
            value = "";
        } else {
            key = val.slice(0, eqIndex);
            value = val.slice(eqIndex + 1);
            value = value.slice(1, -1);
        }
        const lastKey = node.getAttribute(placeholder);
        if (lastKey && node.hasAttribute(lastKey)) {
            node.removeAttribute(lastKey);
        }
        node.setAttribute(placeholder, key);
        if(key) {
            node.setAttribute(key, value);
        }
    }

    return resolveReactive(arg, (value) => update(value));
}

function handleIfAttribute(node, attributeKey, arg) {

    const nextSiblingHasElseAttribute = node.nextElementSibling?.getAttributeNames().includes("else");
    const placeholderNode = document.createComment(" ❤️ ");
    let nextSibling = node.nextElementSibling;
    const siblingPlaceholder = document.createComment(" ❤️ ");

    if (node.tagName === "HOLD-PASS") {
        const child = node.firstElementChild;
        node.replaceWith(child);
        node = child;
    }
    if (nextSiblingHasElseAttribute && nextSibling.tagName === "HOLD-PASS") {
        const child = nextSibling.firstElementChild;
        nextSibling.replaceWith(child);
        nextSibling = child;
    }

    node.removeAttribute(attributeKey);

    function update(value) {
        if (attributeKey === "if-not") value = !value;
        if (!value) {
            node.replaceWith(placeholderNode);
            if (nextSiblingHasElseAttribute) {
                siblingPlaceholder.replaceWith(nextSibling);
            }
        } else {
            placeholderNode.replaceWith(node);
            if (nextSiblingHasElseAttribute) {
                nextSibling.replaceWith(siblingPlaceholder);
            }
        }
    }

    return resolveReactive(arg, (value) => update(value));
}

function replaceAttributePlaceholder(node, attributeKey, arg, placeholder) {

    // If no attribute key is given, the whole attribute will be replaced
    if(!attributeKey) {
        return handleDynamicAttribute(node, arg, placeholder);
    }

    if (attributeKey === "if" || attributeKey === "if-not") {
        return handleIfAttribute(node, attributeKey, arg);
    }

    if (attributeKey === "class") {
        if (!node.classList.contains(placeholder)) {
            throw new Error("Fatal: Could not find placeholder in class attribute: " + placeholder);
        }
        return handleClassList(node, arg, placeholder);
    }

    if (attributeKey.startsWith("on")) {
        if (typeof arg !== "function") {
            throw new Error("Attribute " + attributeKey + " expects a function, but got: " + arg);
        }
        node.addEventListener(attributeKey.slice(2), arg);
        node.removeAttribute(attributeKey);
        return null;
    }
    const [before, after] = node.getAttribute(attributeKey).split(placeholder);

    if (arg?.isObservable) {
        if (attributeKey === "value") {
            node.addEventListener("input", (event) => arg.value = event.target.value);
        }
        const unsub = arg.subscribe((value) => {
            setNodeAttribute(node, attributeKey, before + value + after);
            placeholder = value;
        });
        return unsub;
    }

    if (typeof arg === "function") {
        const computed = Computed(arg);
        const unsub = computed.subscribe((value) => {
            setNodeAttribute(node, attributeKey, before + value + after);
            placeholder = value;
        });
        return unsub;
    }

    setNodeAttribute(node, attributeKey, before + arg + after);
    return null;
}

function setNodeAttribute(node, attributeKey, value) {
    if (attributeKey === "value") {
        node.value = value;
    } else {
        node.setAttribute(attributeKey, value);
    }

}

function html(templateParts, ...args) {

    const instanceId = id++;
    const htmlPlaceholderIndices = new Set();
    const unsubscribes = [];

    const htmlWithPlaceholders = templateParts.reduce((acc, part, i) => {
        if (i === 0) {
            part = part.trimStart();
        }
        if (i === templateParts.length - 1) {
            part = part.trimEnd();
        }
        if (args[i] === undefined) {
            if (i === templateParts.length - 1) {
                return acc + part;
            }
            args[i] = "";
        }
        const isAttribute = isInsideTag(acc + part);
        if (isAttribute) {
            return acc + part + makePlaceholderId(i, instanceId);
        }
        htmlPlaceholderIndices.add(i);
        return acc + part + `<template id="${makePlaceholderId(i, instanceId)}"></template>`;
    }, "");

    const fakeParent = document.createElement("template");
    fakeParent.innerHTML = htmlWithPlaceholders;

    args.forEach((arg, i) => {
        if (htmlPlaceholderIndices.has(i)) {
            const placeholderNode = fakeParent.content.querySelector("#" + makePlaceholderId(i, instanceId));
            if (!placeholderNode) {
                throw new Error("Fatal: Could not find placeholder for argument: " + i);
            }
            const unsub = replacePlaceholderNode(placeholderNode, arg);
            if (unsub) unsubscribes.push(unsub);
        } else {
            let [node, attributeKey] = findNodeByAttributeValue(fakeParent.content, makePlaceholderId(i, instanceId));

            // Sometimes the attribute key itself is dynamic --> so we need to find the node by the attribute key

            if (!node) {
                node = findNodeByAttributeKey(fakeParent.content, makePlaceholderId(i, instanceId));
                if (!node) {
                    throw new Error("Fatal: Could not find placeholder for argument: " + i + " (" + makePlaceholderId(i, instanceId) + ")");
                }
            }

            if (node.tagName === "HOLD-PASS") {
                setTimeout(() => {
                    const unsub = replaceAttributePlaceholder(node, attributeKey, arg, makePlaceholderId(i, instanceId));
                    if (unsub) unsubscribes.push(unsub);
                });
            }  else {
                const unsub = replaceAttributePlaceholder(node, attributeKey, arg, makePlaceholderId(i, instanceId));
                if (unsub) unsubscribes.push(unsub);
            }
        }
    });

    const result = fakeParent.content.childNodes.length > 1 ? Array.from(fakeParent.content.childNodes) : fakeParent.content.firstChild;

    function dispose() {
        for (const unsub of unsubscribes) {
            if (typeof unsub === "function") unsub();
        }
        unsubscribes.length = 0;
    }

    if (Array.isArray(result)) {
        result.dispose = dispose;
    } else if (result) {
        result.dispose = dispose;
    }

    return result;
}

customElements.define("hold-pass", class extends HTMLElement {
});

module.exports = html;
