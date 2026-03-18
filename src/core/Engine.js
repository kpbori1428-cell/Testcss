import { inputManager } from '../events/InputManager.js';
import { renderer } from '../render/Renderer.js';
import { sceneManager } from './SceneManager.js';
import { themeManager } from './ThemeManager.js';
import { DataLoader } from '../loaders/DataLoader.js';

class Engine {
    constructor() {
        this.loader = new DataLoader();
    }

    async init(rootElementId) {
        inputManager.init();
        renderer.init(rootElementId);
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
