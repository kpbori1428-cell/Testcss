import { RenderNode } from './engine.js';

// ==========================================
// Lógica Real: Calculadora
// ==========================================
export class CalculadoraLogic {
    constructor(node) {
        this.node = node;
        this.currentValue = "0";
        this.previousValue = null;
        this.operator = null;
        this.waitingForNewValue = false;

        // La ruta a la pantalla será dinámica basada en la estructura del JSON
        // Asume: ...app_view_calculadora.pantalla_calculadora.texto_pantalla
        this.screenNodePath = `${this.node.path}.pantalla_calculadora.texto_pantalla`;
    }

    onMount() {
        console.log(`[App] Calculadora Montada en: ${this.node.path}`);
        this.updateScreen();
    }

    handleButtonClick(value) {
        if (!isNaN(value) || value === ".") {
            this.handleNumber(value);
        } else if (value === "C") {
            this.handleClear();
        } else if (value === "=") {
            this.handleCalculate();
        } else {
            this.handleOperator(value);
        }
        this.updateScreen();
    }

    handleNumber(num) {
        if (this.waitingForNewValue) {
            this.currentValue = num;
            this.waitingForNewValue = false;
        } else {
            this.currentValue = this.currentValue === "0" && num !== "." ? num : this.currentValue + num;
        }
    }

    handleOperator(op) {
        // Calcular de inmediato si ya hay una operación pendiente (encadenar)
        if (this.operator && !this.waitingForNewValue) {
            this.handleCalculate();
        }
        this.operator = op;
        this.previousValue = this.currentValue;
        this.waitingForNewValue = true;
    }

    handleCalculate() {
        if (!this.operator || this.previousValue === null) return;

        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);
        let result = 0;

        switch(this.operator) {
            case "+": result = prev + current; break;
            case "-": result = prev - current; break;
            case "*": result = prev * current; break;
            case "/": result = prev / current; break;
        }

        // Redondear para evitar errores de coma flotante de JS (ej. 0.1 + 0.2)
        this.currentValue = String(Math.round(result * 1000000) / 1000000);
        this.operator = null;
        this.previousValue = null;
        this.waitingForNewValue = true;
    }

    handleClear() {
        this.currentValue = "0";
        this.previousValue = null;
        this.operator = null;
        this.waitingForNewValue = false;
    }

    updateScreen() {
        // En lugar de enviar un parche por bus, localizamos el nodo y actualizamos su innerHTML.
        // Como el motor reconstruye DOMs cuando cambian las props, es mejor mutar directo en RenderNode
        const screenNode = RenderNode.registry.get(this.screenNodePath);
        if (screenNode && screenNode.domElement) {
            screenNode.innerHTML = this.currentValue;
            screenNode.domElement.innerHTML = this.currentValue;
        }
    }
}

// Botones de la Calculadora
export class CalcButtonLogic {
    constructor(node) {
        this.node = node;
        this.value = node.innerHTML.trim(); // Tomamos el símbolo (+, -, 7, =) del propio texto del botón

        // Calculamos la ruta base de la app (dos niveles arriba: ...teclado.btn_X -> ...app_view_calculadora)
        const parts = this.node.path.split(".");
        this.appPath = parts.slice(0, -2).join(".");
    }

    onClick() {
        console.log(`[App] CalcButton click: ${this.value} en path ${this.appPath}`);
        // Buscar la instancia de la app padre
        const appNode = RenderNode.registry.get(this.appPath);
        if (appNode && appNode.appLogicInstance) {
            // Ejecutar la matemática real
            appNode.appLogicInstance.handleButtonClick(this.value);
        } else {
            console.warn(`[App] No se encontró appNode en path: ${this.appPath}`);
        }
    }
}


// ==========================================
// Lógica Real: Galería (Carga dinámica de fotos reales)
// ==========================================
export class GaleriaLogic {
    constructor(node) {
        this.node = node;
        // Imágenes reales (ejemplo de Picsum / Unsplash)
        this.images = [
            "https://picsum.photos/id/1018/200/200",
            "https://picsum.photos/id/1015/200/200",
            "https://picsum.photos/id/1019/200/200",
            "https://picsum.photos/id/1016/200/200",
            "https://picsum.photos/id/1020/200/200",
            "https://picsum.photos/id/1021/200/200"
        ];
    }

    onMount() {
        console.log(`[App] Galería Montada. Descargando fotos reales...`);
        // Para inyectar las imágenes, buscamos los hijos de la galería
        // Ya que la galería genera "Instancias: 6", los hijos serán "foto_galeria:ins[0]", etc.
        setTimeout(() => {
            for (let i = 0; i < this.images.length; i++) {
                const fotoPath = `${this.node.path}.foto_galeria:ins[${i}]`;
                const fotoNode = RenderNode.registry.get(fotoPath);

                if (fotoNode) {
                    // Aplicamos el parche de estilo directamente
                    fotoNode.aplicarParche({
                        Propiedades_Esteticas: {
                            backgroundImage: `url('${this.images[i]}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }
                    });
                }
            }
        }, 100); // Pequeño retraso para asegurar que los hijos ya estén en el registry
    }
}


// ==========================================
// Registrar en el Motor
// ==========================================
export function registerAllApps() {
    RenderNode.registerAppLogic("Calculadora", CalculadoraLogic);
    RenderNode.registerAppLogic("CalcButton", CalcButtonLogic);
    RenderNode.registerAppLogic("Galeria", GaleriaLogic);
    console.log("[Engine] Lógicas de Aplicación registradas.");
}
