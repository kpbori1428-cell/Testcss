import { RenderNode } from './RenderNode.js';
import { NodeFactory } from '../core/NodeFactory.js';
import { ticker } from '../core/Ticker.js';

export class Renderer {
    constructor() {
        if (Renderer.instance) {
            return Renderer.instance;
        }

        this.factory = new NodeFactory();
        this.renderNodes = new Map(); // Map of path to RenderNode instance
        this.pool = []; // Object Pooling: Reuse DOM elements
        this.rootElement = null;

        Renderer.instance = this;
    }

    init(rootElementId) {
        this.rootElement = document.getElementById(rootElementId);
        if (!this.rootElement) {
            throw new Error(`[Renderer] Mount point #${rootElementId} not found`);
        }

        // Start the physics ticker
        ticker.start();
    }

    mount(treeData) {
        // 1. Process data through Factory to handle procedural cloning, paths, etc.
        const result = this.factory.createNode(treeData, 'app', 0);

        // 2. Recursively build RenderNodes (handle array at root)
        if (Array.isArray(result)) {
            result.forEach(nodeInterface => this.buildTree(nodeInterface, this.rootElement, 0));
        } else {
            this.buildTree(result, this.rootElement, 0);
        }
    }

    buildTree(nodeInterface, parentElement, depth) {
        if (depth > 32) {
            console.warn(`[Renderer] Profundidad excedida en el nodo: ${nodeInterface.id}. Se detiene la renderización de los hijos.`);
            return;
        }

        // Intentar obtener un nodo del pool
        let renderNode;
        if (this.pool.length > 0) {
            renderNode = this.pool.pop();
            renderNode.reset(nodeInterface, parentElement, depth);
        } else {
            renderNode = new RenderNode(nodeInterface, parentElement, depth, this.factory);
        }

        this.renderNodes.set(nodeInterface.path, renderNode);

        // Recursively build children
        if (nodeInterface.childrenData && nodeInterface.childrenData.length > 0) {
            for (const childNodeInterface of nodeInterface.childrenData) {
                this.buildTree(childNodeInterface, renderNode.element, depth + 1);
            }
        }
    }

    updateNode(path, partialData) {
        const renderNode = this.renderNodes.get(path);
        if (renderNode) {
            renderNode.patch(partialData);
        } else {
            console.warn(`[Renderer] No se encontró el nodo con path: ${path} para actualizar.`);
        }
    }

    unmountNode(path) {
        const renderNode = this.renderNodes.get(path);
        if (renderNode) {
            this.recursiveUnmount(renderNode);
        }
    }

    recursiveUnmount(renderNode) {
        // Unmount children first
        if (renderNode.data.childrenData) {
             for (const child of renderNode.data.childrenData) {
                 const childPath = child.path;
                 const childRenderNode = this.renderNodes.get(childPath);
                 if (childRenderNode) {
                     this.recursiveUnmount(childRenderNode);
                 }
             }
        }

        // Unmount self
        renderNode.unmount();
        this.renderNodes.delete(renderNode.data.path);

        // Add to pool
        this.pool.push(renderNode);

        // Remove from Factory as well
        this.factory.nodes.delete(renderNode.data.path);
    }

    dispose() {
        // Unmount everything
        for (const renderNode of this.renderNodes.values()) {
            renderNode.unmount();
        }
        this.renderNodes.clear();
        this.factory.clear();
        ticker.stop();
    }
}

export const renderer = new Renderer();
