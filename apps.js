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
    }

    onClick() {
        console.log(`[App] CalcButton click: ${this.value}`);

        // Buscar hacia arriba el nodo que contenga CalculadoraLogic
        let currentNode = this.node;
        let appNode = null;
        while (currentNode && currentNode.parentElement) {
            currentNode = currentNode.parentElement;
            if (currentNode.appLogicInstance && currentNode.appLogicInstance.handleButtonClick) {
                appNode = currentNode;
                break;
            }
        }

        if (appNode) {
            appNode.appLogicInstance.handleButtonClick(this.value);
        } else {
            console.warn(`[App] No se encontró la Calculadora padre para el botón: ${this.value}`);
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
// Lógica de Sistema Operativo: Launcher y Home
// ==========================================
export class AppLauncherLogic {
    constructor(node) {
        this.node = node;
        this.appJson = node.app_json; // El archivo JSON a cargar definido en el config
    }

    async onClick() {
        if (!this.appJson) {
            console.warn(`[AppLauncher] No se definió app_json para el icono ${this.node.id}`);
            return;
        }

        console.log(`[AppLauncher] Lanzando app desde ${this.appJson}...`);

        try {
            // Fetch del JSON de la aplicación
            const response = await fetch(`./${this.appJson}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const appData = await response.json();

            // Buscar la pantalla del teléfono donde se inyectará la app
            // Normalmente la ruta del icono es algo como app.escena_telefono.cuerpo_telefono.pantalla_telefono.grid_apps...
            const pathParts = this.node.path.split('.');
            const pantallaIndex = pathParts.indexOf('pantalla_telefono');

            if (pantallaIndex === -1) {
                console.error("[AppLauncher] No se pudo encontrar el nodo 'pantalla_telefono' en la ruta.");
                return;
            }

            const pantallaPath = pathParts.slice(0, pantallaIndex + 1).join('.');
            const pantallaNode = RenderNode.registry.get(pantallaPath);

            if (pantallaNode) {
                // Asegurar que la nueva app sea visible usando z-index lógico (z superior y position absolute)
                // y limpiamos las apps previas si existen (buscamos hijos que empiecen con "app_view_")
                let nuevosHijos = (pantallaNode.hijosDatos || []).filter(child => !child.id.startsWith('app_view_'));

                // Forzar que la nueva app ocupe el espacio
                appData.Propiedades_Esteticas = appData.Propiedades_Esteticas || {};
                appData.Propiedades_Esteticas.position = 'absolute';
                appData.Propiedades_Esteticas.top = '0';
                appData.Propiedades_Esteticas.left = '0';
                appData.Propiedades_Esteticas.width = '100%';
                appData.Propiedades_Esteticas.height = '100%';
                appData.Propiedades_Esteticas.zIndex = '10'; // para tapar el grid
                appData.Transform_Base = appData.Transform_Base || { x:0, y:0, z:5, rx:0, ry:0, rz:0, scale:1 };

                nuevosHijos.push(appData);

                // Aplicar el parche para desencadenar el montaje de la nueva app
                pantallaNode.aplicarParche({ Hijos: nuevosHijos });
            }
        } catch (error) {
            console.error(`[AppLauncher] Error al cargar la aplicación ${this.appJson}:`, error);
        }
    }
}

export class HomeButtonLogic {
    constructor(node) {
        this.node = node;
    }

    onClick() {
        console.log(`[HomeButton] Volviendo a la pantalla de inicio...`);
        // Buscar la pantalla del teléfono
        const pathParts = this.node.path.split('.');
        const pantallaIndex = pathParts.indexOf('pantalla_telefono');

        if (pantallaIndex === -1) return;

        const pantallaPath = pathParts.slice(0, pantallaIndex + 1).join('.');
        const pantallaNode = RenderNode.registry.get(pantallaPath);

        if (pantallaNode) {
            // Filtrar y eliminar cualquier hijo que sea una "app_view_"
            let nuevosHijos = (pantallaNode.hijosDatos || []).filter(child => !child.id.startsWith('app_view_'));

            // Aplicar el parche
            pantallaNode.aplicarParche({ Hijos: nuevosHijos });
        }
    }
}


// ==========================================
// Lógica Real: Mapa
// ==========================================
export class MapaLogic {
    constructor(node) {
        this.node = node;
    }

    onMount() {
        console.log(`[App] Mapa Montado en: ${this.node.path}`);

        setTimeout(() => {
            const contenedorPath = `${this.node.path}.mapa_contenedor`;
            const contenedorNode = RenderNode.registry.get(contenedorPath);
            if (contenedorNode && contenedorNode.domElement) {
                // Inyectamos un iframe de OpenStreetMap para un mapa real, funcional e interactivo
                contenedorNode.domElement.innerHTML = `
                    <iframe
                        width="100%"
                        height="100%"
                        frameborder="0"
                        scrolling="no"
                        marginheight="0"
                        marginwidth="0"
                        src="https://www.openstreetmap.org/export/embed.html?bbox=-122.46368408203126%2C37.75825310931536%2C-122.37373352050783%2C37.81050800642958&amp;layer=mapnik"
                        style="border: 0; pointer-events: auto;">
                    </iframe>
                `;
            }
        }, 100);
    }
}

// ==========================================
// Lógica Real: Navegador
// ==========================================
export class NavegadorLogic {
    constructor(node) {
        this.node = node;
    }

    onMount() {
        console.log(`[App] Navegador Montado en: ${this.node.path}`);

        setTimeout(() => {
            const barraPath = `${this.node.path}.barra_busqueda_container`;
            const barraNode = RenderNode.registry.get(barraPath);
            const webviewPath = `${this.node.path}.webview_contenedor`;
            const webviewNode = RenderNode.registry.get(webviewPath);

            if (barraNode && barraNode.domElement && webviewNode && webviewNode.domElement) {
                // Inyectamos un input HTML nativo y un botón "Ir"
                barraNode.domElement.innerHTML = `
                    <input type="text" id="nav-url-input" value="https://es.wikipedia.org" style="flex:1; border:none; outline:none; font-family: sans-serif; background: transparent; pointer-events: auto;">
                    <button id="nav-go-btn" style="border:none; background: #007bff; color:white; border-radius: 10px; padding: 5px 10px; cursor: pointer; pointer-events: auto;">Ir</button>
                `;

                // Inyectamos el iframe (el "motor de renderizado" de nuestro navegador real)
                webviewNode.domElement.innerHTML = `
                    <iframe id="nav-iframe" src="https://es.wikipedia.org" style="width:100%; height:100%; border:none; pointer-events:auto;" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
                `;

                // Agregar funcionalidad al botón de "Ir"
                const goBtn = document.getElementById("nav-go-btn");
                const urlInput = document.getElementById("nav-url-input");
                const iframe = document.getElementById("nav-iframe");

                goBtn.addEventListener("click", () => {
                    let url = urlInput.value.trim();
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                        urlInput.value = url;
                    }

                    // Comprobar si hay modo avión activo a nivel de window o DOM
                    if (window.SistemaOperativo && window.SistemaOperativo.modoAvion) {
                        iframe.srcdoc = "<h2 style='font-family:sans-serif; text-align:center; margin-top: 50px;'>Sin Conexión: Modo Avión Activado</h2>";
                        iframe.removeAttribute("src");
                    } else {
                        iframe.src = url;
                    }
                });

                // Permitir presionar Enter para buscar
                urlInput.addEventListener("keypress", (e) => {
                    if (e.key === "Enter") {
                        goBtn.click();
                    }
                });
            }
        }, 100);
    }
}

// ==========================================
// Lógica Real: Ajustes
// ==========================================
export class AjustesLogic {
    constructor(node) {
        this.node = node;

        // Inicializar estado global si no existe
        if (!window.SistemaOperativo) {
            window.SistemaOperativo = {
                modoAvion: false,
                modoOscuro: false
            };
        }

        this.opciones = [
            { id: "avion", nombre: "Modo Avión", tipo: "toggle", valor: window.SistemaOperativo.modoAvion },
            { id: "oscuro", nombre: "Modo Oscuro (Fondo)", tipo: "toggle", valor: window.SistemaOperativo.modoOscuro },
            { id: "wallpaper", nombre: "Cambiar Fondo", tipo: "button", estado: "" }
        ];
    }

    onMount() {
        console.log(`[App] Ajustes Montados en: ${this.node.path}`);

        setTimeout(() => {
            for (let i = 0; i < this.opciones.length; i++) {
                const itemPath = `${this.node.path}.ajuste_item:ins[${i}]`;
                const itemNode = RenderNode.registry.get(itemPath);

                if (itemNode && itemNode.domElement) {
                    itemNode.aplicarParche({
                        Propiedades_Esteticas: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 15px',
                            color: 'white',
                            fontFamily: 'sans-serif',
                            fontSize: '14px'
                        }
                    });

                    const opt = this.opciones[i];

                    if (opt.tipo === "toggle") {
                        const checked = opt.valor ? "checked" : "";
                        itemNode.domElement.innerHTML = `
                            <span>${opt.nombre}</span>
                            <label style="position: relative; display: inline-block; width: 40px; height: 20px; pointer-events: auto;">
                                <input type="checkbox" id="toggle-${opt.id}" ${checked} style="opacity: 0; width: 0; height: 0; pointer-events: auto;">
                                <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${opt.valor ? '#4caf50' : '#ccc'}; border-radius: 20px; transition: .4s;">
                                    <span style="position: absolute; content: ''; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; border-radius: 50%; transition: .4s; transform: translateX(${opt.valor ? '20px' : '0'});"></span>
                                </span>
                            </label>
                        `;

                        // Agregar event listener al toggle nativo
                        const input = itemNode.domElement.querySelector(`#toggle-${opt.id}`);
                        const sliderBg = itemNode.domElement.querySelector(`.slider`);
                        const sliderKnob = itemNode.domElement.querySelector(`.slider > span`);

                        input.addEventListener('change', (e) => {
                            const isChecked = e.target.checked;
                            // Animar CSS visualmente
                            sliderBg.style.backgroundColor = isChecked ? '#4caf50' : '#ccc';
                            sliderKnob.style.transform = isChecked ? 'translateX(20px)' : 'translateX(0)';

                            // Aplicar lógica real al Sistema Operativo
                            if (opt.id === "avion") {
                                window.SistemaOperativo.modoAvion = isChecked;
                                console.log("[OS] Modo Avión:", isChecked ? "Activado" : "Desactivado");
                            } else if (opt.id === "oscuro") {
                                window.SistemaOperativo.modoOscuro = isChecked;
                                console.log("[OS] Modo Oscuro:", isChecked ? "Activado" : "Desactivado");

                                // Cambiar el fondo global de la página
                                document.body.style.backgroundColor = isChecked ? '#000' : '#111';

                                // Opcional: Cambiar color de fondo del teléfono
                                const appDom = document.getElementById('app');
                                if (appDom) {
                                    appDom.style.filter = isChecked ? 'brightness(0.7)' : 'brightness(1)';
                                }
                            }
                        });

                    } else if (opt.tipo === "button") {
                        itemNode.domElement.innerHTML = `
                            <span>${opt.nombre}</span>
                            <button id="btn-${opt.id}" style="border:none; border-radius:10px; padding:5px 10px; background:#007bff; color:white; cursor:pointer; pointer-events:auto;">Cambiar</button>
                        `;

                        const btn = itemNode.domElement.querySelector(`#btn-${opt.id}`);
                        btn.addEventListener('click', () => {
                            // Cambiar el fondo del teléfono (RenderNode root o fondo pantalla)
                            const pathParts = this.node.path.split('.');
                            const pantallaIndex = pathParts.indexOf('pantalla_telefono');
                            if (pantallaIndex !== -1) {
                                const pantallaPath = pathParts.slice(0, pantallaIndex + 1).join('.');
                                const pantallaNode = RenderNode.registry.get(pantallaPath);
                                if (pantallaNode) {
                                    // Cambiamos el color de fondo a uno aleatorio para demostrar cambio real persistente
                                    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
                                    pantallaNode.aplicarParche({
                                        Propiedades_Esteticas: {
                                            background: randomColor
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            }
        }, 100);
    }
}


// ==========================================
// Registrar en el Motor
// ==========================================
export function registerAllApps() {
    RenderNode.registerAppLogic("Calculadora", CalculadoraLogic);
    RenderNode.registerAppLogic("CalcButton", CalcButtonLogic);
    RenderNode.registerAppLogic("Galeria", GaleriaLogic);
    RenderNode.registerAppLogic("Mapa", MapaLogic);
    RenderNode.registerAppLogic("Navegador", NavegadorLogic);
    RenderNode.registerAppLogic("Ajustes", AjustesLogic);
    RenderNode.registerAppLogic("AppLauncher", AppLauncherLogic);
    RenderNode.registerAppLogic("HomeButton", HomeButtonLogic);
    console.log("[Engine] Lógicas de Aplicación registradas.");
}
