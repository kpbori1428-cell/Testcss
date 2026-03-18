import { fusionar } from './DeepMerge.js';
import { NodeInterface } from './NodeInterface.js';

export class NodeFactory {
    constructor() {
        this.nodes = new Map();
        this.templates = new Map();
    }

    registerTemplates(templates) {
        for (const [key, value] of Object.entries(templates)) {
            this.templates.set(key, value);
        }
    }

    createNode(data, parentPath = 'app', depth = 0) {
        if (depth > 32) {
            throw new Error(`[NodeFactory] Límite de profundidad (32) excedido en el nodo: ${data.id}`);
        }

        // Resolve templates
        if (data.template && this.templates.has(data.template)) {
            const templateData = this.templates.get(data.template);
            data = fusionar(templateData, data);
        }

        // Handle procedural instantiation logic
        if (data.logic && data.logic.instancias) {
            return this.createInstances(data, parentPath, depth);
        }

        const node = new NodeInterface(data, parentPath);
        this.nodes.set(node.path, node);

        // Process children
        if (data.children && Array.isArray(data.children)) {
            data.children.forEach((childData) => {
                const childNodes = this.createNode(childData, node.path, depth + 1);

                // If createNode returns an array (from instances), add them all
                if (Array.isArray(childNodes)) {
                    node.childrenData.push(...childNodes);
                } else {
                    node.childrenData.push(childNodes);
                }
            });
        }

        return node;
    }

    createInstances(data, parentPath, depth) {
        const instConfig = data.logic.instancias;
        const instancesCount = parseInt(instConfig.cantidad || instConfig, 10) || 1;
        const generatedNodes = [];

        // Clone the base data, removing the 'instancias' property to avoid infinite loops
        const baseData = fusionar({}, data);
        delete baseData.logic.instancias;

        for (let i = 0; i < instancesCount; i++) {
            // Generate suffix :ins[n]
            const instanceId = `${baseData.id}:ins[${i}]`;

            const instanceData = fusionar({}, baseData);
            instanceData.id = instanceId;

            // Add custom props for instances (index, total) so logic can use them
            if (!instanceData.props) instanceData.props = {};
            instanceData.props['--instance-index'] = i;
            instanceData.props['--instance-total'] = instancesCount;

            // Procedural variations from data logic
            if (!instanceData.baseTransform) {
                instanceData.baseTransform = { translateX: 0, translateY: 0, translateZ: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };
            }

            if (instConfig.spread) {
                const sx = instConfig.spread.x || 0;
                const sy = instConfig.spread.y || 0;
                const sz = instConfig.spread.z || 0;
                instanceData.baseTransform.translateX = (instanceData.baseTransform.translateX || 0) + (Math.random() - 0.5) * sx;
                instanceData.baseTransform.translateY = (instanceData.baseTransform.translateY || 0) + (Math.random() - 0.5) * sy;
                instanceData.baseTransform.translateZ = (instanceData.baseTransform.translateZ || 0) + (Math.random() - 0.5) * sz;
            }

            if (instConfig.rotate) {
                instanceData.baseTransform.rotateX = (instanceData.baseTransform.rotateX || 0) + (Math.random() - 0.5) * (instConfig.rotate.x || 0);
                instanceData.baseTransform.rotateY = (instanceData.baseTransform.rotateY || 0) + (Math.random() - 0.5) * (instConfig.rotate.y || 0);
                instanceData.baseTransform.rotateZ = (instanceData.baseTransform.rotateZ || 0) + (Math.random() - 0.5) * (instConfig.rotate.z || 0);
            }

            if (instConfig.scale) {
                const sMin = instConfig.scale.min || 1;
                const sMax = instConfig.scale.max || 1;
                instanceData.baseTransform.scale = (instanceData.baseTransform.scale || 1) * (sMin + Math.random() * (sMax - sMin));
            }

            const node = new NodeInterface(instanceData, parentPath);
            this.nodes.set(node.path, node);

            if (baseData.children && Array.isArray(baseData.children)) {
                baseData.children.forEach(childData => {
                     const childNodes = this.createNode(childData, node.path, depth + 1);
                     if (Array.isArray(childNodes)) {
                        node.childrenData.push(...childNodes);
                     } else {
                        node.childrenData.push(childNodes);
                     }
                });
            }

            generatedNodes.push(node);
        }

        return generatedNodes;
    }

    getNode(path) {
        return this.nodes.get(path);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    clear() {
        this.nodes.clear();
    }
}
