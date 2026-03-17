import { inputManager } from '../events/InputManager.js';
import { DataLoader } from '../loaders/DataLoader.js';
import { BehaviorManager } from './BehaviorManager.js';
import { sceneManager } from './SceneManager.js';
import { renderer } from '../render/Renderer.js';
class Engine {
    constructor() { this.loader = new DataLoader(); }
    async init(id) { inputManager.init(); renderer.init(id); }
    registerBehavior(n, s) { BehaviorManager.register(n, s); }
    async loadTemplates(url) { const ts = await this.loader.load(url); renderer.factory.registerTemplates(ts); }
    async loadAndMount(url) { const d = await this.loader.load(url); renderer.mount(d); }
    async transitionTo(url) { return sceneManager.transitionTo(url); }
}
export const engine = new Engine();
