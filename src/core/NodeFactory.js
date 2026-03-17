import { fusionar } from './DeepMerge.js';
import { NodeInterface } from './NodeInterface.js';

export class NodeFactory {
    constructor() {
        this.nodes = new Map();
    }

    createNode(data, parentPath = 'app', depth = 0) {
        if (depth > 32) {
            throw new Error(`[NodeFactory] Límite de profundidad (32) excedido en el nodo: ${data.id}`);
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
        const instancesCount = parseInt(data.logic.instancias, 10) || 1;
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
