import { inputManager } from '../events/InputManager.js';
import { telemetry } from '../events/TelemetryBus.js';

import { renderer } from '../render/Renderer.js';

class Engine {
    constructor() {
    }

    async init(rootElementId) {
        inputManager.init();
        renderer.init(rootElementId);
    }

    async loadAndMount(url) {
        // ... load JSON, parse, render loop
        // to be implemented with DataLoader
    }
}
export const engine = new Engine();
