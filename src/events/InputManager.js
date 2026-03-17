import { telemetry } from './TelemetryBus.js';

class InputManager {
    constructor() {
        if (InputManager.instance) {
            return InputManager.instance;
        }

        this.state = {
            pointer: { x: 0, y: 0, normalX: 0, normalY: 0 },
            scroll: { y: 0, normalY: 0 },
            isTouch: false
        };

        this.initialized = false;
        InputManager.instance = this;
    }

    init() {
        if (this.initialized) return;

        window.addEventListener('mousemove', this.handlePointerMove.bind(this), { passive: true });
        window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        window.addEventListener('resize', this.handleResize.bind(this), { passive: true });

        this.updateDimensions();
        this.initialized = true;
    }

    updateDimensions() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    handleResize() {
        this.updateDimensions();
        this.normalizePointer(this.state.pointer.x, this.state.pointer.y);
    }

    handlePointerMove(e) {
        this.state.isTouch = false;
        this.normalizePointer(e.clientX, e.clientY);
        telemetry.publish('input:pointer', this.state.pointer);
    }

    handleTouchMove(e) {
        if (e.touches.length > 0) {
            this.state.isTouch = true;
            this.normalizePointer(e.touches[0].clientX, e.touches[0].clientY);
            telemetry.publish('input:pointer', this.state.pointer);
        }
    }

    handleScroll() {
        this.state.scroll.y = window.scrollY;
        // Scroll normalization depends on document height vs window height
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.state.scroll.normalY = maxScroll > 0 ? (window.scrollY / maxScroll) * 2 - 1 : 0; // -1 to 1 mapping if needed, or 0 to 1. Using -1 to 1 for consistency.

        telemetry.publish('input:scroll', this.state.scroll);
    }

    normalizePointer(clientX, clientY) {
        this.state.pointer.x = clientX;
        this.state.pointer.y = clientY;

        // Convert to range [-1, 1] where 0,0 is center of screen
        this.state.pointer.normalX = (clientX / this.width) * 2 - 1;
        this.state.pointer.normalY = -((clientY / this.height) * 2 - 1); // Invert Y so up is positive
    }

    getState() {
        return this.state;
    }

    dispose() {
        window.removeEventListener('mousemove', this.handlePointerMove);
        window.removeEventListener('touchmove', this.handleTouchMove);
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        this.initialized = false;
    }
}

export const inputManager = new InputManager();
