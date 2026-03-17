import { fusionar } from '../core/DeepMerge.js';
import { ticker } from '../core/Ticker.js';
import { inputManager } from '../events/InputManager.js';
import { FormulaParser } from '../math/FormulaParser.js';
export class RenderNode {
    constructor(d, pe, dp, f) {
        this.data = d; this.parentElement = pe; this.depth = dp; this.factory = f;
        this.currentTransform = { translateX:0, translateY:0, translateZ:0, rotateX:0, rotateY:0, rotateZ:0, scale:1 };
        this.targetTransform = { ...this.currentTransform };
        if (d.baseTransform) Object.assign(this.currentTransform, d.baseTransform), Object.assign(this.targetTransform, d.baseTransform);
        this.formulaProps = new Map(); this.scanFormulas(); this.mount();
    }
    scanFormulas() {
        Object.entries(this.data.props).forEach(([k,v]) => FormulaParser.isFormula(v) && (this.formulaProps.set(`p:${k}`, v), this.wakeUp()));
        const t = this.data.props.transform || this.data.baseTransform;
        if (t) Object.entries(t).forEach(([k,v]) => FormulaParser.isFormula(v) && (this.formulaProps.set(`t:${k}`, v), this.wakeUp()));
    }
    mount() {
        this.element = document.createElement('div'); this.element.id = this.data.id;
        this.element.style.transformStyle = 'preserve-3d'; this.element.style.zIndex = this.depth;
        this.currentTransform.translateZ += (this.depth * 0.001); this.targetTransform.translateZ += (this.depth * 0.001);
        this.applyStyles(); this.parentElement.appendChild(this.element); this.mounted = true;
        import('../core/BehaviorManager.js').then(({BehaviorManager}) => { this.bm = new BehaviorManager(this); this.bm.init(); });
        this.applyTransform();
    }
    applyStyles() {
        Object.entries(this.data.props).forEach(([k,v]) => {
            if (k.startsWith('--')) this.element.style.setProperty(k, v);
            else if (k === 'innerHTML') { if (!FormulaParser.isFormula(v)) this.element.innerHTML = v; }
            else if (k !== 'transform' && !FormulaParser.isFormula(v)) this.element.style[k] = v;
        });
    }
    update(dt) {
        if (!this.mounted || !this.isAwake) return false;
        let req = false;
        if (this.formulaProps.size) {
            const p = inputManager.getState().pointer, vars = { time: ticker.elapsedTime, index: this.data.props['--instance-index']||0, total: this.data.props['--instance-total']||1, mouseX: p.normalX, mouseY: p.normalY };
            this.formulaProps.forEach((f, k) => {
                const v = FormulaParser.evaluate(f, vars);
                if (k.startsWith('p:')) { const n = k.split(':')[1]; n === 'innerHTML' ? (this.element.innerHTML = v) : (this.element.style[n] = v); }
                else { this.targetTransform[k.split(':')[1]] = v; if (!this.bm) this.currentTransform[k.split(':')[1]] = v; }
                req = true;
            });
        }
        if (this.bm && this.bm.update(dt)) req = true;
        this.applyTransform(); return this.formulaProps.size > 0 || req;
    }
    applyTransform() {
        const t = this.currentTransform;
        this.element.style.transform = `translate3d(${t.translateX}px, ${t.translateY}px, ${t.translateZ}px) rotateY(${t.rotateY}deg) rotateX(${t.rotateX}deg) rotateZ(${t.rotateZ}deg) scale(${t.scale})`;
    }
    wakeUp() { this.isAwake = true; ticker.addNode(this); }
    unmount() { ticker.removeNode(this); if (this.bm) this.bm.dispose(); if (this.element?.parentElement) this.element.parentElement.removeChild(this.element); this.mounted = false; }
}
