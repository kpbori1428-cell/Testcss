export class FormulaParser {
    static evaluate(formula, vars = {}) {
        if (typeof formula !== 'string' || !formula.startsWith('=')) return formula;
        let expression = formula.substring(1)
            .replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(').replace(/abs\(/g, 'Math.abs(')
            .replace(/random\(\)/g, 'Math.random()')
            .replace(/\bPI\b/g, 'Math.PI');
        const { time = 0, index = 0, total = 1, mouseX = 0, mouseY = 0 } = vars;
        try {
            const evaluator = new Function('time', 'index', 'total', 'mouseX', 'mouseY', `return ${expression};`);
            return evaluator(time, index, total, mouseX, mouseY);
        } catch (e) { return 0; }
    }
    static isFormula(value) { return typeof value === 'string' && value.startsWith('='); }
}
