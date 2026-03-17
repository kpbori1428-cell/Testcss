export class Ticker {
    constructor() { if (Ticker.instance) return Ticker.instance; this.isRunning = false; this.lastTime = 0; this.elapsedTime = 0; this.activeNodes = new Set(); this.callbacks = new Set(); Ticker.instance = this; }
    start() { if (this.isRunning) return; this.isRunning = true; this.lastTime = performance.now(); this._tick(this.lastTime); }
    stop() { this.isRunning = false; }
    _tick(t) {
        if (!this.isRunning) return;
        const dt = Math.min((t - this.lastTime) / 1000, 0.1);
        this.lastTime = t; this.elapsedTime += dt;
        this.callbacks.forEach(cb => cb(dt));
        this.activeNodes.forEach(n => n.update(dt) || this.activeNodes.delete(n));
        requestAnimationFrame(time => this._tick(time));
    }
    addNode(n) { this.activeNodes.add(n); }
    removeNode(n) { this.activeNodes.delete(n); }
    addCallback(cb) { this.callbacks.add(cb); }
    removeCallback(cb) { this.callbacks.delete(cb); }
}
export const ticker = new Ticker();
