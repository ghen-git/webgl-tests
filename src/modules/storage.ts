import { onRemove } from "./domInteractions";

const storage: { [id: string]: { [id: string]: any } } = {};
let topId = 0;

export function getStorage(element: HTMLElement) {
    if (!element.dataset.graphicstorageid)
        createStorage(element);

    const id = parseInt(element.dataset.graphicstorageid!);
    return storage[id];
}

export function createStorage(element: HTMLElement) {
    topId++;
    const id = topId;
    element.dataset.graphicstorageid = id.toString();

    onRemove(element, () => {
        delete storage[id];
        delete element.dataset.graphicstorageid;

        if (Object.keys(storage).length == 0)
            topId = 0;
    })

    storage[id] = {};
}