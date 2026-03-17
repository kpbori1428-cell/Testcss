import { RenderNode } from './RenderNode.js';
import { NodeFactory } from '../core/NodeFactory.js';
import { ticker } from '../core/Ticker.js';
export class Renderer {
    constructor() { if (Renderer.instance) return Renderer.instance; this.factory = new NodeFactory(); this.nodes = new Map(); Renderer.instance = this; }
    init(id) { this.root = document.getElementById(id); ticker.start(); }
    mount(d) { ticker.start(); const ri = this.factory.createNode(d, 'app', 0); this.build(ri, this.root, 0); }
    build(n, pe, dp) {
        if (dp > 32) return;
        const rn = new RenderNode(n, pe, dp, this.factory); this.nodes.set(n.path, rn);
        if (n.childrenData) n.childrenData.forEach(c => this.build(c, rn.element, dp + 1));
    }
    dispose() { this.nodes.forEach(n => n.unmount()); this.nodes.clear(); this.factory.nodes.clear(); ticker.stop(); }
}
export const renderer = new Renderer();
