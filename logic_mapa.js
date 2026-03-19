import { RenderNode } from './engine.js';

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
