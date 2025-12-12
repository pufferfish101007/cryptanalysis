import { tetragramFitness, tetragramFitness2, normalizedIoC } from './fitness.js';
import {
  decipherMonoAlphabeticSubstitution,
  encipherVigenere,
  decipherPlayfair,
  fiveSquareRowCol,
} from './cipher.js';
import tetragramFreqs2 from '../resources/TETRAGRAMS2.json';

/**
 * @typedef {Object} HillClimbResult
 * @property {Array<string>} key
 * @property {string} plaintext
 * @property {number} fitness
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
    let childPlaintext = decipherMonoAlphabeticSubstitution(text, childKey);
    let childFitness = tetragramFitness2(childPlaintext);
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
    fitness: parentFitness,
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
function monoalphabeticSubstitutionHillClimb2(text, threshold = 2_000) {
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
    fitness: parentFitness,
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
/*
function hillClimbVigenere(text, period, initialGuess) {
  let flag = false;
  let key = initialGuess ?? Array.from({ length: period }, () => 0);
  let currentFitness = tetragramFitness2(text);
  while (!flag) {
    let oldFitness = currentFitness;
    for (let i = 0; i < period; i++) {
      let maxFitness = currentFitness;
      let bestLetter = 0;
      for (let j = 0; j < 26; j++) {
        let newKey = Object.assign([...key], { [i]: j });
        let newFitness = tetragramFitness2(encipherVigenere(text, newKey));
        if (newFitness > maxFitness) {
          bestLetter = j;
          maxFitness = newFitness;
          console.log(key, maxFitness);
        }
      }
      Object.assign(key, { [i]: bestLetter });
      currentFitness = maxFitness;
    }
    if (currentFitness === oldFitness) {
      flag = true;
    }
  }
  return {
    key,
    plaintext: encipherVigenere(text, key),
    fitness: currentFitness,
  };
}*/
function hillClimbVigenere(text, period, initialGuess) {
  let flag = false;
  let key = initialGuess ?? Array.from({ length: period }, () => 0);
  let currentFitness = tetragramFitness2(encipherVigenere(text, key));
  while (!flag) {
    let oldFitness = currentFitness;
    for (let i = 0; i < period; i++) {
      let maxFitness = currentFitness;
      let bestLetter = key[i];
      for (let j = 0; j < 26; j++) {
        let newKey = key;
        newKey[i] = j;
        let newFitness = tetragramFitness2(encipherVigenere([...text].filter((x, k) => k % period <= i).join(''), newKey));
        if (newFitness > maxFitness || Math.random() < 0.1) {
          bestLetter = j;
          maxFitness = newFitness;
          console.log(key, maxFitness);
        }
      }
      key[i] = bestLetter;
      currentFitness = maxFitness;
    }
    if (currentFitness === oldFitness) {
      flag = true;
    }
  }
  return {
    key,
    plaintext: encipherVigenere(text, key),
    fitness: currentFitness,
  };
}

/**
 *
 * @param {string} text
 * @param {number} [threshold=25_000]
 * @returns {HillClimbResult}
 *
 */
function hillClimbVigenere_(text, period, initialGuess, threshold = 25_000) {
  console.log("hill climb vigenere")
  let parentKey = initialGuess ?? Array.from({ length: period }, () => 0);
  let parentPlaintext = encipherVigenere(text, parentKey);
  let parentFitness = normalizedIoC(parentPlaintext, period);
  let counter = 0;
  while (counter < threshold) {
    let childKey = parentKey;
    for (let i = 0; i <= period + 0 * Math.floor((threshold - counter) / (threshold / period)); i++) {
      const r1 = Math.floor(Math.random() * period);
      const r2 = (Math.floor(Math.random() * 7) + 1) * (Math.floor(Math.random() * 2) * 2 - 1);
      childKey = childKey.map((l, j) => {
        if (i == j) {
          return (l + r2) % 26;
        }
        return l;
      });
    }
    let childPlaintext = encipherVigenere(text, childKey);
    let childFitness = normalizedIoC(childPlaintext, period);
    if (childFitness > parentFitness || Math.random() < 0.3 * (threshold - counter) / threshold) {
      parentKey = childKey;
      parentPlaintext = childPlaintext;
      parentFitness = childFitness;
      counter = 0;
    }
    counter++;
    if (counter % 500 == 1) console.log(counter, parentKey, childKey, parentFitness, childFitness);
  }
  console.log(parentFitness);
  return {
    key: parentKey,
    plaintext: parentPlaintext,
    fitness: parentFitness,
  };
}




/**
 *
 * @param {string} text
 * @param {number} period
 * @returns HillClimbResult
 */
