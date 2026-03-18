const fs = require('fs');
let engineJs = fs.readFileSync('engine.js', 'utf8');

const aplicarParcheStart = engineJs.indexOf('aplicarParche(parche) {');
const endAplicarParche = engineJs.indexOf('// A. Gestión de Cámara de Memoria', aplicarParcheStart);

let oldFunc = engineJs.substring(aplicarParcheStart, endAplicarParche);

let newFunc = `aplicarParche(parche) {
        if (parche.Propiedades_Esteticas) {
            for (const [key, value] of Object.entries(parche.Propiedades_Esteticas)) {
                this.propiedadesEsteticas[key] = value;
                if (this.domElement) {
                    this.domElement.style[key] = value;
                }
            }
        }
        if (parche.Transform_Base) {
            Fusionar(this.transformBase, parche.Transform_Base);
            this.targetTransform = { ...this.transformBase };
        }
        if (parche.Directivas_Logicas) {
            Fusionar(this.directivasLogicas, parche.Directivas_Logicas);
        }
        if (parche.Hijos) {
            // Desmontar hijos actuales
            this.children.forEach(child => child.unmount());
            this.children = [];

            // Reemplazar datos de hijos
            this.hijosDatos = parche.Hijos;

            // Montar nuevos hijos
            this.hijosDatos.forEach((hijoData, index) => {
                // Manejo de regla de instancias (clonación procedimental con sufijo)
                if (hijoData.Instancias) {
                    for (let i = 0; i < hijoData.Instancias; i++) {
                        const instData = { ...hijoData, id: \`\${hijoData.id}:ins[\${i}]\` };
                        delete instData.Instancias; // Evitar loop infinito
                        const childNode = new RenderNode(instData, this.domElement, this.path, this.level + 1, index + i);
                        childNode.mount();
                        this.children.push(childNode);
                    }
                } else {
                    const childNode = new RenderNode(hijoData, this.domElement, this.path, this.level + 1, index);
                    childNode.mount();
                    this.children.push(childNode);
                }
            });
        }
    }

    `;

engineJs = engineJs.replace(oldFunc, newFunc);
fs.writeFileSync('engine.js', engineJs);
