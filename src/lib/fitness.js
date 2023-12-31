import monogramFreqs from '../resources/MONOGRAMS.json';
import tetragramFreqs from '../resources/TETRAGRAMS.json';
import tetragramFreqs2 from '../resources/TETRAGRAMS2.json';
console.log(monogramFreqs);
const sortedMonogramFreqsNoSpaces = Object.entries(monogramFreqs)
  .filter(([k, _]) => k !== ' ')
  .sort((a, b) => a[0].charCodeAt(0) - b[0].charCodeAt(0))
  .map((a) => a[1][1]);
const sortedMonogramFreqsWithSpaces = Object.entries(monogramFreqs)
  .sort((a, b) => a[0].charCodeAt(0) - b[0].charCodeAt(0))
  .map((a) => a[1][0]);

/**
 * calculates the inner product ('dot product') of 2 vectors
 * @param {number[]} u - vector 1
 * @param {number[]} v - vector 2; must have the same dimension as `u`
 * @returns {number}
 */
function innerProduct(u, v) {
  let sum = 0;
  for (const i in u) {
    sum += u[i] * v[i];
  }
  return sum;
}

/**
 * calculates the cosine of the angle between 2 vectors
 * @param {number[]} u - vector 1
 * @param {number[]} v - vector 2; must have the same dimension as `u`
 * @returns {number}
 */
function cosineVectorAngle(u, v) {
  return (
    innerProduct(u, v) / Math.sqrt(innerProduct(u, u) * innerProduct(v, v))
  );
}

/**
 * Calculates the monogram fitness from a monogram frequency object. Between 0 and 1 (inclusive) - 1 is better
 * @param {Object<string, number>} monograms - an object with keys as all of the letters and optionally a space, and the values as the relative frequency of the monogram (between 0 and 1)
 * @returns {number}
 */
function monogramFreqFitness(monograms) {
  return cosineVectorAngle(
    Object.entries(monograms)
      .sort((a, b) => a[0].charCodeAt(0) - b[0].charCodeAt(0))
      .map((a) => a[1]),
    ' ' in monograms
      ? sortedMonogramFreqsWithSpaces
      : sortedMonogramFreqsNoSpaces,
  );
}

/**
 * calculates the monogram frequencies of a text
 * @param {string} text
 * @param {boolean} [upper=false] - whether
 * @param {boolean} [space=false]
 * @returns {Object<string, number>}
 */
export function monogramFrequencies(text, upper = false, space = false) {
  const monograms = Object.create(null);
  for (const l of (upper
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    : 'abcdefghijklmnopqrstuvwxyz') + (space ? ' ' : '')) {
    monograms[l] = 0;
  }
  for (const l of text[upper ? 'toUpperCase' : 'toLowerCase']()
    .replaceAll(/[^a-z ]/gi, '')
    .replaceAll(' ', space ? ' ' : ''))
    monograms[l]++;
  return monograms;
}

/**
 * Calculates the monogram fitness of a text. Between 0 and 1 (inclusive) - 1 is better
 * @param {string} text - the text
 * @param {boolean} [space=false] - whether to include spaces as a valid monogram to check the fitness of
 * @returns {number}
 */
export function monogramFitness(text, space = false) {
  return monogramFreqFitness(monogramFrequencies(text, false, space)) || 0;
}

/**
 * calculates the tetragram fitness of a text (no spaces!); the more negative this is, the less likely it is to be English text
 * @param {string} text - the text to calculate the quadgram fitness for
 * @returns {number}
 */
export function tetragramFitness(text) {
  let sum = 0;
  const strippedText = text.toLowerCase().replaceAll(/[^a-z]/g, '');
  for (let i = 0; i < strippedText.length - 3; i++) {
    sum += tetragramFreqs[strippedText.substring(i, i + 4)] ?? -7;
  }
  sum /= strippedText.length - 3;
  return sum || 0;
}

/**
 * calculates the tetragram fitness of a text (no spaces!); the more negative this is, the less likely it is to be English text
 * @param {string} text - the text to calculate the quadgram fitness for
 * @param {number[][][][]} [freqs=tetragramFreqs2] - the standard tetragram frequencies
 * @returns {number}
 */
export function tetragramFitness2(text, freqs = tetragramFreqs2) {
  let sum = 0;
  const strippedText = text.toLowerCase().replaceAll(/[^a-z]/g, '');
  for (let i = 0; i < strippedText.length - 3; i++) {
    sum -=
      tetragramFreqs2[strippedText.charCodeAt(i) - 97][
        strippedText.charCodeAt(i + 1) - 97
      ][strippedText.charCodeAt(i + 2) - 97][
        strippedText.charCodeAt(i + 3) - 97
      ];
  }
  sum /= strippedText.length - 3;
  return sum || 0;
}

/**
 * Calculates how likely that 2 random blocks of text are the same, multiplied by 26^m where m is the block size
 * @param {string} text
 * @param {number} [blockSize=1]
 * @returns {number}
 */
export function normalizedIoC(text, blockSize = 1) {
  let strippedText = text.toLowerCase().replaceAll(/[^a-z]/g, '');
  for (let i = 0; i < strippedText.length % blockSize; i++) {
    strippedText += 'x';
  }
  const denominator = strippedText.length * (strippedText.length - 1);
  let sum = 0;
  /**
   * @type {number[]}
   */
  let counts = Array.from({ length: 26 ** blockSize }).fill(0);
  const blocks = strippedText.match(new RegExp(`.{${blockSize}}`, 'g')) ?? [];
  for (const block of blocks) {
    let index = 0;
    for (let i = 0; i < block.length; i++) {
      index += 26 ** i * (block[i].charCodeAt(0) - 97);
    }
    counts[index]++;
  }
  for (const count of counts) {
    sum += count * (count - 1);
  }
  sum /= denominator;
  return sum * 26 ** blockSize || 0;
}

/**
 * @type {number}
 */
const log26Reciprocal = 1 / Math.log(2);

/**
 * Calculates the randomness of a text
 * @param {string} text
 * @returns {number}
 */
export function entropy(text) {
  let strippedText = text.toLowerCase().replaceAll(/[^a-z]/g, '');
  let sum = 0;
  /**
   * @type {number[]}
   */
  let counts = Array.from({ length: 26 }).fill(0);
  for (const letter of strippedText) {
    counts[letter.charCodeAt(0) - 97]++;
  }
  for (const count of counts) {
    sum +=
      (count / strippedText.length) *
        (Math.log(count / strippedText.length) * log26Reciprocal) || 0;
  }
  return -sum;
}

/**
 *
 * @param {string} text
 * @param {number} [threshold=20]
 * @returns {number}
 */
export function calculateProbablePeriod(text, threshold = 20) {
  let strippedText = text.toLowerCase().replaceAll(/[^a-z]/g, '');
  let period = 2;
  let bestPeriod = 2;
  let bestIoC = 0;
  const expectedIoC = 1.75;
  let counter = 0;
  while (counter < threshold) {
    const splitTexts = Array.from({ length: period }, (_, i) => {
      let split = '';
      for (let j = i; j < strippedText.length; j += period) {
        split += strippedText[j];
      }
      return split;
    });
    const iocs = splitTexts.map((t) => normalizedIoC(t));
    const avg = iocs.reduce((a, b) => a + b) / iocs.length || 0;
    if (Math.abs(expectedIoC - avg) < Math.abs(expectedIoC - bestIoC)) {
      bestIoC = avg;
      bestPeriod = period;
      counter = 0;
    }
    counter++;
    period++;
  }
  return bestPeriod;
}
