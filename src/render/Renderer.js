import { RenderNode } from './RenderNode.js';
import { NodeFactory } from '../core/NodeFactory.js';
import { ticker } from '../core/Ticker.js';

export class Renderer {
    constructor() {
        if (Renderer.instance) return Renderer.instance;
        this.factory = new NodeFactory();
        this.nodes = new Map();
        this.pool = [];
        Renderer.instance = this;
    }

    init(rootId) {
        this.rootElement = document.getElementById(rootId);
        ticker.start();
    }

    async mount(sceneData) {
        ticker.start();
        const rootNodeInterface = await this.factory.createNode(sceneData, 'app', 0);
        this.buildTree(rootNodeInterface, this.rootElement, 0);
    }

    buildTree(nodeInterface, parentElement, depth) {
        if (depth > 32) return;

        let renderNode;
        if (this.pool.length > 0) {
            renderNode = this.pool.pop();
            renderNode.reuse(nodeInterface, parentElement, depth);
        } else {
            renderNode = new RenderNode(nodeInterface, parentElement, depth, this.factory);
        }

        this.nodes.set(nodeInterface.path, renderNode);

        if (nodeInterface.childrenData) {
            nodeInterface.childrenData.forEach(child => {
                this.buildTree(child, renderNode.element, depth + 1);
            });
        }
    }

    dispose() {
        this.nodes.forEach(node => {
            node.unmount();
            this.pool.push(node);
        });
        this.nodes.clear();
        this.factory.nodes.clear();
        ticker.stop();
    }
}

export const renderer = new Renderer();
