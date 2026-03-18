import { DataLoader } from '../loaders/DataLoader.js';
import { renderer } from '../render/Renderer.js';

class SceneManager {
    constructor() {
        this.loader = new DataLoader();
        this.currentSceneUrl = null;
    }

    async transitionTo(url) {
        console.log(`[SceneManager] Transicionando a: ${url}`);

        // 1. Limpieza de escena actual
        renderer.dispose();

        // 2. Carga de nueva escena
        try {
            const data = await this.loader.load(url);
            this.currentSceneUrl = url;

            // 3. Montar nueva escena
            renderer.mount(data);
            return true;
        } catch (error) {
            console.error(`[SceneManager] Error en la transición:`, error);
            return false;
        }
    }
}

export const sceneManager = new SceneManager();
