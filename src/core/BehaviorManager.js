import { MathUtils } from '../math/MathUtils.js';
import { telemetry } from '../events/TelemetryBus.js';
import { ticker } from './Ticker.js';

export class BehaviorManager {
    static registry = new Map();

    static register(name, setupFunction) {
        this.registry.set(name, setupFunction);
    }

    constructor(renderNode) {
        this.renderNode = renderNode;
        this.logic = renderNode.data.logic;
        this.unsubscribes = [];
    }

    init() {
        if (!this.logic) return;
        for (const [name, setupFunction] of BehaviorManager.registry.entries()) {
            if (this.logic[name]) {
                const unsubscribe = setupFunction(this.renderNode, this.logic[name]);
                if (typeof unsubscribe === 'function') {
                    this.unsubscribes.push(unsubscribe);
                }
            }
        }
    }

    update(deltaTime) {
        let isMoving = false;
        const current = this.renderNode.currentTransform;
        const target = this.renderNode.targetTransform;
        const smoothing = this.logic.inertia || 0.9;

        const transformProps = ['translateX', 'translateY', 'translateZ', 'rotateX', 'rotateY', 'rotateZ', 'scale'];

        transformProps.forEach(prop => {
            const newValue = MathUtils.lerp(current[prop], target[prop], smoothing, deltaTime);
            if (Math.abs(current[prop] - newValue) > 0) {
                current[prop] = newValue;
                isMoving = true;
            }
        });

        return isMoving;
    }

    dispose() {
        this.unsubscribes.forEach(unsub => unsub());
        this.unsubscribes = [];
    }
}

// Register Behaviors
BehaviorManager.register('mouseFollow', (node, config) => {
    const handler = pointer => {
        node.wakeUp();
        const multiplierX = config.multiplierX || 50;
        const multiplierY = config.multiplierY || 50;
        node.targetTransform.translateX = node.data.baseTransform.translateX + (pointer.normalX * multiplierX);
        node.targetTransform.translateY = node.data.baseTransform.translateY + (pointer.normalY * multiplierY);
    };
    telemetry.subscribe('input:pointer', handler);
    return () => telemetry.unsubscribe('input:pointer', handler);
});

BehaviorManager.register('lookAtMouse', (node, config) => {
    const handler = pointer => {
        node.wakeUp();
        const maxX = config.maxRotationX || 30;
        const maxY = config.maxRotationY || 30;
        node.targetTransform.rotateY = node.data.baseTransform.rotateY + (pointer.normalX * maxY);
        node.targetTransform.rotateX = node.data.baseTransform.rotateX + (pointer.normalY * maxX);
    };
    telemetry.subscribe('input:pointer', handler);
    return () => telemetry.unsubscribe('input:pointer', handler);
});

BehaviorManager.register('float', (node, config) => {
    const callback = () => {
        node.wakeUp();
        const time = performance.now() / 1000;
        const amplitude = config.amplitude || 20;
        const speed = config.speed || 1;
        const axis = config.axis || 'translateY';
        node.targetTransform[axis] = (node.data.baseTransform[axis] || 0) + Math.sin(time * speed) * amplitude;
    };
    ticker.addCallback(callback);
    return () => ticker.removeCallback(callback);
});

BehaviorManager.register('recycle', (node, config) => {
    const callback = () => {
        const current = node.currentTransform;
        const target = node.targetTransform;
        const thresholdZ = config.thresholdZ || 500;

        if (current.translateZ > thresholdZ) {
            const resetZ = config.resetZ || -1000;
            current.translateZ = resetZ;
            target.translateZ = resetZ;
            node.data.baseTransform.translateZ = resetZ;

            if (config.randomizeXY) {
                const rangeX = config.rangeX || 1000;
                const rangeY = config.rangeY || 1000;
                const rx = (Math.random() - 0.5) * rangeX;
                const ry = (Math.random() - 0.5) * rangeY;
                current.translateX = target.translateX = node.data.baseTransform.translateX = rx;
                current.translateY = target.translateY = node.data.baseTransform.translateY = ry;
            }
            node.wakeUp();
        }
    };
    ticker.addCallback(callback);
    return () => ticker.removeCallback(callback);
});
