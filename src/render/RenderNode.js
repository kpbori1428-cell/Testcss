import { fusionar } from '../core/DeepMerge.js';
import { ticker } from '../core/Ticker.js';
import { inputManager } from '../events/InputManager.js';
import { FormulaParser } from '../math/FormulaParser.js';
import { BehaviorManager } from '../core/BehaviorManager.js';

export class RenderNode {
    constructor(data, parentElement, depth, factory) {
        this.data = data;
        this.parentElement = parentElement;
        this.depth = depth;
        this.factory = factory;

        this.currentTransform = { translateX:0, translateY:0, translateZ:0, rotateX:0, rotateY:0, rotateZ:0, scale:1 };
        this.targetTransform = { ...this.currentTransform };
        this.lastTransformString = "";
        this.lastInnerHTML = "";
        this.isAwake = false;
        this.mounted = false;
        this.formulaProps = new Map();

        if (data.baseTransform) {
            Object.assign(this.currentTransform, data.baseTransform);
            Object.assign(this.targetTransform, data.baseTransform);
        }

        this.scanFormulas();
        this.mount();
    }

    reuse(data, parentElement, depth) {
        this.unmount();
        this.data = data;
        this.parentElement = parentElement;
        this.depth = depth;
        this.formulaProps.clear();
        this.lastTransformString = "";
        this.lastInnerHTML = "";

        Object.assign(this.currentTransform, { translateX:0, translateY:0, translateZ:0, rotateX:0, rotateY:0, rotateZ:0, scale:1 });
        if (data.baseTransform) Object.assign(this.currentTransform, data.baseTransform);
        Object.assign(this.targetTransform, this.currentTransform);

        this.scanFormulas();
        this.mount();
    }

    scanFormulas() {
        Object.entries(this.data.props).forEach(([key, value]) => {
            if (FormulaParser.isFormula(value)) {
                this.formulaProps.set(`p:${key}`, value);
                this.wakeUp();
            }
        });

        const sourceTransform = this.data.props.transform || this.data.baseTransform;
        if (sourceTransform) {
            Object.entries(sourceTransform).forEach(([key, value]) => {
                if (FormulaParser.isFormula(value)) {
                    this.formulaProps.set(`t:${key}`, value);
                    this.wakeUp();
                }
            });
        }
    }

    mount() {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.style.transformStyle = 'preserve-3d';
        }
        this.element.id = this.data.id;
        this.element.style.zIndex = this.depth;

        // Z-fighting micro-compensation
        this.currentTransform.translateZ += (this.depth * 0.001);
        this.targetTransform.translateZ += (this.depth * 0.001);

        this.applyStyles();
        this.parentElement.appendChild(this.element);
        this.mounted = true;

        this.behaviorManager = new BehaviorManager(this);
        this.behaviorManager.init();

        this.applyTransform();
    }

    applyStyles() {
        Object.entries(this.data.props).forEach(([key, value]) => {
            if (key.startsWith('--')) {
                this.element.style.setProperty(key, value);
            } else if (key === 'innerHTML') {
                if (!FormulaParser.isFormula(value)) this.updateInnerHTML(value);
            } else if (key !== 'transform' && !FormulaParser.isFormula(value)) {
                this.element.style[key] = value;
            }
        });
    }

    updateInnerHTML(html) {
        if (this.lastInnerHTML !== html) {
            this.element.innerHTML = html;
            this.lastInnerHTML = html;
        }
    }

    update(deltaTime) {
        if (!this.mounted || !this.isAwake) return false;
        let requiresUpdate = false;

        if (this.formulaProps.size > 0) {
            const pointer = inputManager.getState().pointer;
            const vars = {
                time: ticker.elapsedTime,
                index: this.data.props['--instance-index'] || 0,
                total: this.data.props['--instance-total'] || 1,
                mouseX: pointer.normalX,
                mouseY: pointer.normalY
            };

            this.formulaProps.forEach((formula, key) => {
                const value = FormulaParser.evaluate(formula, vars);
                if (key.startsWith('p:')) {
                    const propName = key.split(':')[1];
                    propName === 'innerHTML' ? this.updateInnerHTML(value) : (this.element.style[propName] = value);
                } else {
                    const transName = key.split(':')[1];
                    this.targetTransform[transName] = value;
                    if (!this.behaviorManager) this.currentTransform[transName] = value;
                }
                requiresUpdate = true;
            });
        }

        if (this.behaviorManager && this.behaviorManager.update(deltaTime)) {
            requiresUpdate = true;
        }

        this.applyTransform();
        return this.formulaProps.size > 0 || requiresUpdate;
    }

    applyTransform() {
        const t = this.currentTransform;
        const s = `translate3d(${t.translateX.toFixed(2)}px, ${t.translateY.toFixed(2)}px, ${t.translateZ.toFixed(3)}px) rotateY(${t.rotateY.toFixed(2)}deg) rotateX(${t.rotateX.toFixed(2)}deg) rotateZ(${t.rotateZ.toFixed(2)}deg) scale(${t.scale.toFixed(3)})`;

        if (this.lastTransformString !== s) {
            this.element.style.transform = s;
            this.lastTransformString = s;
        }
    }

    wakeUp() {
        this.isAwake = true;
        ticker.addNode(this);
    }

    unmount() {
        ticker.removeNode(this);
        if (this.behaviorManager) {
            this.behaviorManager.dispose();
            this.behaviorManager = null;
        }
        if (this.element && this.element.parentElement) {
            this.element.parentElement.removeChild(this.element);
        }
        this.mounted = false;
    }
}
