export class Ticker {
    constructor() {
        if (Ticker.instance) return Ticker.instance;
        this.isRunning = false;
        this.lastTime = 0;
        this.elapsedTime = 0;
        this.activeNodes = new Set();
        this.callbacks = new Set();
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

        // Calculate delta time in seconds, capped to avoid large jumps
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        this.elapsedTime += deltaTime;

        // Execute global callbacks
        this.callbacks.forEach(callback => callback(deltaTime));

        // Update nodes and remove those that report being asleep
        this.activeNodes.forEach(node => {
            const isStillAwake = node.update(deltaTime);
            if (!isStillAwake) {
                this.activeNodes.delete(node);
            }
        });

        requestAnimationFrame((time) => this._tick(time));
    }

    addNode(node) {
        this.activeNodes.add(node);
    }

    removeNode(node) {
        this.activeNodes.delete(node);
    }

    addCallback(callback) {
        this.callbacks.add(callback);
    }

    removeCallback(callback) {
        this.callbacks.delete(callback);
    }
}

export const ticker = new Ticker();
