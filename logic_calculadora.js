import { RenderNode } from './engine.js';

export class CalculadoraLogic {
    constructor(node) {
        this.node = node;
        this.currentValue = "0";
        this.previousValue = null;
        this.operator = null;
        this.waitingForNewValue = false;
        this.screenNodePath = `${this.node.path}.pantalla_calculadora.texto_pantalla`;
    }

    onMount() {
        console.log(`[App] Calculadora Montada en: ${this.node.path}`);
        this.updateScreen();
    }

    handleButtonClick(value) {
        if (!isNaN(value) || value === ".") {
            this.handleNumber(value);
        } else if (value === "C") {
            this.handleClear();
        } else if (value === "=") {
            this.handleCalculate();
        } else {
            this.handleOperator(value);
        }
        this.updateScreen();
    }

    handleNumber(num) {
        if (this.waitingForNewValue) {
            this.currentValue = num;
            this.waitingForNewValue = false;
        } else {
            this.currentValue = this.currentValue === "0" && num !== "." ? num : this.currentValue + num;
        }
    }

    handleOperator(op) {
        if (this.operator && !this.waitingForNewValue) {
            this.handleCalculate();
        }
        this.operator = op;
        this.previousValue = this.currentValue;
        this.waitingForNewValue = true;
    }

    handleCalculate() {
        if (!this.operator || this.previousValue === null) return;

        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);
        let result = 0;

        switch(this.operator) {
            case "+": result = prev + current; break;
            case "-": result = prev - current; break;
            case "*": result = prev * current; break;
            case "/": result = prev / current; break;
        }

        this.currentValue = String(Math.round(result * 1000000) / 1000000);
        this.operator = null;
        this.previousValue = null;
        this.waitingForNewValue = true;
    }

    handleClear() {
        this.currentValue = "0";
        this.previousValue = null;
        this.operator = null;
        this.waitingForNewValue = false;
    }

    updateScreen() {
        const screenNode = RenderNode.registry.get(this.screenNodePath);
        if (screenNode && screenNode.domElement) {
            screenNode.innerHTML = this.currentValue;
            screenNode.domElement.innerHTML = this.currentValue;
        }
    }
}

export class CalcButtonLogic {
    constructor(node) {
        this.node = node;
        this.value = node.innerHTML.trim();
    }

    onClick() {
        console.log(`[App] CalcButton click: ${this.value}`);
        let currentPath = this.node.path;
        let appNode = null;

        while (currentPath.includes('.')) {
            currentPath = currentPath.substring(0, currentPath.lastIndexOf('.'));
            const parentNode = RenderNode.registry.get(currentPath);
            if (parentNode && parentNode.appLogicInstance && parentNode.appLogicInstance.handleButtonClick) {
                appNode = parentNode;
                break;
            }
        }

        if (appNode) {
            appNode.appLogicInstance.handleButtonClick(this.value);
        } else {
            console.warn(`[App] No se encontró la Calculadora padre para el botón: ${this.value}`);
        }
    }
}
