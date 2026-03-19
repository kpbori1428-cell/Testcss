import { RenderNode } from './engine.js';

export class GaleriaLogic {
    constructor(node) {
        this.node = node;
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
        setTimeout(() => {
            for (let i = 0; i < this.images.length; i++) {
                const fotoPath = `${this.node.path}.foto_galeria:ins[${i}]`;
                const fotoNode = RenderNode.registry.get(fotoPath);

                if (fotoNode) {
                    fotoNode.aplicarParche({
                        Propiedades_Esteticas: {
                            backgroundImage: `url('${this.images[i]}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }
                    });
                }
            }
        }, 100);
    }
}
