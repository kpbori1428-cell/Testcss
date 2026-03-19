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

            if (barraNode && barraNode.domElement && webviewNode) {
                barraNode.domElement.innerHTML = `
                    <input type="text" id="nav-url-input" value="https://example.com" style="flex:1; border:none; outline:none; font-family: sans-serif; background: transparent; pointer-events: auto;">
                    <button id="nav-go-btn" style="border:none; background: #007bff; color:white; border-radius: 10px; padding: 5px 10px; cursor: pointer; pointer-events: auto;">Ir</button>
                `;

                const goBtn = document.getElementById("nav-go-btn");
                const urlInput = document.getElementById("nav-url-input");

                goBtn.addEventListener("click", () => {
                    let url = urlInput.value.trim();
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                        urlInput.value = url;
                    }

                    if (window.SistemaOperativo && window.SistemaOperativo.modoAvion) {
                        webviewNode.aplicarParche({
                            Hijos: [{
                                id: "error_avion",
                                Propiedades_Esteticas: { width: "100%", textAlign: "center", marginTop: "50px" },
                                innerHTML: "<h2>Sin Conexión: Modo Avión Activado</h2>"
                            }]
                        });
                    } else {
                        webviewNode.aplicarParche({
                            Hijos: [{
                                id: "loading_msg",
                                Propiedades_Esteticas: { width: "100%", textAlign: "center", marginTop: "50px" },
                                innerHTML: "<h3>Cargando y traduciendo página...</h3>"
                            }]
                        });
                        this.fetchAndTranslate(url, webviewNode);
                    }
                });

                urlInput.addEventListener("keypress", (e) => {
                    if (e.key === "Enter") {
                        goBtn.click();
                    }
                });
            }
        }, 100);
    }

    async fetchAndTranslate(url, containerNode) {
        try {
            // Llama a nuestro proxy local para descargar el HTML saltando CORS
            const response = await fetch(`http://localhost:3000/proxy?url=${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`Error ${response.status} del proxy`);
            const htmlString = await response.text();

            // Usar el navegador (DOMParser) para interpretar el HTML crudo
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');

            // Comenzar la traducción recursiva desde el body
            let translatedChildren = [];
            let counter = { id: 0 };

            // Vamos a procesar los hijos directos del body
            if (doc.body) {
                Array.from(doc.body.childNodes).forEach(child => {
                    const nodeJson = this.domNodeToJson(child, counter, url);
                    if (nodeJson) {
                        translatedChildren.push(nodeJson);
                    }
                });
            }

            // Aplicar el parche al motor 3D
            containerNode.aplicarParche({
                Hijos: translatedChildren
            });
            console.log("[Traductor] Traducción finalizada e inyectada.");

        } catch (error) {
            console.error("Error traduciendo la página:", error);
            containerNode.aplicarParche({
                Hijos: [{
                    id: "error_carga",
                    Propiedades_Esteticas: { width: "100%", textAlign: "center", color: "red", marginTop: "50px" },
                    innerHTML: `<h3>Error al cargar:</h3><p>${error.message}</p>`
                }]
            });
        }
    }

    domNodeToJson(node, counter, baseUrl) {
        // Ignorar comentarios
        if (node.nodeType === Node.COMMENT_NODE) return null;

        // Manejar Nodos de Texto puros
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (!text) return null; // Ignorar espacios en blanco

            counter.id++;
            return {
                id: `txt_${counter.id}`,
                Propiedades_Esteticas: {
                    position: "relative",
                    display: "inline-block",
                    margin: "2px"
                },
                innerHTML: text
            };
        }

        // Manejar Nodos de Elemento
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();

            // Filtro de seguridad destructiva: ignorar scripts para no romper nuestro engine
            if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'iframe') {
                return null;
            }

            counter.id++;
            const nodeJson = {
                id: `${tag}_${counter.id}`,
                Propiedades_Esteticas: {
                    position: "relative",
                    display: "block",
                    boxSizing: "border-box"
                },
                Hijos: []
            };

            // Extraer estilos básicos para imitar flujo de documento normal
            const computedStyle = window.getComputedStyle(node);

            // Asignar comportamientos visuales por tipo de etiqueta
            switch(tag) {
                case 'h1': nodeJson.Propiedades_Esteticas.fontSize = "32px"; nodeJson.Propiedades_Esteticas.fontWeight = "bold"; nodeJson.Propiedades_Esteticas.marginBottom = "15px"; break;
                case 'h2': nodeJson.Propiedades_Esteticas.fontSize = "24px"; nodeJson.Propiedades_Esteticas.fontWeight = "bold"; nodeJson.Propiedades_Esteticas.marginBottom = "10px"; break;
                case 'h3': nodeJson.Propiedades_Esteticas.fontSize = "20px"; nodeJson.Propiedades_Esteticas.fontWeight = "bold"; nodeJson.Propiedades_Esteticas.marginBottom = "10px"; break;
                case 'p': nodeJson.Propiedades_Esteticas.marginBottom = "10px"; nodeJson.Propiedades_Esteticas.lineHeight = "1.5"; break;
                case 'a':
                    nodeJson.Propiedades_Esteticas.color = "blue";
                    nodeJson.Propiedades_Esteticas.textDecoration = "underline";
                    nodeJson.Propiedades_Esteticas.cursor = "pointer";
                    nodeJson.Propiedades_Esteticas.pointerEvents = "auto";
                    break;
                case 'img':
                case 'video':
                    // Para multimedia, inyectar directamente el HTML crudo adaptando la URL
                    let src = node.getAttribute('src');
                    if (src && !src.startsWith('http')) {
                        try { src = new URL(src, baseUrl).href; } catch(e){}
                    }
                    nodeJson.Propiedades_Esteticas.maxWidth = "100%";
                    nodeJson.Propiedades_Esteticas.height = "auto";
                    if (tag === 'img') {
                        nodeJson.innerHTML = `<img src="${src}" style="max-width:100%; height:auto;">`;
                    } else {
                        nodeJson.innerHTML = `<video src="${src}" controls style="max-width:100%; height:auto;"></video>`;
                    }
                    return nodeJson; // No procesar hijos del img/video
            }

            // Flexbox layout para spans, strongs, bs, que deben fluir inline
            if (['span', 'strong', 'b', 'i', 'em', 'a'].includes(tag)) {
                nodeJson.Propiedades_Esteticas.display = "inline-block";
                nodeJson.Propiedades_Esteticas.marginRight = "4px";
            }

            // Manejo recursivo de Hijos
            Array.from(node.childNodes).forEach(childNode => {
                const childJson = this.domNodeToJson(childNode, counter, baseUrl);
                if (childJson) {
                    nodeJson.Hijos.push(childJson);
                }
            });

            // Optimización: si es un <div> pero solo contiene un texto, simplificar
            if (nodeJson.Hijos.length === 1 && nodeJson.Hijos[0].id.startsWith('txt_')) {
                nodeJson.innerHTML = nodeJson.Hijos[0].innerHTML;
                nodeJson.Hijos = []; // Limpiar array de hijos para ahorrar memoria RAM
            }

            return nodeJson;
        }

        return null;
    }
}
