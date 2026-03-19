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
                    <button id="nav-toggle-ua" style="border:none; background: transparent; font-size:16px; cursor: pointer; pointer-events: auto; margin-right: 5px;" title="Cambiar a Vista PC">📱</button>
                    <input type="text" id="nav-url-input" value="https://google.com" style="flex:1; border:none; outline:none; font-family: sans-serif; background: transparent; pointer-events: auto;">
                    <button id="nav-go-btn" style="border:none; background: #007bff; color:white; border-radius: 10px; padding: 5px 10px; cursor: pointer; pointer-events: auto;">Ir</button>
                `;

                // Use Electron's <webview> instead of <iframe> for unrestricted internet access.
                // Note: useragent is initially set for a mobile experience
                const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
                const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

                webviewNode.domElement.innerHTML = `
                    <webview id="nav-iframe" src="https://google.com" useragent="${mobileUA}" style="width:100%; height:100%; border:none; pointer-events:auto;"></webview>
                `;

                const goBtn = document.getElementById("nav-go-btn");
                const urlInput = document.getElementById("nav-url-input");
                const webview = document.getElementById("nav-iframe");
                const toggleUABtn = document.getElementById("nav-toggle-ua");

                let isMobile = true;

                toggleUABtn.addEventListener("click", () => {
                    isMobile = !isMobile;
                    toggleUABtn.innerHTML = isMobile ? "📱" : "💻";
                    toggleUABtn.title = isMobile ? "Cambiar a Vista PC" : "Cambiar a Vista Móvil";
                    webview.useragent = isMobile ? mobileUA : desktopUA;
                    webview.reload(); // Recargar página con el nuevo useragent
                });

                goBtn.addEventListener("click", () => {
                    let url = urlInput.value.trim();
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                        urlInput.value = url;
                    }

                    const airplaneOverlay = document.getElementById("nav-airplane-overlay");

                    if (window.SistemaOperativo && window.SistemaOperativo.modoAvion) {
                        if (!airplaneOverlay) {
                            const overlay = document.createElement('div');
                            overlay.id = "nav-airplane-overlay";
                            overlay.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: white; display: flex; justify-content: center; align-items: center; font-family: sans-serif; color: black; z-index: 100;";
                            overlay.innerHTML = "<h2>Sin Conexión: Modo Avión Activado</h2>";
                            webviewNode.domElement.appendChild(overlay);
                        }
                        webview.style.display = 'none';
                    } else {
                        if (airplaneOverlay) {
                            airplaneOverlay.remove();
                        }
                        webview.style.display = 'block';
                        webview.src = url;
                    }
                });

                // Actualizar la URL en la barra cuando el webview navega por dentro (clicks en links)
                webview.addEventListener('did-navigate', (e) => {
                    urlInput.value = e.url;
                });

                urlInput.addEventListener("keypress", (e) => {
                    if (e.key === "Enter") {
                        goBtn.click();
                    }
                });
            }
        }, 100);
    }
}
