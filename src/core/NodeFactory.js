import { fusionar } from './DeepMerge.js';
import { NodeInterface } from './NodeInterface.js';
export class NodeFactory {
    constructor() { this.nodes = new Map(); this.templateRegistry = new Map(); }
    registerTemplates(ts) { Object.entries(ts).forEach(([id, d]) => this.templateRegistry.set(id, d)); }
    createNode(data, parentPath = 'app', depth = 0) {
        if (depth > 32) throw new Error("Depth limit exceeded");
        let d = data.template ? fusionar(this.templateRegistry.get(data.template), data) : data;
        if (d.logic?.instancias) return this.createInstances(d, parentPath, depth);
        const node = new NodeInterface(d, parentPath);
        this.nodes.set(node.path, node);
        if (d.children) {
            node.childrenData = [];
            d.children.forEach(c => {
                const clone = fusionar({}, c);
                if (node.props['--instance-index'] !== undefined) {
                    clone.props = clone.props || {};
                    clone.props['--instance-index'] = node.props['--instance-index'];
                    clone.props['--instance-total'] = node.props['--instance-total'];
                }
                const res = this.createNode(clone, node.path, depth + 1);
                Array.isArray(res) ? node.childrenData.push(...res) : node.childrenData.push(res);
            });
        }
        if (d.logic?.extrude) this.generateExtrusion(node, d.logic.extrude);
        return node;
    }
    generateExtrusion(n, dv) {
        const d = parseFloat(dv), w = parseFloat(n.props.width), h = parseFloat(n.props.height);
        const faces = [
            { id: 'back', pos: { z: -d }, rot: { y: 180 } },
            { id: 'left', pos: { x: -w/2, z: -d/2 }, rot: { y: -90 }, size: { w: d, h: h } },
            { id: 'right', pos: { x: w/2, z: -d/2 }, rot: { y: 90 }, size: { w: d, h: h } },
            { id: 'top', pos: { y: -h/2, z: -d/2 }, rot: { x: 90 }, size: { w: w, h: d } },
            { id: 'bottom', pos: { y: h/2, z: -d/2 }, rot: { x: -90 }, size: { w: w, h: d } }
        ];
        faces.forEach(f => {
            const fd = { id: `${n.id}:${f.id}`, props: fusionar({}, n.props), logic: {} };
            if (f.size) { fd.props.width = `${f.size.w}px`; fd.props.height = `${f.size.h}px`; }
            fd.baseTransform = { translateX: f.pos.x||0, translateY: f.pos.y||0, translateZ: f.pos.z||0, rotateX: f.rot.x||0, rotateY: f.rot.y||0, rotateZ: f.rot.z||0, scale: 1 };
            const fn = new NodeInterface(fd, n.path);
            this.nodes.set(fn.path, fn); n.childrenData.push(fn);
        });
    }
    createInstances(d, p, dp) {
        const count = parseInt(d.logic.instancias), res = [], base = fusionar({}, d);
        delete base.logic.instancias;
        for (let i = 0; i < count; i++) {
            const id = `${base.id}:ins[${i}]`, inst = fusionar({}, base);
            inst.id = id; inst.props = inst.props || {}; inst.props['--instance-index'] = i; inst.props['--instance-total'] = count;
            const n = this.createNode(inst, p, dp);
            Array.isArray(n) ? res.push(...n) : res.push(n);
        }
        return res;
    }
}
