import { tetragramFitness, tetragramFitness2 } from './fitness.js';
import { decipherMonoAlphabeticSubstitution } from './cipher.js';
import tetragramFreqs2 from '../resources/TETRAGRAMS2.json';

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
    if (counter % 500 == 1) console.log(counter);
  }
  console.log(parentFitness);
  return {
    key: parentKey,
    plaintext: parentPlaintext,
  };
}

/**
 *
 * @param {Array<any>} arr
 * @param {number} r1
 * @param {number} r2
 */
function swapArrayItems(arr, r1, r2) {
  let temp = arr[r1];
  arr[r1] = arr[r2];
  arr[r2] = temp;
}

/**
 *
 * @param {Array<any>} mat
 * @param {number} r1
 * @param {number} r2
 * @param {number} [dimension=4]
 */
function swapFreqsMatrix(mat, r1, r2, dimension = 4) {
  swapArrayItems(mat, r1, r2);
  if (dimension > 1) {
    for (const subMat of mat) {
      swapFreqsMatrix(subMat, r1, r2, dimension - 1);
    }
  }
}

/**
 *
 * @param {string} text
 * @param {number} [threshold=25_000]
 * @returns {HillClimbResult}
 *
 */
function monoalphabeticSubstitutionHillClimb2(text, threshold = 25_000) {
  let freqs = structuredClone(tetragramFreqs2);
  let parentKey = 'abcdefghijklmnopqrstuvwxyz'.split('');
  let parentPlaintext = decipherMonoAlphabeticSubstitution(text, parentKey);
  let parentFitness = tetragramFitness2(parentPlaintext);
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
    //let childFreqs = structuredClone(parentFreqs);
    swapFreqsMatrix(freqs, r1, r2);
    let childPlaintext = decipherMonoAlphabeticSubstitution(text, childKey);
    let childFitness = tetragramFitness2(childPlaintext, freqs);
    if (childFitness > parentFitness) {
      parentKey = childKey;
      parentPlaintext = childPlaintext;
      parentFitness = childFitness;
      counter = 0;
    } else {
      swapFreqsMatrix(freqs, r2, r1);
    }
    counter++;
    if (counter % 500 == 1) console.log(counter);
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
