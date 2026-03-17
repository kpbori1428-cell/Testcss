import { telemetry } from './TelemetryBus.js';

class InputManager {
    constructor() {
        if (InputManager.instance) return InputManager.instance;
        this.state = {
            pointer: { x: 0, y: 0, normalX: 0, normalY: 0 },
            scroll: { y: 0, normalY: 0 }
        };
        InputManager.instance = this;
    }

    init() {
        window.addEventListener('mousemove', (event) => this.handlePointer(event.clientX, event.clientY), { passive: true });
        window.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                this.handlePointer(event.touches[0].clientX, event.touches[0].clientY);
            }
        }, { passive: true });

        this.updateDimensions();
        window.addEventListener('resize', () => this.updateDimensions());
    }

    updateDimensions() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    handlePointer(clientX, clientY) {
        this.state.pointer = {
            x: clientX,
            y: clientY,
            normalX: (clientX / this.width) * 2 - 1,
            normalY: -((clientY / this.height) * 2 - 1)
        };
        telemetry.publish('input:pointer', this.state.pointer);
    }

    getState() {
        return this.state;
    }
}

export const inputManager = new InputManager();
