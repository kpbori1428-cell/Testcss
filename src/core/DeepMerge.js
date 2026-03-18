/**
 * Fusionar (Deep Merge)
 *
 * Implementa el algoritmo de fusión de datos respetando el límite de 32 niveles
 * de profundidad para prevenir el colapso de la pila de llamadas (Stack Overflow).
 */
export function fusionar(principal, parcial, nivelActual = 0) {
    if (nivelActual > 32) {
        throw new Error("Profundidad Excedida: Se ha alcanzado el límite de 32 niveles de recursión.");
    }

    if (!parcial || typeof parcial !== 'object') {
        return parcial;
    }

    if (Array.isArray(parcial)) {
        // En arreglos, reemplazamos por completo, o podríamos fusionar,
        // pero la especificación dice "SI es Lista ENTONCES Sobrescribir Principal[Llave]"
        return [...parcial];
    }

    const resultado = principal ? { ...principal } : {};

    for (const llave in parcial) {
        if (Object.prototype.hasOwnProperty.call(parcial, llave)) {
            const valorParcial = parcial[llave];

            if (Array.isArray(valorParcial)) {
                resultado[llave] = [...valorParcial];
            } else if (valorParcial && typeof valorParcial === 'object') {
                if (resultado[llave] && typeof resultado[llave] === 'object' && !Array.isArray(resultado[llave])) {
                    resultado[llave] = fusionar(resultado[llave], valorParcial, nivelActual + 1);
                } else {
                    resultado[llave] = fusionar({}, valorParcial, nivelActual + 1);
                }
            } else {
                resultado[llave] = valorParcial;
            }
        }
    }

    return resultado;
}
