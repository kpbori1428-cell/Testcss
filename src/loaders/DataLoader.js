export class DataLoader {
    constructor() {
        this.cache = new Map();
    }

    async load(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            this.cache.set(url, data);
            return data;
        } catch (error) {
            console.error(`[DataLoader] Failed to load ${url}:`, error);
            throw error;
        }
    }
}
