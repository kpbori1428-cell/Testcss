export class FormulaParser {
    static cache = new Map();

    static evaluate(formula, variables = {}) {
        if (typeof formula !== 'string' || !formula.startsWith('=')) {
            return formula;
        }

        let compiledFn = this.cache.get(formula);

        if (!compiledFn) {
            const expression = formula.substring(1)
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/abs\(/g, 'Math.abs(')
                .replace(/random\(\)/g, 'Math.random()')
                .replace(/\bPI\b/g, 'Math.PI');

            try {
                compiledFn = new Function('time', 'index', 'total', 'mouseX', 'mouseY', `return ${expression};`);
                this.cache.set(formula, compiledFn);
            } catch (error) {
                console.error(`[FormulaParser] Invalid formula: ${formula}`, error);
                return 0;
            }
        }

        const { time = 0, index = 0, total = 1, mouseX = 0, mouseY = 0 } = variables;

        try {
            return compiledFn(time, index, total, mouseX, mouseY);
        } catch (error) {
            return 0;
        }
    }

    static isFormula(value) {
        return typeof value === 'string' && value.startsWith('=');
    }
}
