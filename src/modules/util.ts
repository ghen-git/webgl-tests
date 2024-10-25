export function stringToHTML(htmlString: string) {
    const template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    const element = template.content.firstElementChild!;

    return element! as HTMLElement;
}

export function toggleCheck(el: HTMLElement) {
    el.classList.toggle("checked");
}

export function find(selector: string, parent?: HTMLElement) {
    if (parent !== undefined)
        return parent.querySelector(selector);

    return document.querySelector(selector);
}

export function removeParent(element: HTMLElement, depth: number) {
    while (depth > 0) {
        element = element.parentElement!;
        depth--;
    }

    element.remove();
}

export function elementIsVisibleInViewport(el: HTMLElement) {
    const { top, left, bottom, right } = el.getBoundingClientRect();
    const { innerHeight, innerWidth } = window;
    return top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth;
};

export function objectDeepEqual(obj1: any, obj2: any) {
    if (obj1 === obj2)
        return true;

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null)
        return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length != keys2.length)
        return false;

    for (let key of keys1)
        if (!keys2.includes(key) || !objectDeepEqual(obj1[key], obj2[key]))
            return false;

    return true;
}

interface PositionLink {
    anchor: HTMLElement,
    floater: HTMLElement,
    offset: { x: number, y: number },
    overflow: boolean
}

const elemLinksByPos: PositionLink[] = [];

export function linkPosition(anchor: HTMLElement, floater: HTMLElement, offset?: { x: number, y: number }, overflow?: boolean) {
    floater.style.position = 'fixed';

    elemLinksByPos.push({
        anchor: anchor,
        floater: floater,
        offset: offset !== undefined ? offset : { x: 0, y: 0 },
        overflow: overflow !== undefined ? overflow : true
    })
}

export function getFloater(anchor: HTMLElement) {
    const link = getLink(anchor);

    if (link === undefined)
        return;

    return link.floater;
}

export function getLink(anchor: HTMLElement) {
    return elemLinksByPos.find(link => link.anchor == anchor);
}

export function unlinkPositionByAnchor(anchor: HTMLElement) {
    const index = elemLinksByPos.findIndex(link => link.anchor == anchor);
    elemLinksByPos.splice(index, 1);
}

export function unlinkPositionByFloater(floater: HTMLElement) {
    const index = elemLinksByPos.findIndex(link => link.floater == floater);
    elemLinksByPos.splice(index, 1);
}

window.addEventListener('DOMContentLoaded', () => requestAnimationFrame(refreshLinks))

function refreshLinks() {
    for (const link of elemLinksByPos) {
        const anchorRect = link.anchor.getBoundingClientRect();
        const floaterRect = link.floater.getBoundingClientRect();
        let x = anchorRect.x + link.offset.x;
        let y = anchorRect.y + link.offset.y;

        if (!link.overflow) {
            const { innerHeight, innerWidth } = window;
            if (x + floaterRect.width > innerWidth)
                x -= x + floaterRect.width - innerWidth;
            if (y + floaterRect.height > innerHeight)
                y -= y + floaterRect.height - innerHeight;
            if (x < 0)
                x = 0;
            if (y < 0)
                y = 0;
        }

        link.floater.style.left = `${x}px`;
        link.floater.style.top = `${y}px`;
    }

    requestAnimationFrame(refreshLinks);
}

export function addKeyListener(element: HTMLElement, key: string, callback: () => void, cancelEvent?: boolean) {
    const eventCallback = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() !== key.toLowerCase())
            return;

        callback();
        if (cancelEvent)
            e.preventDefault();
    };

    if (key.toLowerCase() == 'tab') {
        element.addEventListener('keydown', eventCallback)
        return;
    }

    element.addEventListener('keyup', eventCallback)
}

export function approx(n: number, digits: number) {
    return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits);
}