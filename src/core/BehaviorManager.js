import { MathUtils } from '../math/MathUtils.js';
import { inputManager } from '../events/InputManager.js';
import { telemetry } from '../events/TelemetryBus.js';

export class BehaviorManager {
    constructor(renderNode) {
        this.renderNode = renderNode;
        this.logic = renderNode.data.logic;

        // Dynamic Translation offsets
        this.dynamicTransform = {
            translateX: 0, translateY: 0, translateZ: 0,
            rotateX: 0, rotateY: 0, rotateZ: 0,
            scale: 1
        };

        this.initialized = false;
        this.unsubscribeFunctions = [];
    }

    init() {
        if (this.initialized) return;

        // Lexicón de Comportamientos Automáticos
        if (this.logic) {
            if (this.logic.mouseFollow) {
                this.setupMouseFollow(this.logic.mouseFollow);
            }

            if (this.logic.lookAtMouse) {
                this.setupLookAtMouse(this.logic.lookAtMouse);
            }

            if (this.logic.scroll) {
                 this.setupScroll(this.logic.scroll);
            }

            // Acciones externas
            if (this.logic.actions) {
                this.setupActions(this.logic.actions);
            }
        }

        this.initialized = true;
    }

    setupMouseFollow(config) {
        // config = { inertia: 0.9, multiplierX: 100, multiplierY: 100 }
        const handler = (pointer) => {
            if (!this.renderNode.data || !this.renderNode.data.baseTransform) return;
            // Wake up node to process interpolation
            this.renderNode.wakeUp();

            // Set targets
            const mx = config.multiplierX || 50;
            const my = config.multiplierY || 50;

            // Normal pointer is [-1, 1], so target is max offset
            this.renderNode.targetTransform.translateX = this.renderNode.data.baseTransform.translateX + (pointer.normalX * mx);
            this.renderNode.targetTransform.translateY = this.renderNode.data.baseTransform.translateY + (pointer.normalY * my);
        };

        telemetry.subscribe('input:pointer', handler);
        this.unsubscribeFunctions.push(() => telemetry.unsubscribe('input:pointer', handler));
    }

    setupLookAtMouse(config) {
        // config = { inertia: 0.9, maxRotationX: 45, maxRotationY: 45 }
        const handler = (pointer) => {
            if (!this.renderNode.data || !this.renderNode.data.baseTransform) return;
            this.renderNode.wakeUp();

            const maxX = config.maxRotationX || 30;
            const maxY = config.maxRotationY || 30;

            // Look at mouse usually means rotating based on pointer position.
            // If pointer is left (-1), rotate Y positive. If up (+1), rotate X positive.
            this.renderNode.targetTransform.rotateY = this.renderNode.data.baseTransform.rotateY + (pointer.normalX * maxY);
            this.renderNode.targetTransform.rotateX = this.renderNode.data.baseTransform.rotateX + (pointer.normalY * maxX);
        };

        telemetry.subscribe('input:pointer', handler);
        this.unsubscribeFunctions.push(() => telemetry.unsubscribe('input:pointer', handler));
    }

    setupScroll(config) {
         // config = { multiplierY: -200, opacityMap: [0, 1] }
         const handler = (scrollData) => {
            if (!this.renderNode.data || !this.renderNode.data.baseTransform) return;
            this.renderNode.wakeUp();
            const my = config.multiplierY || -100;
            this.renderNode.targetTransform.translateY = this.renderNode.data.baseTransform.translateY + (scrollData.normalY * my);
         };

         telemetry.subscribe('input:scroll', handler);
         this.unsubscribeFunctions.push(() => telemetry.unsubscribe('input:scroll', handler));
    }

    setupActions(actions) {
        // actions = { "click": [ { target: "app.scene.cube", prop: "scale", value: 2 } ] }
        for (const [event, triggers] of Object.entries(actions)) {
            const handler = () => {
                triggers.forEach(trigger => {
                    telemetry.publish(`action:${trigger.target}`, trigger);
                });
            };
            this.renderNode.element.addEventListener(event, handler);
            this.renderNode.listeners.set(event, handler);
        }
    }

    update(deltaTime) {
        let isMoving = false;

        // Apply Lerp to all transform properties
        const t = this.renderNode.currentTransform;
        const target = this.renderNode.targetTransform;

        // Define an average smoothing based on logic (default 0.9)
        // Usually, inertia should be configured per behavior, but applying a global one for the node's transform
        const smoothing = this.logic.inertia || 0.9;

        // Base Translation + Dynamic Translation
        const newTx = MathUtils.lerp(t.translateX, target.translateX, smoothing, deltaTime);
        if (Math.abs(t.translateX - newTx) > 0) { t.translateX = newTx; isMoving = true; }

        const newTy = MathUtils.lerp(t.translateY, target.translateY, smoothing, deltaTime);
        if (Math.abs(t.translateY - newTy) > 0) { t.translateY = newTy; isMoving = true; }

        const newTz = MathUtils.lerp(t.translateZ, target.translateZ, smoothing, deltaTime);
        if (Math.abs(t.translateZ - newTz) > 0) { t.translateZ = newTz; isMoving = true; }

        // Rotation (Y-X-Z)
        const newRy = MathUtils.lerp(t.rotateY, target.rotateY, smoothing, deltaTime);
        if (Math.abs(t.rotateY - newRy) > 0) { t.rotateY = newRy; isMoving = true; }

        const newRx = MathUtils.lerp(t.rotateX, target.rotateX, smoothing, deltaTime);
        if (Math.abs(t.rotateX - newRx) > 0) { t.rotateX = newRx; isMoving = true; }

        const newRz = MathUtils.lerp(t.rotateZ, target.rotateZ, smoothing, deltaTime);
        if (Math.abs(t.rotateZ - newRz) > 0) { t.rotateZ = newRz; isMoving = true; }

        // Scale
        const newS = MathUtils.lerp(t.scale, target.scale, smoothing, deltaTime);
        if (Math.abs(t.scale - newS) > 0) { t.scale = newS; isMoving = true; }

        return isMoving;
    }

    dispose() {
        this.unsubscribeFunctions.forEach(unsub => unsub());
        this.unsubscribeFunctions = [];
    }
}
