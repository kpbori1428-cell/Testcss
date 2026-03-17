// Utils y Matemáticas

// Fórmula Lerp: Actual = Actual + (Objetivo - Actual) * (1 - Potencia(1 - Suavizado, DeltaTime)).
// Utilizando Math.pow para el DeltaTime normalizado (segundos).
export function lerp(actual, objetivo, suavizado, deltaTime) {
    const p = 1 - Math.pow(1 - suavizado, deltaTime);
    return actual + (objetivo - actual) * p;
}

// Globales de Input Mapping
export const InputState = {
    mouseX: 0, // Normalizado [-1, 1]
    mouseY: 0, // Normalizado [-1, 1]
    scrollOffset: 0,
    isActive: false
};

// Normalizar inputs
function handleMouseMove(e) {
    InputState.isActive = true;
    InputState.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    InputState.mouseY = -(e.clientY / window.innerHeight) * 2 + 1; // Y invertido para el DOM 3D clásico
}

function handleTouchMove(e) {
    if (e.touches.length > 0) {
        InputState.isActive = true;
        const touch = e.touches[0];
        InputState.mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
        InputState.mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
    }
}

function handleScroll(e) {
    InputState.scrollOffset += e.deltaY;
}

// Inicializar listeners globales
let inputMappingInitialized = false;

export function initInputMapping() {
    if (inputMappingInitialized) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('wheel', handleScroll);

    inputMappingInitialized = true;
}

// Ticker Global
export const EngineTicker = {
    subscribers: new Set(),
    lastTime: 0,
    running: false,

    start() {
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.tick.bind(this));
        }
    },

    stop() {
        this.running = false;
    },

    subscribe(callback) {
        this.subscribers.add(callback);
    },

    unsubscribe(callback) {
        this.subscribers.delete(callback);
    },

    tick(currentTime) {
        if (!this.running) return;

        // DeltaTime normalizado a segundos
        let deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Evitar deltas extremos si hay lag
        if (deltaTime > 0.1) deltaTime = 0.016;

        for (const callback of this.subscribers) {
            callback(deltaTime);
        }

        requestAnimationFrame(this.tick.bind(this));
    }
};

// ==========================================
// Clase Principal: RenderNode
// ==========================================

export class RenderNode {
    static globalZCounter = 0;

    constructor(data, parentDOM, path = "", level = 0, zIndex = 0) {
        if (level > 32) {
            throw new Error(`Profundidad Excedida: Límite de 32 niveles alcanzado en ${path}`);
        }

        this.id = data.id || `node_${Math.random().toString(36).substr(2, 9)}`;
        this.path = path ? `${path}.${this.id}` : this.id;
        this.level = level;
        this.parentDOM = parentDOM;

        // Datos del nodo (Interfaz Nodo)
        this.propiedadesEsteticas = data.Propiedades_Esteticas || {};
        this.directivasLogicas = data.Directivas_Logicas || {};
        this.transformBase = data.Transform_Base || { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1 };
        this.hijosDatos = data.Hijos || [];

        // Cámara de Memoria para restaurar estado
        this.camaraMemoria = {};

        // Estado Interno Transformaciones Actuales
        this.transform = {
            x: this.transformBase.x,
            y: this.transformBase.y,
            z: this.transformBase.z,
            rx: this.transformBase.rx,
            ry: this.transformBase.ry,
            rz: this.transformBase.rz,
            scale: this.transformBase.scale
        };

        // Estado Objetivo (para lerp)
        this.targetTransform = { ...this.transform };

        this.domElement = null;
        this.children = [];
        this.isSleeping = false;

        // "Z-Index Lógico: Aumenta con la recursión (Hijos > Padres)"
        this.zIndex = RenderNode.globalZCounter++;

        this.updateCallback = this.update.bind(this);
    }

