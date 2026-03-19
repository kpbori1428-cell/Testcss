import { RenderNode } from './engine.js';

export class AjustesLogic {
    constructor(node) {
        this.node = node;
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

                        const input = itemNode.domElement.querySelector(`#toggle-${opt.id}`);
                        const sliderBg = itemNode.domElement.querySelector(`.slider`);
                        const sliderKnob = itemNode.domElement.querySelector(`.slider > span`);

                        input.addEventListener('change', (e) => {
                            const isChecked = e.target.checked;
                            sliderBg.style.backgroundColor = isChecked ? '#4caf50' : '#ccc';
                            sliderKnob.style.transform = isChecked ? 'translateX(20px)' : 'translateX(0)';

                            if (opt.id === "avion") {
                                window.SistemaOperativo.modoAvion = isChecked;
                                console.log("[OS] Modo Avión:", isChecked ? "Activado" : "Desactivado");
                            } else if (opt.id === "oscuro") {
                                window.SistemaOperativo.modoOscuro = isChecked;
                                console.log("[OS] Modo Oscuro:", isChecked ? "Activado" : "Desactivado");
                                document.body.style.backgroundColor = isChecked ? '#000' : '#111';
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
                            const pathParts = this.node.path.split('.');
                            const pantallaIndex = pathParts.indexOf('pantalla_telefono');
                            if (pantallaIndex !== -1) {
                                const pantallaPath = pathParts.slice(0, pantallaIndex + 1).join('.');
                                const pantallaNode = RenderNode.registry.get(pantallaPath);
                                if (pantallaNode) {
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
