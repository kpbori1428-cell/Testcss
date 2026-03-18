class TelemetryBus {
    constructor() {
        if (TelemetryBus.instance) {
            return TelemetryBus.instance;
        }
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
            if (this.listeners.get(event).size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    publish(event, data) {
        if (this.listeners.has(event)) {
            for (const callback of this.listeners.get(event)) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[TelemetryBus] Error in listener for event ${event}:`, error);
                }
            }
        }
    }

    purgeInstruction(path) {
        // Find and remove any listeners associated with a specific node path
        for (const [event, callbacks] of this.listeners.entries()) {
            if (event.startsWith(path + ':')) {
                this.listeners.delete(event);
            }
        }
    }
}

export const telemetry = new TelemetryBus();
