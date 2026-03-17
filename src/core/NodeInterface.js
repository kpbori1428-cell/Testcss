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
             this.baseTransform = { ...data.baseTransform };
        }

        // Populate baseTransform from props if available
        if (this.props.transform) {
            const t = this.props.transform;
            if (t.translateX !== undefined) this.baseTransform.translateX = t.translateX;
            if (t.translateY !== undefined) this.baseTransform.translateY = t.translateY;
            if (t.translateZ !== undefined) this.baseTransform.translateZ = t.translateZ;
            if (t.rotateX !== undefined) this.baseTransform.rotateX = t.rotateX;
            if (t.rotateY !== undefined) this.baseTransform.rotateY = t.rotateY;
            if (t.rotateZ !== undefined) this.baseTransform.rotateZ = t.rotateZ;
            if (t.scale !== undefined) this.baseTransform.scale = t.scale;
        }
    }
}
