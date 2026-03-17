export class MathUtils {
    static EPSILON = 0.0001;

    /**
     * Fórmula Lerp: Actual = Actual + (Objetivo - Actual) * (1 - Potencia(1 - Suavizado, DeltaTime))
     * Normalizada al DeltaTime en segundos.
     * Suavizado (Smoothing): Valor entre 0 y 1 (cercano a 1 es más rápido, ej. 0.9).
     */
    static lerp(current, target, smoothing, deltaTime) {
        // Prevent overshoot or negative smoothing
        smoothing = Math.max(0, Math.min(1, smoothing));

        // 1 - Math.pow(1 - smoothing, deltaTime * 60)
        // We multiply deltaTime by 60 because typical smoothing values are tuned for 60fps.
        // This ensures consistent behavior regardless of actual framerate.
        const blend = 1 - Math.pow(1 - smoothing, deltaTime * 60);

        const newValue = current + (target - current) * blend;

        // Culling Lógico: Si la diferencia absoluta es menor al umbral (Epsilon), devolvemos el Objetivo
        if (Math.abs(target - newValue) < this.EPSILON) {
            return target;
        }

        return newValue;
    }

    /**
     * Clamp a value between a minimum and a maximum.
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Map a value from one range to another.
     */
    static map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
}
