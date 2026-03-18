import { MathUtils } from '../math/MathUtils.js';
import { inputManager } from '../events/InputManager.js';
import { telemetry } from '../events/TelemetryBus.js';
import { formulaParser } from '../math/FormulaParser.js';

export class BehaviorManager {
    constructor(renderNode) {
        this.renderNode = renderNode;
        this.logic = renderNode.data.logic || {};

        this.time = 0;
        this.initialized = false;
        this.unsubscribeFunctions = [];
    }

    init() {
        if (this.initialized) return;

        // Lexicón de Comportamientos Automáticos
        if (this.logic.mouseFollow) this.setupMouseFollow(this.logic.mouseFollow);
        if (this.logic.lookAtMouse) this.setupLookAtMouse(this.logic.lookAtMouse);
        if (this.logic.scroll) this.setupScroll(this.logic.scroll);
        if (this.logic.autoAnimate) this.setupAutoAnimate(this.logic.autoAnimate);
        if (this.logic.colorCycle) this.setupColorCycle(this.logic.colorCycle);
        if (this.logic.recycle) this.setupRecycle(this.logic.recycle);
        if (this.logic.spring) this.setupSpring(this.logic.spring);
        if (this.logic.float) this.setupFloat(this.logic.float);
        if (this.logic.parallax) this.setupParallax(this.logic.parallax);
        if (this.logic.actions) this.setupActions(this.logic.actions);

        this.initialized = true;
    }

    setupMouseFollow(config) {
        const factor = config.factor || 1;
        const handler = (pointer) => {
            if (!this.renderNode || !this.renderNode.mounted || !this.renderNode.targetTransform) return;
            this.renderNode.wakeUp();
            const mx = (config.multiplierX || 50) * factor;
            const my = (config.multiplierY || 50) * factor;
            const bt = (this.renderNode.data && this.renderNode.data.baseTransform) || {};
            this.renderNode.targetTransform.translateX = (bt.translateX || 0) + (pointer.normalX * mx);
            this.renderNode.targetTransform.translateY = (bt.translateY || 0) + (pointer.normalY * my);
        };
        telemetry.subscribe('input:pointer', handler);
        this.unsubscribeFunctions.push(() => telemetry.unsubscribe('input:pointer', handler));
    }

    setupLookAtMouse(config) {
        const handler = (pointer) => {
            if (!this.renderNode || !this.renderNode.mounted || !this.renderNode.targetTransform) return;
            this.renderNode.wakeUp();
            const maxX = config.maxRotationX || 30;
            const maxY = config.maxRotationY || 30;
            const bt = (this.renderNode.data && this.renderNode.data.baseTransform) || {};
            this.renderNode.targetTransform.rotateY = (bt.rotateY || 0) + (pointer.normalX * maxY);
            this.renderNode.targetTransform.rotateX = (bt.rotateX || 0) + (pointer.normalY * maxX);
        };
        telemetry.subscribe('input:pointer', handler);
        this.unsubscribeFunctions.push(() => telemetry.unsubscribe('input:pointer', handler));
    }

    setupScroll(config) {
         const handler = (scrollData) => {
            if (!this.renderNode || !this.renderNode.mounted || !this.renderNode.targetTransform) return;
            this.renderNode.wakeUp();
            const my = config.multiplierY || -100;
            const bt = (this.renderNode.data && this.renderNode.data.baseTransform) || {};
            this.renderNode.targetTransform.translateY = (bt.translateY || 0) + (scrollData.normalY * my);
         };
         telemetry.subscribe('input:scroll', handler);
         this.unsubscribeFunctions.push(() => telemetry.unsubscribe('input:scroll', handler));
    }

    setupAutoAnimate(config) {
        this.renderNode.wakeUp();
    }

    setupRecycle(config) {
        this.renderNode.wakeUp();
    }

    setupFloat(config) {
        // config = { amplitude: 20, speed: 1.5 }
        this.renderNode.wakeUp();
    }

