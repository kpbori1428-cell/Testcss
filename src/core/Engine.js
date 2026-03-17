import { inputManager } from '../events/InputManager.js';
import { DataLoader } from '../loaders/DataLoader.js';
import { BehaviorManager } from './BehaviorManager.js';
import { sceneManager } from './SceneManager.js';
import { renderer } from '../render/Renderer.js';

class Engine {
    constructor() {
        this.loader = new DataLoader();
    }

    async init(rootId) {
        inputManager.init();
        renderer.init(rootId);
    }

    registerBehavior(name, setupFn) {
        BehaviorManager.register(name, setupFn);
    }

    async loadTemplates(url) {
        const templates = await this.loader.load(url);
        renderer.factory.registerTemplates(templates);
    }

    async loadAndMount(url) {
        const data = await this.loader.load(url);
        await renderer.mount(data);
    }

    async transitionTo(url) {
        return await sceneManager.transitionTo(url);
    }
}

export const engine = new Engine();
