import { renderer } from '../render/Renderer.js';
import { DataLoader } from '../loaders/DataLoader.js';
import { telemetry } from '../events/TelemetryBus.js';
export class SceneManager {
    constructor() { this.loader = new DataLoader(); this.current = null; this.busy = false; }
    async transitionTo(url) {
        if (this.busy || this.current === url) return; this.busy = true;
        telemetry.publish('scene:transition:start', { to: url });
        const data = await this.loader.load(url);
        await new Promise(r => requestAnimationFrame(r));
        renderer.dispose(); renderer.mount(data);
        this.current = url; this.busy = false;
        telemetry.publish('scene:transition:complete', { url });
    }
}
export const sceneManager = new SceneManager();