    setupParallax(config) {
        // config = { factorX: 0.1, factorY: 0.1 }
        const handler = (pointer) => {
            if (!this.renderNode || !this.renderNode.mounted || !this.renderNode.targetTransform) return;
            this.renderNode.wakeUp();
            const bt = (this.renderNode.data && this.renderNode.data.baseTransform) || {};
            this.renderNode.targetTransform.translateX = (bt.translateX || 0) + (pointer.normalX * (config.factorX || 50));
            this.renderNode.targetTransform.translateY = (bt.translateY || 0) + (pointer.normalY * (config.factorY || 50));
        };
        telemetry.subscribe('input:pointer', handler);
        this.unsubscribeFunctions.push(() => telemetry.unsubscribe('input:pointer', handler));
    }

    setupSpring(config) {
        this.springState = {
            velocityX: 0, velocityY: 0,
            offsetX: 0, offsetY: 0
        };

        const handler = (pointer) => {
            if (!this.renderNode || !this.renderNode.mounted) return;
            this.renderNode.wakeUp();
        };
        telemetry.subscribe('input:pointer', handler);
        this.unsubscribeFunctions.push(() => telemetry.unsubscribe('input:pointer', handler));
    }

    setupColorCycle(config) {
        const colors = config.colors || ['#ff0000', '#00ff00', '#0000ff'];
        const property = config.property || 'backgroundColor';
        const duration = config.duration || 3000;
        let index = 0;

        if (this.renderNode.element) {
            this.renderNode.element.style.transition = `${property} ${duration}ms linear`;
        }

        const cycle = () => {
            if (!this.renderNode || !this.renderNode.mounted || !this.renderNode.element) return;
            this.renderNode.element.style[property] = colors[index];
            index = (index + 1) % colors.length;
            setTimeout(cycle, duration);
        };
        cycle();
    }

    setupActions(actions) {
        for (const [event, triggers] of Object.entries(actions)) {
            const handler = (e) => {
                if (event === 'click') e.stopPropagation();
                triggers.forEach(trigger => {
                    telemetry.publish(`action:${trigger.target}`, trigger);
                });
            };
            if (this.renderNode.element) {
                this.renderNode.element.addEventListener(event, handler);
                this.unsubscribeFunctions.push(() => {
                    if (this.renderNode.element) this.renderNode.element.removeEventListener(event, handler);
                });
            }
        }

        const actionHandler = (trigger) => {
            if (!this.renderNode || !this.renderNode.mounted) return;
            if (trigger.prop && trigger.value !== undefined) {
                this.renderNode.wakeUp();
                if (this.renderNode.targetTransform && this.renderNode.targetTransform[trigger.prop] !== undefined) {
                    this.renderNode.targetTransform[trigger.prop] = trigger.value;
                } else {
                    const partial = { props: {} };
                    partial.props[trigger.prop] = trigger.value;
                    this.renderNode.patch(partial);
                }
            }
        };
        const path = this.renderNode.data.path;
        telemetry.subscribe(`action:${path}`, actionHandler);
        this.unsubscribeFunctions.push(() => telemetry.unsubscribe(`action:${path}`, actionHandler));
    }

