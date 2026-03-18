export class FormulaParser {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Compila una fórmula en una función ejecutable.
     * Soporta variables: time, index, total, mouseX, mouseY.
     * Ejemplo: "=sin(time + index) * 100"
     */
    compile(formula) {
        if (typeof formula !== 'string' || !formula.startsWith('=')) {
            return null;
        }

        if (this.cache.has(formula)) {
            return this.cache.get(formula);
        }

        const body = formula.substring(1);

        // Sanitización básica: permitir solo caracteres matemáticos y variables conocidas
        const sanitized = body.replace(/[^a-zA-Z0-9\s\+\-\*\/\(\)\.,]/g, '');

        try {
            // Pseudo-noise function implementation
            const noiseSrc = `
                const noise = (x) => {
                    const i = Math.floor(x);
                    const f = x - i;
                    const w = f * f * (3 - 2 * f);
                    const rand = (n) => {
                        const v = Math.sin(n) * 43758.5453123;
                        return v - Math.floor(v);
                    };
                    return rand(i) * (1 - w) + rand(i + 1) * w;
                };
            `;

            // Reemplazar funciones matemáticas estándar por Math.func
            const finalBody = sanitized
                .replace(/\b(sin|cos|tan|abs|sqrt|pow|min|max|PI|E)\b/g, 'Math.$1')
                .replace(/\b(noise)\b/g, 'noise')
                .replace(/\b(index)\b/g, 'args.index')
                .replace(/\b(total)\b/g, 'args.total')
                .replace(/\b(time)\b/g, 'args.time')
                .replace(/\b(mouseX)\b/g, 'args.mouseX')
                .replace(/\b(mouseY)\b/g, 'args.mouseY');

            const fn = new Function('args', `${noiseSrc} return ${finalBody};`);
            this.cache.set(formula, fn);
            return fn;
        } catch (error) {
            console.error(`[FormulaParser] Error al compilar fórmula: ${formula}`, error);
            return null;
        }
    }

    evaluate(formula, args) {
        const fn = this.compile(formula);
        if (fn) {
            try {
                return fn(args);
            } catch (e) {
                return 0;
            }
        }
        return 0;
    }
}

export const formulaParser = new FormulaParser();
