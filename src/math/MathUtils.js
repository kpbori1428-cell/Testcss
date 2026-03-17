export class MathUtils {
    static EPSILON = 0.0001;

    static lerp(current, target, smoothing, deltaTime) {
        // Clamp smoothing to [0, 1]
        const safeSmoothing = Math.max(0, Math.min(1, smoothing));

        // Time-independent lerp formula
        const blend = 1 - Math.pow(1 - safeSmoothing, deltaTime * 60);
        const newValue = current + (target - current) * blend;

        if (Math.abs(target - newValue) < this.EPSILON) {
            return target;
        }

        return newValue;
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
}
