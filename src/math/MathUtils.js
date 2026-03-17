export class MathUtils {
    static EPSILON = 0.0001;
    static lerp(current, target, smoothing, deltaTime) {
        smoothing = Math.max(0, Math.min(1, smoothing));
        const blend = 1 - Math.pow(1 - smoothing, deltaTime * 60);
        const newValue = current + (target - current) * blend;
        if (Math.abs(target - newValue) < this.EPSILON) return target;
        return newValue;
    }
    static clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    static map(value, inMin, inMax, outMin, outMax) { return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin; }
}
