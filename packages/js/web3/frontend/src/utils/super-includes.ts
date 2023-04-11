export function superIncludes(a: string | string[], b: string | string[]) {
    const arrA = Array.isArray(a) ? a : [a];
    const arrB = Array.isArray(b) ? b : [b];
    for (const ai of arrA) {
        for (const bi of arrB) {
            const ap = ai.toLowerCase().replace(/ /g, "");
            const bp = bi.toLowerCase().replace(/ /g, "");

            if (ap.includes(bp) || bp.includes(ap))
                return true;
        }
    }

    return false;
}
