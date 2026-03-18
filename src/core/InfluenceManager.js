/**
 * InfluenceManager
 * Centraliza los "puntos de fuerza" en el espacio 3D (ratón, pulsos, explosiones).
 * Permite que cualquier nodo reaccione basado en su proximidad a estos puntos.
 */
class InfluenceManager {
    constructor() {
        this.points = new Map();
    }

    /**
     * Actualiza o añade un punto de influencia.
     * @param {string} id - Identificador único (ej: 'mouse')
     * @param {object} data - { x, y, z, radius, force, type: 'repel'|'attract'|'pulse' }
     */
    setPoint(id, data) {
        this.points.set(id, data);
    }

    removePoint(id) {
        this.points.delete(id);
    }

    /**
     * Calcula la influencia total en una posición específica.
     * @returns {object} { vx, vy, vz, totalIntensity }
     */
    getInfluenceAt(x, y, z) {
        let vx = 0, vy = 0, vz = 0;
        let totalIntensity = 0;

        for (const p of this.points.values()) {
            const dx = x - p.x;
            const dy = y - p.y;
            const dz = z - (p.z || 0);
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < p.radius) {
                const normalizedDist = 1 - (distance / p.radius);
                const intensity = normalizedDist * (p.force || 1);

                // Dirección del vector
                const nx = dx / (distance || 1);
                const ny = dy / (distance || 1);
                const nz = dz / (distance || 1);

                if (p.type === 'repel') {
                    vx += nx * intensity;
                    vy += ny * intensity;
                    vz += nz * intensity;
                } else if (p.type === 'attract') {
                    vx -= nx * intensity;
                    vy -= ny * intensity;
                    vz -= nz * intensity;
                }

                totalIntensity += intensity;
            }
        }

        return { vx, vy, vz, intensity: totalIntensity };
    }
}

export const influenceManager = new InfluenceManager();
