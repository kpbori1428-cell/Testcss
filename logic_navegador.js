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
                    <input type="text" id="nav-url-input" value="https://example.com" style="flex:1; border:none; outline:none; font-family: sans-serif; background: transparent; pointer-events: auto;">
                    <button id="nav-go-btn" style="border:none; background: #007bff; color:white; border-radius: 10px; padding: 5px 10px; cursor: pointer; pointer-events: auto;">Ir</button>
                `;

                // Usaremos un iframe estándar, pero su src apuntará a nuestro Service Worker proxy pattern
                // El prefijo "/sw/" le dirá a nuestro Service Worker (sw.js) que intercepte y modifique esta petición.
                webviewNode.domElement.innerHTML = `
                    <iframe id="nav-iframe" src="/sw/https://example.com" sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-downloads" style="width:100%; height:100%; border:none; pointer-events:auto; background:white;"></iframe>
                `;

                const goBtn = document.getElementById("nav-go-btn");
                const urlInput = document.getElementById("nav-url-input");
                const iframe = document.getElementById("nav-iframe");

                goBtn.addEventListener("click", () => {
                    let url = urlInput.value.trim();
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;

                    }
                    // Actualizar el valor visual del input para que coincida con el iframe inmediatamente
                    urlInput.value = url;

                    if (window.SistemaOperativo && window.SistemaOperativo.modoAvion) {
                        iframe.srcdoc = "<h2 style='font-family:sans-serif; text-align:center; margin-top: 50px;'>Sin Conexión: Modo Avión Activado</h2>";
                        iframe.removeAttribute("src");
                    } else {
                        // Enrutamos a través de nuestro prefijo mágico interceptado por el Service Worker
                        iframe.src = `/sw/${url}`;
                    }
                });

                urlInput.addEventListener("keypress", (e) => {
                    if (e.key === "Enter") {
                        goBtn.click();
                    }
                });

                // Actualizar la URL de la barra de búsqueda cuando el iframe navega (interceptado por sw postMessage si se configura)
                window.addEventListener('message', (e) => {
                    if(e.data && e.data.type === 'nav-update' && e.data.url) {
                        urlInput.value = e.data.url;
                    }
                });
            }
        }, 100);
    }
}
