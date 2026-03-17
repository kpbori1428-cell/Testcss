class TelemetryBus {
    constructor() { if (TelemetryBus.instance) return TelemetryBus.instance; this.listeners = new Map(); TelemetryBus.instance = this; }
    subscribe(event, cb) { if (!this.listeners.has(event)) this.listeners.set(event, new Set()); this.listeners.get(event).add(cb); }
    unsubscribe(event, cb) { if (this.listeners.has(event)) this.listeners.get(event).delete(cb); }
    publish(event, data) { if (this.listeners.has(event)) this.listeners.get(event).forEach(cb => { try { cb(data); } catch (e) {} }); }
}
export const telemetry = new TelemetryBus();
