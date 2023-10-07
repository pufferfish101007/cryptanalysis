import monogramFreqs from '../../public/MONOGRAMS.json';
const sortedMonogramFreqsWithSpaces = Object.entries(monogramFreqs).sort((a, b) => a[0].charCodeAt(0) - b[0].charCodeAt(0)).map(a => a[1][1]);
const sortedMonogramFreqsNoSpaces = sortedMonogramFreqsWithSpaces.splice(1);
function innerProduct(u, v) {
    let sum = 0;
    for (const i in u) {
        sum += u[i] * v[i];
    }
    return sum;
}
function cosineVectorAngle(u, v) {
    return Math.acos(innerProduct(u, v) / Math.sqrt(innerProduct(u, u) * innerProduct(v, v)));
}
export function monogramFitness(monograms) {
    return cosineVectorAngle(Object.entries(monograms).sort((a, b) => a[1] - b[1]).map(a => a[1]), ' ' in monograms ? sortedMonogramFreqsWithSpaces : sortedMonogramFreqsNoSpaces);
}