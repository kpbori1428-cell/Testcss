import { fusionar } from './DeepMerge.js';
import { NodeInterface } from './NodeInterface.js';

export class NodeFactory {
    constructor() {
        this.nodes = new Map();
        this.templateRegistry = new Map();
    }

    registerTemplates(templates) {
        Object.entries(templates).forEach(([id, data]) => {
            this.templateRegistry.set(id, data);
        });
    }

    async createNode(data, parentPath = 'app', depth = 0) {
        if (depth > 32) throw new Error("[NodeFactory] Hierarchy depth limit exceeded (32)");

        // 1. Process templates
        let nodeData = data;
        if (data.template && this.templateRegistry.has(data.template)) {
            const template = this.templateRegistry.get(data.template);
            nodeData = fusionar(template, data);
        }

        // 2. Handle procedural instances
        if (nodeData.logic && nodeData.logic.instancias) {
            return await this.createInstances(nodeData, parentPath, depth);
        }

        // 3. Instantiate Node
        const node = new NodeInterface(nodeData, parentPath);
        this.nodes.set(node.path, node);

        // 4. Process Children
        if (nodeData.children && Array.isArray(nodeData.children)) {
            node.childrenData = []; // Clear copied array from NodeInterface to populate with objects
            for (const childConfig of nodeData.children) {
                const childClone = fusionar({}, childConfig);

                // Propagate instance context to children
                if (node.props['--instance-index'] !== undefined) {
                    childClone.props = childClone.props || {};
                    childClone.props['--instance-index'] = node.props['--instance-index'];
                    childClone.props['--instance-total'] = node.props['--instance-total'];
                }

                const createdChild = await this.createNode(childClone, node.path, depth + 1);

                if (Array.isArray(createdChild)) {
                    node.childrenData.push(...createdChild);
                } else {
                    node.childrenData.push(createdChild);
                }
            }
        }

        // 5. Handle volumetric extrusion
        if (nodeData.logic && nodeData.logic.extrude) {
            this.generateExtrusion(node, nodeData.logic.extrude);
        }

        return node;
    }

    generateExtrusion(node, depthValue) {
        const depth = parseFloat(depthValue);
        const width = parseFloat(node.props.width);
        const height = parseFloat(node.props.height);

        const faces = [
            { id: 'back', pos: { z: -depth }, rot: { y: 180 } },
            { id: 'left', pos: { x: -width/2, z: -depth/2 }, rot: { y: -90 }, size: { w: depth, h: height } },
            { id: 'right', pos: { x: width/2, z: -depth/2 }, rot: { y: 90 }, size: { w: depth, h: height } },
            { id: 'top', pos: { y: -height/2, z: -depth/2 }, rot: { x: 90 }, size: { w: width, h: depth } },
            { id: 'bottom', pos: { y: height/2, z: -depth/2 }, rot: { x: -90 }, size: { w: width, h: depth } }
        ];

        faces.forEach(faceConfig => {
            const faceData = {
                id: `${node.id}:${faceConfig.id}`,
                props: fusionar({}, node.props),
                logic: {}
            };

            if (faceConfig.size) {
                faceData.props.width = `${faceConfig.size.w}px`;
                faceData.props.height = `${faceConfig.size.h}px`;
            }

            faceData.baseTransform = {
                translateX: faceConfig.pos.x || 0,
                translateY: faceConfig.pos.y || 0,
                translateZ: faceConfig.pos.z || 0,
                rotateX: faceConfig.rot.x || 0,
                rotateY: faceConfig.rot.y || 0,
                rotateZ: faceConfig.rot.z || 0,
                scale: 1
            };

            const faceNode = new NodeInterface(faceData, node.path);
            this.nodes.set(faceNode.path, faceNode);
            node.childrenData.push(faceNode);
        });
    }

    async createInstances(data, parentPath, depth) {
        const instancesCount = parseInt(data.logic.instancias);
        const results = [];
        const baseConfig = fusionar({}, data);
        delete baseConfig.logic.instancias;

        for (let i = 0; i < instancesCount; i++) {
            const instanceConfig = fusionar({}, baseConfig);
            instanceConfig.id = `${baseConfig.id}:ins[${i}]`;
            instanceConfig.props = instanceConfig.props || {};
            instanceConfig.props['--instance-index'] = i;
            instanceConfig.props['--instance-total'] = instancesCount;

            const node = await this.createNode(instanceConfig, parentPath, depth);
            if (Array.isArray(node)) results.push(...node);
            else results.push(node);
        }
        return results;
    }
}
