import './style.css';
import { find } from './modules/util';
import { init } from './renderer';

let canvas: HTMLCanvasElement;

document.addEventListener('DOMContentLoaded', () => {
    canvas = find('canvas') as HTMLCanvasElement;
    resizeCanvas();

    init(canvas, window);
});

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}