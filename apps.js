import { RenderNode } from './engine.js';

// ==========================================
// Lógica de Sistema Operativo: Launcher de Apps Dinámico
// ==========================================
export class OS_LauncherLogic {
    constructor(node) {
        this.node = node;
    }

    async onMount() {
        console.log(`[OS_Launcher] Montado en: ${this.node.path}. Iniciando carga de apps...`);
        try {
            // 1. Leer instaladas.json
            const response = await fetch('./instaladas.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const appsInstaladas = await response.json();

            let iconosCargados = [];

            // 2. Iterar sobre las apps instaladas
            for (const [appKey, appData] of Object.entries(appsInstaladas)) {
                try {
                    // Cargar el icono visual JSON
                    const iconResponse = await fetch(`./${appData.icon_json}`);
                    const iconConfig = await iconResponse.json();

                    // Asegurar que el icono usa AppLauncher si no tiene otro definido
                    if (!iconConfig.App_Logic) iconConfig.App_Logic = "AppLauncher";
                    iconosCargados.push(iconConfig);

                    // Importar dinámicamente el cerebro JS (la clase lógica)
                    const appModule = await import(`./${appData.logic_js}`);
                    const AppLogicClass = appModule[appData.logic_class];

                    // Registrar la lógica en el motor con el nombre de la clase
                    RenderNode.registerAppLogic(appData.logic_class.replace('Logic', ''), AppLogicClass);

                    // Si la app exporta otros botones (como CalcButton), registrarlos también si están en el módulo
                    for (const key of Object.keys(appModule)) {
                        if (key.endsWith('Logic') && key !== appData.logic_class) {
                            RenderNode.registerAppLogic(key.replace('Logic', ''), appModule[key]);
                        }
                    }

                    console.log(`[OS_Launcher] Cargada app: ${appKey}`);
                } catch (e) {
                    console.error(`[OS_Launcher] Error cargando app ${appKey}:`, e);
                }
            }

            // 3. Inyectar los iconos en el grid actual
            this.node.aplicarParche({
                Hijos: iconosCargados
            });

        } catch (error) {
            console.error(`[OS_Launcher] Error leyendo instaladas.json:`, error);
        }
    }
}

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
            const pathParts = this.node.path.split('.');
            const pantallaIndex = pathParts.indexOf('pantalla_telefono');

            if (pantallaIndex === -1) {
                console.error("[AppLauncher] No se pudo encontrar el nodo 'pantalla_telefono' en la ruta.");
                return;
            }

            const pantallaPath = pathParts.slice(0, pantallaIndex + 1).join('.');
            const pantallaNode = RenderNode.registry.get(pantallaPath);

            if (pantallaNode) {
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
        const pathParts = this.node.path.split('.');
        const pantallaIndex = pathParts.indexOf('pantalla_telefono');

        if (pantallaIndex === -1) return;

        const pantallaPath = pathParts.slice(0, pantallaIndex + 1).join('.');
        const pantallaNode = RenderNode.registry.get(pantallaPath);

        if (pantallaNode) {
            let nuevosHijos = (pantallaNode.hijosDatos || []).filter(child => !child.id.startsWith('app_view_'));
            pantallaNode.aplicarParche({ Hijos: nuevosHijos });
        }
    }
}

// ==========================================
// Registrar en el Motor base (OS + Launcher)
// ==========================================
export function registerAllApps() {
    RenderNode.registerAppLogic("OS_Launcher", OS_LauncherLogic);
    RenderNode.registerAppLogic("AppLauncher", AppLauncherLogic);
    RenderNode.registerAppLogic("HomeButton", HomeButtonLogic);
    console.log("[Engine] Lógicas Base del OS registradas.");
}