    // Fase de Montaje (Mount)
    mount() {
        this.domElement = document.createElement('div');
        this.domElement.id = this.id;
        this.domElement.className = 'node';

        // IMPORTANTE: NO aplicar zIndex de CSS directamente porque fuerza un stacking context
        // que rompe el z-buffer nativo del navegador (oculsión 3D).
        // this.domElement.style.zIndex = this.zIndex;

        // Z-Fighting fix ("micro-compensación automática de +0.001px")
        // Como todos los hermanos empiezan en zIndex diferentes por jerarquía, le sumamos el index
        // global a su propio Z-fighting param o en el transform translation directamente.
        this.zFightingOffset = this.zIndex * 0.001;

        // Aplicar propiedades estéticas
        for (const [key, value] of Object.entries(this.propiedadesEsteticas)) {
            this.domElement.style[key] = value;
        }

        this.parentDOM.appendChild(this.domElement);

        // Suscripción al Ticker para actualizaciones
        EngineTicker.subscribe(this.updateCallback);

        // Montar hijos
        this.hijosDatos.forEach((hijoData, index) => {
            // Manejo de regla de instancias (clonación procedimental con sufijo)
            if (hijoData.Instancias) {
                for (let i = 0; i < hijoData.Instancias; i++) {
                    const instData = { ...hijoData, id: `${hijoData.id}:ins[${i}]` };
                    delete instData.Instancias; // Evitar loop infinito
                    const childNode = new RenderNode(instData, this.domElement, this.path, this.level + 1, index + i);
                    childNode.mount();
                    this.children.push(childNode);
                }
            } else {
                const childNode = new RenderNode(hijoData, this.domElement, this.path, this.level + 1, index);
                childNode.mount();
                this.children.push(childNode);
            }
        });

        // Render inicial para aplicar transformBase
        this.renderTransform();
    }

    // Fase de Desmontaje (Unmount)
    unmount() {
        // Contrato de Limpieza
        EngineTicker.unsubscribe(this.updateCallback);
        this.camaraMemoria = {}; // Vaciar Cámara de Memoria

        this.children.forEach(child => child.unmount());

        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
        }
    }

    // A. Gestión de Cámara de Memoria
    guardarEstado() {
        for (const [key, value] of Object.entries(this.transform)) {
            if (this.camaraMemoria[key] === undefined) {
                this.camaraMemoria[key] = value;
            }
        }
    }

    restaurarEstado() {
        for (const [key, value] of Object.entries(this.camaraMemoria)) {
            this.targetTransform[key] = value;
        }
        this.camaraMemoria = {};
    }

    // Fase de Actualización (Update)
    update(deltaTime) {
        if (!InputState.isActive) return;

        // Validar Fallback
        const EPSILON = 0.0001;
        let needsRender = false;

        // Comportamientos Lógicos y Modificadores de Destino
        this.aplicarComportamientos();

        // Culling Lógico y Normalización (Sleep Mode)
        for (const key of Object.keys(this.transform)) {
            // Fallback de valores inválidos (NaN) -> 0
            if (isNaN(this.targetTransform[key])) this.targetTransform[key] = 0;

            const target = this.targetTransform[key];
            const current = this.transform[key];

            if (Math.abs(target - current) > EPSILON) {
                // Hay movimiento, aplicamos lerp (suavizado base de 0.8 como ejemplo, puede ser prop)
                this.transform[key] = lerp(current, target, 0.8, deltaTime);
                needsRender = true;
            } else {
                // Culling: si está muy cerca, igualamos y preparamos para Sleep mode
                this.transform[key] = target;
            }
        }

        this.isSleeping = !needsRender;

        if (!this.isSleeping) {
            this.renderTransform();
        }
    }

    aplicarComportamientos() {
        const dL = this.directivasLogicas;

        // Mouse-Follow: Modifica Traslación XY dinámicamente basado en input normalizado
        if (dL['mouse-follow']) {
            const factor = parseFloat(dL['mouse-follow']) || 100;
            this.targetTransform.x = this.transformBase.x + (InputState.mouseX * factor);
            this.targetTransform.y = this.transformBase.y + (InputState.mouseY * factor);
            this.guardarEstado();
        }

        // Look-at-Mouse: Rotación 3D proyectada al ratón
        if (dL['look-at-mouse']) {
            const factor = parseFloat(dL['look-at-mouse']) || 30; // grados
            // Pitch (Rotación X) es afectado por mouseY, Yaw (Rotación Y) por mouseX
            this.targetTransform.rx = this.transformBase.rx + (InputState.mouseY * factor);
            this.targetTransform.ry = this.transformBase.ry + (InputState.mouseX * factor);
            this.guardarEstado();
        }

        // Scroll
        if (dL['scroll']) {
            const factor = parseFloat(dL['scroll']) || 0.1;
            this.targetTransform.y = this.transformBase.y - (InputState.scrollOffset * factor);
            this.guardarEstado();
        }
    }

    // Especificación de Transformaciones (Orden Estricto)
    renderTransform() {
        if (!this.domElement) return;

        // 1. Traslación (Base + Dinámica + Z-Fighting Compensation)
        const tX = this.transform.x;
        const tY = this.transform.y;
        const tZ = this.transform.z + this.zFightingOffset;

        // 2. Rotaciones en Orden Intrínseco: Y-X-Z (Evitar Gimbal Lock)
        // Usaremos las reglas de CSS Transform, que aplican de derecha a izquierda
        // O leyendo el string de izquierda a derecha en orden escrito.
        // Para aplicar primero Y, luego X, luego Z en los ejes locales:
        // En CSS Transform: transform: rotateY(..) rotateX(..) rotateZ(..);

        const rY = this.transform.ry;
        const rX = this.transform.rx;
        const rZ = this.transform.rz;

        // 3. Escala (Tamaño final)
        const sC = this.transform.scale;

        this.domElement.style.transform = `
            translate3d(${tX}px, ${tY}px, ${tZ}px)
            rotateY(${rY}deg)
            rotateX(${rX}deg)
            rotateZ(${rZ}deg)
            scale(${sC})
        `;
    }
}

