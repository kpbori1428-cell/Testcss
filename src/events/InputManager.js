import { telemetry } from './TelemetryBus.js';
class InputManager {
    constructor() { if (InputManager.instance) return InputManager.instance; this.state = { pointer: { x: 0, y: 0, normalX: 0, normalY: 0 }, scroll: { y: 0, normalY: 0 } }; InputManager.instance = this; }
    init() {
        window.addEventListener('mousemove', e => this.normalize(e.clientX, e.clientY), { passive: true });
        window.addEventListener('touchmove', e => e.touches.length && this.normalize(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
        this.width = window.innerWidth; this.height = window.innerHeight;
    }
    normalize(x, y) {
        this.state.pointer = { x, y, normalX: (x / this.width) * 2 - 1, normalY: -((y / this.height) * 2 - 1) };
        telemetry.publish('input:pointer', this.state.pointer);
    }
    getState() { return this.state; }
}
export const inputManager = new InputManager();
