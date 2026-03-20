const fs = require('fs');
let appsJs = fs.readFileSync('apps.js', 'utf8');

const oldLogic = `        // Buscar hacia arriba el nodo que contenga CalculadoraLogic
        let currentNode = this.node;
        let appNode = null;
        while (currentNode && currentNode.parentElement) {
            currentNode = currentNode.parentElement;
            if (currentNode.appLogicInstance && currentNode.appLogicInstance.handleButtonClick) {
                appNode = currentNode;
                break;
            }
        }`;

const newLogic = `        // Buscar hacia arriba el nodo que contenga CalculadoraLogic
        let currentPath = this.node.path;
        let appNode = null;

        while (currentPath.includes('.')) {
            currentPath = currentPath.substring(0, currentPath.lastIndexOf('.'));
            const parentNode = RenderNode.registry.get(currentPath);
            if (parentNode && parentNode.appLogicInstance && parentNode.appLogicInstance.handleButtonClick) {
                appNode = parentNode;
                break;
            }
        }`;

appsJs = appsJs.replace(oldLogic, newLogic);
fs.writeFileSync('apps.js', appsJs);
