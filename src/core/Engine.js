import { inputManager } from '../events/InputManager.js';
import { renderer } from '../render/Renderer.js';
import { sceneManager } from './SceneManager.js';
import { themeManager } from './ThemeManager.js';
import { influenceManager } from './InfluenceManager.js';
import { DataLoader } from '../loaders/DataLoader.js';

class Engine {
    constructor() {
        this.loader = new DataLoader();
    }

    async init(rootElementId) {
        inputManager.init();
        renderer.init(rootElementId);

        // Activar rastro del ratón en el InfluenceManager
        window.addEventListener('mousemove', (e) => {
            const pointer = inputManager.getState().pointer;
            // Convertir normalX/Y (-1,1) a píxeles aproximados para el sistema de fuerza
            influenceManager.setPoint('mouse', {
                x: pointer.normalX * (window.innerWidth / 2),
                y: -pointer.normalY * (window.innerHeight / 2),
                z: 0,
                radius: 300,
                force: 150,
                type: 'repel'
            });
        });
    }

    async loadTemplates(url) {
        const templates = await this.loader.load(url);
        renderer.factory.registerTemplates(templates);
    }

    async loadAndMount(url) {
        const data = await this.loader.load(url);
        renderer.mount(data);
    }

    async transitionTo(url) {
        return await sceneManager.transitionTo(url);
    }

    applyTheme(themeName) {
        themeManager.apply(themeName);
    }
}
export const engine = new Engine();
