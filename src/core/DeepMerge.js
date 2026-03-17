export function fusionar(principal, parcial, nivel = 0) {
    if (nivel > 32 || !parcial || typeof parcial !== 'object') return parcial;
    if (Array.isArray(parcial)) return [...parcial];
    const res = principal ? { ...principal } : {};
    for (const key in parcial) {
        const v = parcial[key];
        if (v && typeof v === 'object' && !Array.isArray(v)) res[key] = fusionar(res[key], v, nivel + 1);
        else res[key] = Array.isArray(v) ? [...v] : v;
    }
    return res;
}
