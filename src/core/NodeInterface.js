export class NodeInterface {
    constructor(data, parentPath = 'app') {
        this.id = data.id; this.path = `${parentPath}.${this.id}`;
        this.props = data.props || {}; this.logic = data.logic || {}; this.childrenData = data.children || [];
        this.baseTransform = { translateX: 0, translateY: 0, translateZ: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };
        const t = data.baseTransform || this.props.transform;
        if (t) Object.keys(this.baseTransform).forEach(k => t[k] !== undefined && (this.baseTransform[k] = t[k]));
    }
}
