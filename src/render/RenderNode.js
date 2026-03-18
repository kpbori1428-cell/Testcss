import { fusionar } from '../core/DeepMerge.js';
import { ticker } from '../core/Ticker.js';
import { telemetry } from '../events/TelemetryBus.js';

export class RenderNode {
    constructor(nodeData, parentElement, depth, factory) {
        this.reset(nodeData, parentElement, depth);
        this.factory = factory;
    }

    reset(nodeData, parentElement, depth) {
        this.data = nodeData;
        this.parentElement = parentElement;
        this.depth = depth;

        this.mounted = false;
        this.isAwake = false;

        // Default transforms
        this.currentTransform = { translateX: 0, translateY: 0, translateZ: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };
        this.targetTransform = { translateX: 0, translateY: 0, translateZ: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };

        if (this.data.baseTransform) {
            // Only assign numeric values to current/target, formulas are processed in BehaviorManager
            ['translateX', 'translateY', 'translateZ', 'rotateX', 'rotateY', 'rotateZ', 'scale'].forEach(prop => {
                const val = this.data.baseTransform[prop];
                if (typeof val === 'number') {
                    this.currentTransform[prop] = val;
                    this.targetTransform[prop] = val;
                }
            });
        }

        // Compensar Z-fighting por profundidad
        this.currentTransform.translateZ += (this.depth * 0.001);
        this.targetTransform.translateZ += (this.depth * 0.001);

        this.listeners = new Map();
        this.behaviorManager = null;

        if (this.element) {
            // Reuse element
            this.element.style.cssText = "";
            this.element.innerHTML = "";
        }

        this.mount();
    }

    mount() {
        if (this.mounted) return;

        if (!this.element) {
            this.element = document.createElement('div');
        }
        this.element.id = this.data.id;
        this.element.dataset.path = this.data.path;

        // Estilos obligatorios para espacio 3D
        this.element.style.transformStyle = 'preserve-3d';
        this.element.style.zIndex = this.depth;

        this.applyBaseStyles();
        this.setupSiblingHover();

        this.parentElement.appendChild(this.element);
        this.mounted = true;

        // Initialize Behaviors
        import('../core/BehaviorManager.js').then(({ BehaviorManager }) => {
            if (!this.mounted) return;
            this.behaviorManager = new BehaviorManager(this);
            this.behaviorManager.init();
        });

        // Force initial transform string composition
        this.applyTransform();
    }

    setupSiblingHover() {
        if (!this.data.logic || !this.data.logic.hoverHermanos) return;

        const hoverStyles = this.data.logic.hover;
        const siblingStyles = this.data.logic.hoverHermanos;

        this.element.addEventListener('mouseenter', () => {
            // Apply my hover
            if (hoverStyles) this.patch({ props: hoverStyles });

            // Apply to siblings
            const siblings = Array.from(this.parentElement.children).filter(el => el !== this.element);
            siblings.forEach(siblingEl => {
                telemetry.publish(`action:${siblingEl.dataset.path}`, { props: siblingStyles });
            });
        });

        this.element.addEventListener('mouseleave', () => {
             // Normally we'd need an "undo" state, but for simplicity we rely on next patches
             // or a more complex state system.
        });
    }

    applyBaseStyles() {
        for (const [key, value] of Object.entries(this.data.props)) {
            if (key.startsWith('--')) {
                this.element.style.setProperty(key, value);
            } else if (key === 'innerHTML') {
                this.element.innerHTML = value;
            } else if (key !== 'transform') {
                this.element.style[key] = value;
            }
        }
    }

    update(deltaTime) {
        if (!this.mounted || !this.isAwake) return false;

        let requiresUpdate = false;
        if (this.behaviorManager) {
            requiresUpdate = this.behaviorManager.update(deltaTime);
        }

        this.applyTransform();
        return requiresUpdate;
    }

    applyTransform() {
        const t = this.currentTransform;
        // Optimización: Usar variables CSS para que el navegador solo recomponga si cambian
        // pero aquí las aplicamos directamente para control total del orden
        const str = `translate3d(${t.translateX}px, ${t.translateY}px, ${t.translateZ}px) rotateY(${t.rotateY}deg) rotateX(${t.rotateX}deg) rotateZ(${t.rotateZ}deg) scale(${t.scale})`;
        this.element.style.transform = str;
    }

    patch(partialData) {
        if (partialData.props) {
            this.data.props = fusionar(this.data.props, partialData.props, 0);
            this.applyBaseStyles();
        }
        if (partialData.logic) {
            this.data.logic = fusionar(this.data.logic, partialData.logic, 0);
        }
        this.wakeUp();
    }

    wakeUp() {
        this.isAwake = true;
        ticker.addNode(this);
    }

    unmount() {
        this.isAwake = false;
        ticker.removeNode(this);
        if (this.behaviorManager) this.behaviorManager.dispose();
        if (this.element && this.parentElement) {
            try {
                this.parentElement.removeChild(this.element);
            } catch (e) {
                // Parent might have been removed already
            }
        }
        this.mounted = false;
    }
}
