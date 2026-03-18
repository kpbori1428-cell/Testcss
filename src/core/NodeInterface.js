export class NodeInterface {
    constructor(data, parentPath = 'app') {
        this.id = data.id;
        this.path = `${parentPath}.${this.id}`;

        if (!this.id) throw new Error("Node must have an 'id'");

        this.props = data.props || {}; // Propiedades_Estéticas
        this.logic = data.logic || {}; // Directivas_Lógicas
        this.childrenData = data.children || [];
        this.memoryChamber = new Map(); // Cámara_Memoria

        // Transform_Base
        this.baseTransform = {
            translateX: 0, translateY: 0, translateZ: 0,
            rotateX: 0, rotateY: 0, rotateZ: 0,
            scale: 1
        };

        if (data.baseTransform) {
             Object.assign(this.baseTransform, data.baseTransform);
        }

        // Populate baseTransform from props if available
        if (this.props.transform) {
            const t = this.props.transform;
            ['translateX', 'translateY', 'translateZ', 'rotateX', 'rotateY', 'rotateZ', 'scale'].forEach(prop => {
                if (t[prop] !== undefined) this.baseTransform[prop] = t[prop];
            });
        }

        // Final fallback to ensure all properties exist
        ['translateX', 'translateY', 'translateZ', 'rotateX', 'rotateY', 'rotateZ', 'scale'].forEach(prop => {
            if (this.baseTransform[prop] === undefined) {
                this.baseTransform[prop] = (prop === 'scale') ? 1 : 0;
            }
        });
    }
}
