const elementsWithClickOutListener: HTMLElement[] = [];
const clickOut = new Event("clickout");

export function addClickOutListener(element: HTMLElement) {
    if(elementsWithClickOutListener.length == 0)
        window.addEventListener('click', onClickOut);

    elementsWithClickOutListener.push(element);
    onRemove(element, () => {
        elementsWithClickOutListener.splice(elementsWithClickOutListener.indexOf(element), 1);

        if(elementsWithClickOutListener.length == 0)
            window.removeEventListener('click', onClickOut);
    })
}

function onClickOut(event: any) {
    elementsWithClickOutListener.forEach(element => {
        if (!element.contains(event.target))
            element.dispatchEvent(clickOut);
    })
}

const observer = new MutationObserver(checkRemovedElements);
const elementsWithRemoveCallback: { [id: string]: () => void } = {};
let elementsWithRemoveCallback_topId = 0;

export function onRemove(element: HTMLElement, callback: () => void) {
    if (elementsWithRemoveCallback_topId == 0)
        observer.observe(document.body, { childList: true });

    elementsWithRemoveCallback_topId++;
    const id = elementsWithRemoveCallback_topId;

    element.dataset.removecallbackid = id.toString();
    elementsWithRemoveCallback[id] = callback;
}

function checkRemovedElements(mutations: MutationRecord[]) {
    mutations.forEach(mutation => {
        if (mutation.type != 'childList' || mutation.removedNodes.length == 0)
            return;

        const element = mutation.removedNodes[0] as HTMLElement; // this isn't sure, just to make Typescript typechecking shutup
        if (!element.dataset || !element.dataset.removecallbackid) // the first check is in case the elment isnt an HTMLElement
            return;

        const id = parseInt(element.dataset.removecallbackid);
        elementsWithRemoveCallback[id]();
        delete elementsWithRemoveCallback[id];

        if (Object.keys(elementsWithRemoveCallback).length == 0) {
            elementsWithRemoveCallback_topId = 0;
            observer.disconnect();
        }
    })
}