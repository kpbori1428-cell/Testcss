import { RenderNode } from './engine.js';

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
                barraNode.domElement.innerHTML = `
                    <input type="text" id="nav-url-input" value="https://eficell.cl" readonly style="flex:1; border:none; outline:none; font-family: sans-serif; background: transparent; pointer-events: none; color: gray;">
                    <button id="nav-go-btn" style="border:none; background: #ccc; color:white; border-radius: 10px; padding: 5px 10px; cursor: not-allowed; pointer-events: none;">Ir</button>
                `;

                webviewNode.domElement.innerHTML = `
                    <iframe id="nav-iframe" sandbox="allow-scripts allow-forms allow-popups allow-downloads allow-same-origin" style="width:100%; height:100%; border:none; pointer-events:auto; background:white;"></iframe>
                `;

                const goBtn = document.getElementById("nav-go-btn");
                const urlInput = document.getElementById("nav-url-input");
                const iframe = document.getElementById("nav-iframe");

                // Esperar a que el Service Worker esté activo antes de navegar
                const loadUrl = (url) => {
                    // Limpiar el srcdoc en caso de que viniéramos del modo avión
                    if (iframe.hasAttribute("srcdoc")) {
                        iframe.removeAttribute("srcdoc");
                    }

                    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        iframe.src = `/sw/${url}`;
                    } else {
                        // Si el Service Worker no está listo aún, esperamos a que esté activo
                        console.log("[Navegador] Esperando que el Service Worker esté listo...");
                        navigator.serviceWorker.ready.then(() => {
                            iframe.src = `/sw/${url}`;
                        });
                    }
                };

                // Carga inicial
                if (window.SistemaOperativo && window.SistemaOperativo.modoAvion) {
                    iframe.srcdoc = "<h2 style='font-family:sans-serif; text-align:center; margin-top: 50px;'>Sin Conexión: Modo Avión Activado</h2>";
                    iframe.removeAttribute("src");
                } else {
                    loadUrl("https://eficell.cl");
                }

                // Remove interaction listeners since we are locking it to eficell.cl

                // Actualizar la URL de la barra de búsqueda cuando el iframe navega (interceptado por sw postMessage)
                window.addEventListener('message', (e) => {
                    if(e.data && e.data.type === 'nav-update' && e.data.url) {
                        urlInput.value = e.data.url;
                    }
                });
            }
        }, 100);
    }
}
