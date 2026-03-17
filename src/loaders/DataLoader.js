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
            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.statusText}`);
            }
            const data = await response.json();
            this.cache.set(url, data);
            return data;
        } catch (error) {
            console.error('[DataLoader] Error fetching JSON:', error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}