/*
export function vigenereBruteForce(text, period) {
  let bestFitness = tetragramFitness2(text);
  let bestKey = Array.from({ length: period }, () => 0);

  for (let i = 0; i < Math.pow(26, period); i++) {
    let newKey = Array.from({ length: period }, (k) =>
      Math.floor(i / Math.pow(26, k)),
    );
    let newFitness = tetragramFitness2(encipherVigenere(text, newKey));
    if (newFitness > bestFitness) {
      bestFitness = newFitness;
      bestKey = newKey;
    }
  }

  return {
    key: bestKey,
    fitness: bestFitness,
    plaintext: encipherVigenere(text, bestKey),
  };
}*/

export function vigenereBruteForce(text, period) {
  let normalisedText = text.toLowerCase().replaceAll(/[^a-z]/g, '');
  let chunks = Array.from({ length: period }, _ => []);
  for (let i = 0; i < normalisedText.length; i++) {
    chunks[i % period].push(normalisedText[i]);
  }
  let freqs = Array.from({ length: period }, _ => Array.from({ length: 26 }, _ => 0));
  for (const j in chunks) {
    for (const letter of chunks[j]) {
      freqs[j][letter.charCodeAt(0) - 97]++;
    }
  }
  const key = freqs.map(freqMap => (freqMap.indexOf(Math.max(...freqMap)) - 4) % 26);
  return {
    key,
  }
}

/**
 * 
 * @param {string} text 
 * @param {number} period 
 * @returns {HillClimbResult}
 */
export function polyalphabeticHillCLimb(text, period) {
  let bigCounter = 0;
  let bestFitness = tetragramFitness2(text);
  let parentKey = Array.from({ length: period }, () => Array.from({ length: 26 }, (i) => String.fromCharCode(i + 97)));
  while (bigCounter < 20000) {
    for (let i = 0; i < period; i++) {
      
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
function playfairHillClimb(text, threshold = 25_000) {
  let parentKey = ["abcde", "fghik", "lmnop", "qrstu", "vwxyz"].map(s => s.split(''));
  let parentPlaintext = decipherPlayfair(text, parentKey);
  let parentFitness = tetragramFitness2(parentPlaintext);
  let counter = 0;
  while (counter < threshold) {
    const modeThreshold = Math.random() * 100;
    let childKey;
    if (modeThreshold < 60) {
      const [r1, r2] = uniqueRandomPair(25);
      childKey = parentKey.map((row, i) => row.map((x, j) => {
        switch (5 * i + j) {
          case r1:
            return parentKey[Math.floor(r2 / 5)][r2 % 5]
          case r2:
            return parentKey[Math.floor(r1 / 5)][r1 % 5]
          default:
            return x;
        }
      }));
    } else if (modeThreshold < 75) {
      const [r1, r2] = uniqueRandomPair(5);
      childKey = parentKey.map((row, i) => {
        switch (i) {
          case r1:
            return parentKey[r2];
          case r2:
            return parentKey[r1];
          default:
            return row;
        }
      })
    } else if (modeThreshold < 90) {
      const [r1, r2] = uniqueRandomPair(5);
      childKey = parentKey.map((row, i) => row.map((x, j) => {
        switch (j) {
          case r1:
            return row[r2];
          case r2:
            return row[r1];
          default:
            return x;
        }
      }));
    } else if (modeThreshold < 94) {
      childKey = parentKey.toReversed();
    } else if (modeThreshold < 98) {
      childKey = parentKey.map(row => row.toReversed());
    } else {
      childKey = parentKey.map(row => row.toReversed()).toReversed();
    };
    let childPlaintext = decipherPlayfair(text, childKey);
    let childFitness = tetragramFitness2(childPlaintext);
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
    fitness: parentFitness,
  };
}

self.addEventListener(
  'message',
  ({ data: { event, text, threshold, period, assumeVigenere, initialGuess } }) => {
    console.log(event, text, threshold, period, assumeVigenere);
    switch (event) {
      case 'monoalphabetic':
        self.postMessage({
          event: 'monoalphabetic-result',
          ...monoalphabeticSubstitutionHillClimb(text, threshold),
        });
        break;
      case 'polyalphabetic':
        self.postMessage({
          event: 'polyalphabetic-result',
          ...(assumeVigenere ? hillClimbVigenere(text, period, initialGuess, threshold) : polyalphabeticHillCLimb(text, period)),
        });
        break;
      case 'vigenere-bruteforce':
        self.postMessage({
          event: 'vigenere-bruteforce-result',
          ...vigenereBruteForce(text, period),
        });
      case 'playfair':
        self.postMessage({
          event: 'playfair-result',
          ...playfairHillClimb(text, threshold)
        })
      default:
        self.postMessage({ event: 'error', text: 'invalid event' });
    }
  },
);
