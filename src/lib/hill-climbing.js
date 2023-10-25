import { tetragramFitness } from './fitness.js';
import { decipherMonoAlphabeticSubstitution } from './cipher.js';

/**
 * @typedef {Object} HillClimbResult
 * @property {Array<string>} key
 * @property {string} plaintext
 */

/**
 *
 * @param {string} text
 * @param {number} [threshold=25_000]
 * @returns {HillClimbResult}
 *
 */
function monoalphabeticSubstitutionHillClimb(text, threshold = 25_000) {
  let parentKey = 'abcdefghijklmnopqrstuvwxyz'.split('');
  let parentPlaintext = decipherMonoAlphabeticSubstitution(text, parentKey);
  let parentFitness = tetragramFitness(parentPlaintext);
  let counter = 0;
  while (counter < threshold) {
    const [r1, r2] = uniqueRandomPair(26);
    let childKey = parentKey.map((l, i) => {
      switch (i) {
        case r1:
          return parentKey[r2];
        case r2:
          return parentKey[r1];
        default:
          return l;
      }
    });
    let childPlaintext = decipherMonoAlphabeticSubstitution(text, childKey);
    let childFitness = tetragramFitness(childPlaintext);
    if (childFitness > parentFitness) {
      parentKey = childKey;
      parentPlaintext = childPlaintext;
      parentFitness = childFitness;
      counter = 0;
    }
    counter++;
  }
  return {
    key: parentKey,
    plaintext: parentPlaintext,
  };
}

/**
 *
 * @param {number} n - the range [0, n)
 * @returns {[number, number]}
 */
function uniqueRandomPair(n) {
  const r1 = Math.floor(Math.random() * n);
  let r2 = Math.floor(Math.random() * n);
  while (r2 === r1) {
    r2 = Math.floor(Math.random() * n);
  }
  return [r1, r2];
}

self.addEventListener('message', ({ data: { event, text, threshold } }) => {
  switch (event) {
    case 'monoalphabetic':
      self.postMessage({
        event: 'monoalphabetic-result',
        ...monoalphabeticSubstitutionHillClimb(text, threshold),
      });
      break;
    default:
      self.postMessage({ event: 'error', text: 'invalid event' });
  }
});
