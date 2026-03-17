import { MathUtils } from '../math/MathUtils.js';
import { telemetry } from '../events/TelemetryBus.js';
export class BehaviorManager {
    static registry = new Map();
    static register(n, s) { this.registry.set(n, s); }
    constructor(rn) { this.renderNode = rn; this.logic = rn.data.logic; this.unsubs = []; }
    init() {
        if (!this.logic) return;
        for (const [n, s] of BehaviorManager.registry.entries()) {
            if (this.logic[n]) {
                const u = s(this.renderNode, this.logic[n]);
                if (typeof u === 'function') this.unsubs.push(u);
            }
        }
    }
    update(dt) {
        let moving = false; const t = this.renderNode.currentTransform, target = this.renderNode.targetTransform;
        const s = this.logic.inertia || this.logic.mouseFollow?.inertia || 0.9;
        ['translateX','translateY','translateZ','rotateX','rotateY','rotateZ','scale'].forEach(p => {
            const nv = MathUtils.lerp(t[p], target[p], s, dt);
            if (Math.abs(t[p] - nv) > 0) { t[p] = nv; moving = true; }
        });
        return moving;
    }
    dispose() { this.unsubs.forEach(u => u()); }
}
BehaviorManager.register('mouseFollow', (n, c) => {
    const h = p => { n.wakeUp(); n.targetTransform.translateX = n.data.baseTransform.translateX + (p.normalX * (c.multiplierX || 50)); n.targetTransform.translateY = n.data.baseTransform.translateY + (p.normalY * (c.multiplierY || 50)); };
    telemetry.subscribe('input:pointer', h); return () => telemetry.unsubscribe('input:pointer', h);
});
BehaviorManager.register('lookAtMouse', (n, c) => {
    const h = p => { n.wakeUp(); n.targetTransform.rotateY = n.data.baseTransform.rotateY + (p.normalX * (c.maxRotationY || 30)); n.targetTransform.rotateX = n.data.baseTransform.rotateX + (p.normalY * (c.maxRotationX || 30)); };
    telemetry.subscribe('input:pointer', h); return () => telemetry.unsubscribe('input:pointer', h);
});
BehaviorManager.register('float', (n, c) => {
    const cb = () => { n.wakeUp(); const t = performance.now()/1000, a = c.amplitude||20, s = c.speed||1, ax = c.axis||'translateY'; n.targetTransform[ax] = (n.data.baseTransform[ax]||0) + Math.sin(t * s) * a; };
    import('./Ticker.js').then(({ticker}) => ticker.addCallback(cb)); return () => import('./Ticker.js').then(({ticker}) => ticker.removeCallback(cb));
});