// ==========================================
// Algoritmo de Fusión (Patching) y Bootstrap
// ==========================================

export function Fusionar(Principal, Parcial, Nivel_Actual = 0) {
    if (Nivel_Actual > 32) {
        throw new Error("Profundidad Excedida: Límite de 32 niveles alcanzado en Fusión de datos.");
    }

    for (const llave in Parcial) {
        if (!Object.hasOwn(Parcial, llave)) continue;

        const valorParcial = Parcial[llave];

        if (Array.isArray(valorParcial)) {
            // "SI es Lista ENTONCES Sobrescribir Principal[Llave]"
            Principal[llave] = valorParcial;
        } else if (valorParcial !== null && typeof valorParcial === 'object') {
            // "SI es Objeto ENTONCES..."
            if (Principal[llave]) {
                // "SI existe en Principal ENTONCES Fusionar(...)"
                Fusionar(Principal[llave], valorParcial, Nivel_Actual + 1);
            } else {
                // "SI NO ENTONCES Principal[Llave] = Parcial[Llave]"
                Principal[llave] = valorParcial;
            }
        } else {
            // "SI NO ENTONCES Principal[Llave] = Parcial[Llave]"
            Principal[llave] = valorParcial;
        }
    }
}

// Inicializador del Engine
let rootNode = null;

function triggerGlobalRestore() {
    if (!rootNode) return;

    // Función recursiva para restaurar estado en todo el árbol
    const restaurarArbol = (node) => {
        if (!node) return;
        node.restaurarEstado();
        node.children.forEach(child => restaurarArbol(child));
    };

    restaurarArbol(rootNode);
}

// Configurar escuchadores globales para RestaurarEstado
function setupRestoreTriggers() {
    // 1. "Mouse-Leave"
    document.addEventListener('mouseleave', () => {
        triggerGlobalRestore();
    });

    // 2. "Fin-de-Scroll"
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            triggerGlobalRestore();
        }, 150); // 150ms después de que termine el scroll
    }, { passive: true });

    window.addEventListener('wheel', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            triggerGlobalRestore();
        }, 150);
    }, { passive: true });
}

export async function initEngine(jsonUrl) {
    try {
        const response = await fetch(jsonUrl);
        const data = await response.json();

        initInputMapping();
        EngineTicker.start();
        setupRestoreTriggers();

        const appDom = document.getElementById('app');

        // Desmontar el nodo raíz anterior si existe para permitir recarga
        if (rootNode) {
            rootNode.unmount();
            rootNode = null;
        }

        // Resetear contador global de Z-Index
        RenderNode.globalZCounter = 0;

        rootNode = new RenderNode(data, appDom, "app", 0, 0);
        rootNode.mount();

        console.log("Motor V4 inicializado correctamente con", jsonUrl);
    } catch (error) {
        console.error("Error al inicializar el motor:", error);
    }
}

// Autoejecución si se carga como módulo y existe index.html (opcional, útil para pruebas rápidas)
if (typeof document !== 'undefined') {
    document.addEventListener("DOMContentLoaded", () => {
        // En nuestro caso el HTML asume que engine.js podría exportar,
        // pero vamos a auto-arrancar si tenemos data.json localmente
        initEngine('./data.json').catch(()=> console.log("Carga diferida"));
    });
}
