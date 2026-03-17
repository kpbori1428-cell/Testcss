import { renderer } from '../render/Renderer.js';
import { DataLoader } from '../loaders/DataLoader.js';
import { telemetry } from '../events/TelemetryBus.js';

export class SceneManager {
    constructor() {
        this.loader = new DataLoader();
        this.currentUrl = null;
        this.isBusy = false;
    }

    async transitionTo(url) {
        if (this.isBusy || this.currentUrl === url) return;
        this.isBusy = true;

        telemetry.publish('scene:transition:start', { to: url });

        try {
            const data = await this.loader.load(url);
            await new Promise(resolve => requestAnimationFrame(resolve));

            renderer.dispose();
            await renderer.mount(data);

            this.currentUrl = url;
            telemetry.publish('scene:transition:complete', { url });
        } catch (error) {
            console.error("[SceneManager] Transition error:", error);
        } finally {
            this.isBusy = false;
        }
    }
}

export const sceneManager = new SceneManager();
