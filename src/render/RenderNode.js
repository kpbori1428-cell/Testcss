import { fusionar } from '../core/DeepMerge.js';
import { ticker } from '../core/Ticker.js';
import { inputManager } from '../events/InputManager.js';
import { telemetry } from '../events/TelemetryBus.js';

export class RenderNode {
    constructor(nodeData, parentElement, depth, factory) {
        this.data = nodeData;
        this.element = null;
        this.parentElement = parentElement;
        this.depth = depth;
        this.factory = factory; // Pass factory if needed for late instantiation, but typically data is complete

        this.mounted = false;

        // Logical state
        this.isAwake = false;

        // Transformations
        this.currentTransform = this.data.baseTransform ? { ...this.data.baseTransform } : { translateX:0, translateY:0, translateZ:0, rotateX:0, rotateY:0, rotateZ:0, scale:1 };
        this.targetTransform = this.data.baseTransform ? { ...this.data.baseTransform } : { translateX:0, translateY:0, translateZ:0, rotateX:0, rotateY:0, rotateZ:0, scale:1 };

        // Map listeners to easily remove them later
        this.listeners = new Map();

        // Behavior Manager
        this.behaviorManager = null;

        this.mount();
    }

    mount() {
        if (this.mounted) return;

        this.element = document.createElement('div');
        this.element.id = this.data.id;

        // Obligatorio en toda la cadena jerárquica
        this.element.style.transformStyle = 'preserve-3d';

        // Z-Index Lógico
        this.element.style.zIndex = this.depth;

        // Z-fighting micro-compensation (+0.001px based on depth)
        // Adding it to base translation Z
        if (this.data && this.data.baseTransform) {
            this.data.baseTransform.translateZ += (this.depth * 0.001);
            this.currentTransform.translateZ = this.data.baseTransform.translateZ;
            this.targetTransform.translateZ = this.data.baseTransform.translateZ;
        }

        this.applyBaseStyles();
        this.applyLogicListeners();

        this.parentElement.appendChild(this.element);
        this.mounted = true;

        // Initialize Behaviors
        // We import it dynamically or use dependency injection.
        import('../core/BehaviorManager.js').then(({ BehaviorManager }) => {
            this.behaviorManager = new BehaviorManager(this);
            this.behaviorManager.init();
        });

        // Force initial transform
        this.applyTransform();
    }

    applyBaseStyles() {
        for (const [key, value] of Object.entries(this.data.props)) {
            // Check if it's a CSS custom property
            if (key.startsWith('--')) {
                this.element.style.setProperty(key, value);
            }
            // Avoid conflict with transform pipeline
            else if (key !== 'transform') {
                this.element.style[key] = value;
            }
        }
    }

    applyLogicListeners() {
        if (!this.data.logic) return;

        // Example: Setup interaction listeners based on logic
        if (this.data.logic.mouseEnter) {
            const handler = () => {
                // Handle event and dispatch to telemetry if needed
                telemetry.publish(`event:${this.data.path}:mouseEnter`, {});
            };
            this.element.addEventListener('mouseenter', handler);
            this.listeners.set('mouseenter', handler);
        }

        // More behaviors will be hooked in the Behavior system
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
        // Orden estricto: Traslación Base -> Traslación Dinámica -> Rotación (Y-X-Z) -> Escala
        // En CSS, el orden de las transformaciones se aplica de derecha a izquierda o de izquierda a derecha.
        // En realidad, la regla dice que CSS aplica transformaciones de izquierda a derecha según la especificación.
        // Entonces: translate() rotateY() rotateX() rotateZ() scale()

        const transformString = `
            translate3d(${t.translateX}px, ${t.translateY}px, ${t.translateZ}px)
            rotateY(${t.rotateY}deg)
            rotateX(${t.rotateX}deg)
            rotateZ(${t.rotateZ}deg)
            scale(${t.scale})
        `.trim().replace(/\s+/g, ' ');

        this.element.style.transform = transformString;
    }

    patch(partialData) {
        // Fase de Actualización (Update Phase)
        // Deep merge data
        this.data.props = fusionar(this.data.props, partialData.props, 0);
        this.data.logic = fusionar(this.data.logic, partialData.logic, 0);

        this.applyBaseStyles();

        // Wakening the node for re-render if needed
        this.wakeUp();
    }

    wakeUp() {
        this.isAwake = true;
        ticker.addNode(this);
    }

    unmount() {
        // Fase de Desmontaje (Unmount Phase)
        // Strict Clean-up Contract

        // 1. Remove from ticker
        this.isAwake = false;
        ticker.removeNode(this);

        // 2. Dispose Behavior Manager
        if (this.behaviorManager) {
            this.behaviorManager.dispose();
        }

        // 3. Remove node-specific listeners
        for (const [event, handler] of this.listeners.entries()) {
            this.element.removeEventListener(event, handler);
        }
        this.listeners.clear();

        // 4. Clear Memory Chamber
        this.data.memoryChamber.clear();

        // 4. Remove from DOM
        if (this.element && this.parentElement) {
            this.parentElement.removeChild(this.element);
        }
        this.mounted = false;
        this.element = null;
    }
}