    update(deltaTime) {
        if (!this.renderNode || !this.renderNode.mounted) return false;
        this.time += deltaTime;
        let isMoving = false;

        // Process Spring Physics
        if (this.logic.spring && this.springState) {
            const config = this.logic.spring;
            const stiffness = config.stiffness || 0.1;
            const damping = config.damping || 0.8;
            const mult = config.multiplier || 100;

            const pointer = inputManager.getState().pointer;
            const targetX = pointer.normalX * mult;
            const targetY = pointer.normalY * mult;

            const ax = (targetX - this.springState.offsetX) * stiffness;
            const ay = (targetY - this.springState.offsetY) * stiffness;

            this.springState.velocityX += ax;
            this.springState.velocityY += ay;
            this.springState.velocityX *= damping;
            this.springState.velocityY *= damping;

            this.springState.offsetX += this.springState.velocityX;
            this.springState.offsetY += this.springState.velocityY;

            this.renderNode.targetTransform.translateX = (this.renderNode.data.baseTransform.translateX || 0) + this.springState.offsetX;
            this.renderNode.targetTransform.translateY = (this.renderNode.data.baseTransform.translateY || 0) + this.springState.offsetY;

            if (Math.abs(this.springState.velocityX) > 0.01 || Math.abs(this.springState.velocityY) > 0.01) {
                isMoving = true;
            }
        }

        const bt = (this.renderNode.data && this.renderNode.data.baseTransform) || {};
        const target = this.renderNode.targetTransform;
        const current = this.renderNode.currentTransform;

        if (!target || !current) return false;

        // Process Formula-based transforms
        const args = {
            time: this.time,
            index: (this.renderNode.data.props && this.renderNode.data.props['--instance-index']) || 0,
            total: (this.renderNode.data.props && this.renderNode.data.props['--instance-total']) || 1,
            mouseX: inputManager.getState().pointer.normalX,
            mouseY: inputManager.getState().pointer.normalY
        };

        ['translateX', 'translateY', 'translateZ', 'rotateX', 'rotateY', 'rotateZ', 'scale'].forEach(prop => {
            const val = bt[prop];
            if (typeof val === 'string' && val.startsWith('=')) {
                target[prop] = formulaParser.evaluate(val, args);
                this.renderNode.wakeUp();
                isMoving = true;
            }
        });

        // Process Recycling
        if (this.logic.recycle) {
            const config = this.logic.recycle;
            const bounds = config.bounds || { x: 1000, y: 1000, z: 1000 };

            if (current.translateX > bounds.x) { current.translateX = -bounds.x; target.translateX = -bounds.x; }
            else if (current.translateX < -bounds.x) { current.translateX = bounds.x; target.translateX = bounds.x; }

            if (current.translateY > bounds.y) { current.translateY = -bounds.y; target.translateY = -bounds.y; }
            else if (current.translateY < -bounds.y) { current.translateY = bounds.y; target.translateY = bounds.y; }

            if (current.translateZ > bounds.z) { current.translateZ = -bounds.z; target.translateZ = -bounds.z; }
            else if (current.translateZ < -bounds.z) { current.translateZ = bounds.z; target.translateZ = bounds.z; }

            isMoving = true;
        }

        // Process Float
        if (this.logic.float) {
            const config = this.logic.float;
            const amp = config.amplitude || 20;
            const speed = config.speed || 1.5;
            target.translateY = (bt.translateY || 0) + Math.sin(this.time * speed) * amp;
            isMoving = true;
        }

        // Process Auto-Animate loops
        if (this.logic.autoAnimate) {
            const config = this.logic.autoAnimate;
            target.rotateX = (target.rotateX || 0) + (config.rotateX || 0) * deltaTime * 60;
            target.rotateY = (target.rotateY || 0) + (config.rotateY || 0) * deltaTime * 60;
            target.rotateZ = (target.rotateZ || 0) + (config.rotateZ || 0) * deltaTime * 60;

            const floatY = Math.sin(this.time * (config.floatFrequency || 2)) * (config.floatAmplitude || 0);
            target.translateY = (bt.translateY || 0) + floatY;

            isMoving = true;
        }

        // Apply Lerp
        const smoothing = this.logic.inertia || 0.9;

        ['translateX', 'translateY', 'translateZ', 'rotateX', 'rotateY', 'rotateZ', 'scale'].forEach(prop => {
            if (current[prop] === undefined || target[prop] === undefined) return;
            const newVal = MathUtils.lerp(current[prop], target[prop], smoothing, deltaTime);
            if (Math.abs(current[prop] - newVal) > 0) {
                current[prop] = newVal;
                isMoving = true;
            }
        });

        return isMoving;
    }

    dispose() {
        this.unsubscribeFunctions.forEach(unsub => unsub());
        this.unsubscribeFunctions = [];
        this.renderNode = null;
    }
}
