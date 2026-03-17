class TelemetryBus {
    constructor() {
        if (TelemetryBus.instance) return TelemetryBus.instance;
        this.listeners = new Map();
        TelemetryBus.instance = this;
    }

    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    unsubscribe(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    publish(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[TelemetryBus] Error in event ${event}:`, error);
                }
            });
        }
    }
}

export const telemetry = new TelemetryBus();
