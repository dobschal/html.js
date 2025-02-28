const {Computed} = require("@dobschal/observable");

let id = 0;

function convertStringToDomNodes(htmlString) {
    const fakeParent = document.createElement("div");
    fakeParent.innerHTML = htmlString;
    return Array.from(fakeParent.childNodes);
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
                domNodes.push(...convertStringToDomNodes(item));
            }
        }
        placeholderNode.replaceWith(...domNodes);
        return domNodes;
    } else if (value instanceof HTMLElement) {
        placeholderNode.replaceWith(value);
        return [value];
    } else if (["string", "number", "boolean"].includes(typeof value)) {
        const domNodes = convertStringToDomNodes(value);
        placeholderNode.replaceWith(...domNodes);
        return domNodes;
    } else {
        throw new Error("Unsupported type for template placeholder: " + value);
    }
}

function replacePlaceholderNode(placeholderNode, arg) {
    if (arg?.isObservable) {
        let elements = [placeholderNode];
        arg.subscribe((value) => {
            for (let i = 1; i < elements.length; i++) {
                const element = elements[i];
                element.remove();
            }
            elements = replaceStringOrHTMLElement(elements[0], value);
        });
        return;
    }
    if (typeof arg === "function") {
        const computed = Computed(arg);
        let elements = [placeholderNode];
        computed.subscribe((value) => {
            for (let i = 1; i < elements.length; i++) {
                const element = elements[i];
                element.remove();
            }
            elements = replaceStringOrHTMLElement(elements[0], value);
        });
        return;
    }
    replaceStringOrHTMLElement(placeholderNode, arg);
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

function handleClassList(node, arg, placeholder) {
    if (arg?.isObservable) {
        let currentClass = placeholder;
        arg.subscribe((value) => {
            if (currentClass) node.classList.remove(currentClass);
            if (value) node.classList.add(value);
            currentClass = value;
        });
        return;
    }
    if (typeof arg === "function") {
        const computed = Computed(arg);
        let currentClass = placeholder;
        computed.subscribe((value) => {
            if (currentClass) node.classList.remove(currentClass);
            if (value) node.classList.add(value);
            currentClass = value;
        });
        return;
    }
    node.classList.add(arg);
    node.classList.remove(placeholder);
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

    if (arg?.isObservable) {
        arg.subscribe((value) => update(value));
        return;
    }

    if (typeof arg === "function") {
        const computed = Computed(arg);
        computed.subscribe((value) => update(value));
        return;
    }

    update(arg);
}

function replaceAttributePlaceholder(node, attributeKey, arg, placeholder) {

    if (attributeKey === "if") {
        handleIfAttribute(node, attributeKey, arg);
        return;
    }

    if (attributeKey === "if-not") {
        handleIfAttribute(node, attributeKey, arg);
        return;
    }

    if (attributeKey === "class") {
        if (!node.classList.contains(placeholder)) {
            throw new Error("Fatal: Could not find placeholder in class attribute: " + placeholder);
        }
        handleClassList(node, arg, placeholder);
        return;
    }

    if (attributeKey.startsWith("on")) {
        if (typeof arg !== "function") {
            throw new Error("Attribute " + attributeKey + " expects a function, but got: " + arg);
        }
        node.addEventListener(attributeKey.slice(2), arg);
        node.removeAttribute(attributeKey);
        return;
    }
    const [before, after] = node.getAttribute(attributeKey).split(placeholder);

    if (arg?.isObservable) {
        if (attributeKey === "value") {
            node.addEventListener("input", (event) => arg.value = event.target.value);
        }
        arg.subscribe((value) => {
            setNodeAttribute(node, attributeKey, before + value + after);
            placeholder = value;
        });
        return;
    }

    if (typeof arg === "function") {
        const computed = Computed(arg);
        computed.subscribe((value) => {
            setNodeAttribute(node, attributeKey, before + value + after);
            placeholder = value;
        });
        return;
    }

    setNodeAttribute(node, attributeKey, before + arg + after);
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

    const htmlWithPlaceholders = templateParts.reduce((acc, part, i) => {
        if (i === 0) {
            part = part.trimStart();
        }
        if (i === templateParts.length - 1) {
            part = part.trimEnd();
        }
        if (args[i] === undefined) {
            return acc + part;
        }
        const amountCloseTags = ((acc + part).match(/>/g) || []).length;
        const amountOpenTags = ((acc + part).match(/</g) || []).length;
        const isAttribute = amountCloseTags !== amountOpenTags;
        if (isAttribute) {
            return acc + part + makePlaceholderId(i, instanceId);
        }
        htmlPlaceholderIndices.add(i);
        return acc + part + `<template id="${makePlaceholderId(i, instanceId)}"></template>`;
    }, "");

    const fakeParent = document.createElement("div");
    fakeParent.innerHTML = htmlWithPlaceholders;

    args.forEach((arg, i) => {
        if (htmlPlaceholderIndices.has(i)) {
            const placeholderNode = fakeParent.querySelector("#" + makePlaceholderId(i, instanceId));
            if (!placeholderNode) {
                throw new Error("Fatal: Could not find placeholder for argument: " + i);
            }
            replacePlaceholderNode(placeholderNode, arg);
        } else {
            const [node, attributeKey] = findNodeByAttributeValue(fakeParent, makePlaceholderId(i, instanceId));
            if (!node) {
                throw new Error("Fatal: Could not find placeholder for argument: " + i);
            }

            if (node.tagName === "HOLD-PASS") {
                setTimeout(() => replaceAttributePlaceholder(node, attributeKey, arg, makePlaceholderId(i, instanceId)));
            } else {
                replaceAttributePlaceholder(node, attributeKey, arg, makePlaceholderId(i, instanceId));
            }
        }
    });

    return fakeParent.childNodes.length > 1 ? Array.from(fakeParent.childNodes) : fakeParent.firstChild;
}

customElements.define("hold-pass", class extends HTMLElement {
});

module.exports = html;
