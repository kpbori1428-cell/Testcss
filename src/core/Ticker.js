import { MathUtils } from '../math/MathUtils.js';

export class Ticker {
    constructor() {
        if (Ticker.instance) {
            return Ticker.instance;
        }

        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;

        // Set of nodes that need updates
        this.activeNodes = new Set();

        // Optional global update callbacks
        this.updateCallbacks = new Set();

        Ticker.instance = this;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this._tick(this.lastTime);
    }

    stop() {
        this.isRunning = false;
    }

    _tick(currentTime) {
        if (!this.isRunning) return;

        // Calculate DeltaTime in seconds
        this.deltaTime = (currentTime - this.lastTime) / 1000;

        // Prevent huge jumps if the tab was inactive (cap at 0.1s)
        if (this.deltaTime > 0.1) {
            this.deltaTime = 0.016; // Assume ~60fps
        }

        this.lastTime = currentTime;

        // Execute global callbacks
        for (const callback of this.updateCallbacks) {
            callback(this.deltaTime);
        }

        // Process node updates
        for (const node of this.activeNodes) {
            this._updateNode(node);
        }

        requestAnimationFrame((time) => this._tick(time));
    }

    addNode(node) {
        this.activeNodes.add(node);
    }

    removeNode(node) {
        this.activeNodes.delete(node);
    }

    addCallback(callback) {
        this.updateCallbacks.add(callback);
    }

    removeCallback(callback) {
        this.updateCallbacks.delete(callback);
    }

    _updateNode(node) {
        // Placeholder for node update logic.
        // This is where we will apply Lerp and Logical Culling.
        // The Renderer will hook into this.
        if (node.update) {
            const isAwake = node.update(this.deltaTime);
            if (!isAwake) {
                // Logical Culling: Sleep Mode
                this.removeNode(node);
            }
        }
    }
}

export const ticker = new Ticker();
