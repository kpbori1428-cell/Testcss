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
            // Reemplazar funciones matemáticas estándar por Math.func
            const finalBody = sanitized
                .replace(/\b(sin|cos|tan|abs|sqrt|pow|min|max|PI|E)\b/g, 'Math.$1')
                .replace(/\b(index)\b/g, 'args.index')
                .replace(/\b(total)\b/g, 'args.total')
                .replace(/\b(time)\b/g, 'args.time')
                .replace(/\b(mouseX)\b/g, 'args.mouseX')
                .replace(/\b(mouseY)\b/g, 'args.mouseY');

            const fn = new Function('args', `return ${finalBody};`);
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
