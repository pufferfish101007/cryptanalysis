/**
 * @param {String|Array<String>} key
 * @returns {String}
 */
export function inverseSubstitutionKey(key) {
  let inverse = Array.from({ length: 26 });
  for (let i = 0; i < 26; i++) {
    inverse[key[i].charCodeAt(0) - 97] = String.fromCharCode(+i + 97);
  }
  return inverse.join('');
}

/**
 * calculate an inverse permutation. permutations should start at 0.
 * @param {Array<number>} key
 * @returns {Array<number>}
 */
export function inversePermutation(key) {
  let inverse = Array.from({ length: key.length });
  for (let i = 0; i < key.length; i++) {
    inverse[key[i]] = i;
  }
  return inverse;
}

/**
 *
 * @param {string} text
 * @param {string|Array<string>} key
 * @returns {string}
 */
export function decipherMonoAlphabeticSubstitution(text, key) {
  let plaintext = text.toUpperCase();
  if (Array.isArray(key)) {
    key = key.map((l) => l.toLowerCase());
  } else key = key.toLowerCase();
  for (let i = 0; i < 26; i++) {
    plaintext = plaintext.replaceAll('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i], key[i]);
  }
  return plaintext;
}

/**
 *
 * @param {string} text
 * @param {Array<string|Array<string>>} key
 * @returns {string}
 */
export function encipherPeriodicSubstitution(text, key) {
  let plaintext = text.toUpperCase().split('');
  const period = key.length;
  key.forEach((v, i) => {
    if (Array.isArray(v)) {
      key[i] = v.join('');
    }
    // @ts-ignore
    key[i] = key[i].toLowerCase();
  });
  let counter = -1;
  for (let i = 0; i < plaintext.length; i++) {
    if (/[A-Z]/.test(plaintext[i])) {
      counter++;
      plaintext[i] = key[counter % period][plaintext[i].charCodeAt(0) - 65];
    }
  }
  return plaintext.join('');
}

/**
 *
 * @param {string} text
 * @param {Array<number>} key
 * @returns {string}
 */
export function encipherVigenere(text, key) {
  let plaintext = text.toUpperCase().split('');
  const period = key.length;
  let counter = -1;
  for (let i = 0; i < plaintext.length; i++) {
    if (/[A-Z]/.test(plaintext[i])) {
      counter++;
      plaintext[i] = String.fromCharCode(
        ((plaintext[i].charCodeAt(0) - 39 + key[i % period]) % 26) + 97,
      );
    }
  }
  return plaintext.join('');
}

export function encipherBlockTransposition(text, key) {
  let plaintext = text.toUpperCase().split('');
  let newtext = '';
  const period = key.length;
  let pos = 0;
  $outer: while (true) {
    let block = [];
    while (block.length < period) {
      if (!plaintext[pos]) {
        newtext += block.join('');
        break $outer;
      }
      if (/[A-Z]/.test(plaintext[pos])) {
        block.push(plaintext[pos]);
      }
      pos++;
    }
    let newBlock = Array.from({ length: period });
    for (let i = 0; i < period; i++) {
      newBlock[key[i]] = block[i];
    }
    newtext += newBlock.join('') + ' ';
  }
  return newtext;
}

export function encipherColumnarTransposition(text, key) {
  let plaintext = text.toUpperCase().split('');
  let period = key.length;
  for (let i = 0; i < plaintext.length % period; i++) {
    plaintext += 'X';
  }
  let shuffled = encipherBlockTransposition(plaintext.join(''), key);
  let blocks = [];
  let blockSize = plaintext.length / period;
  for (let i = 0; i < period; i++) {
    blocks.push(plaintext.slice(i * blockSize, (i + 1) * blockSize));
  }
  let output = '';
  for (let i = 0; i < blockSize; i++) {
    for (let j = 0; j < period; j++) {
      output += blocks[j][i];
    }
    output += ' ';
  }
  return output;
}

export function decipherColumnarTransposition(text, key) {
  let plaintext = text.toUpperCase().split('');
  let period = key.length;
  let blocks = [];
  let blockSize = plaintext.length / period;
  for (let i = 0; i < period; i++) {
    blocks.push(plaintext.slice(i * blockSize, (i + 1) * blockSize));
  }
  let shuffled = '';
  for (let i = 0; i < blockSize; i++) {
    for (let j = 0; j < period; j++) {
      shuffled += blocks[j][i];
    }
    shuffled += ' ';
  }
  let output = encipherBlockTransposition(shuffled, inversePermutation(key));
  return output;
}

const morse = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  1: '.----',
  2: '..---',
  3: '...--',
  4: '....-',
  5: '.....',
  6: '-....',
  7: '--...',
  8: '---..',
  9: '----.',
  0: '-----',
  ' ': '/'
};

const reverseMorse = Object.fromEntries(Object.entries(morse).map(([a, b]) => [b, a]));

const morsePunctMap = {
  ',': '--..--',
  '.': '.-.-.-',
  '?': '..--..',
  ';': '-.-.-',
  ':': '---...',
  '/': '-..-.',
  '-': '-....-',
  "'": '.----.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  _: '..--.-',
  '@': '.--.-.',
};

const reverseMorsePunctMap = Object.fromEntries(Object.entries(morsePunctMap).map(([a, b]) => [b, a]));

console.log(reverseMorse, reverseMorsePunctMap)

export function decipherMorse(text, punct=false) {
  console.log('dm')
  let plaintext = '';
  let i = -1;
  $outer: while (true) {
    let chunk = '';
    while (true) {
      i++;
      if (!text[i]) break $outer;
      if (text[i] === '/') plaintext += ' ';
      if (!/\.|-/.test(text[i])) {
        break;
      } else {
        chunk += text[i];
      }
      console.log(chunk)
    }
    plaintext += reverseMorse[chunk] ?? ((punct ? reverseMorsePunctMap[chunk] : null) ?? chunk);
  }
  return plaintext;
}

export function encipherMorse(text, punct=false) {
  console.log('em');
  let plaintext = '';
  for (const i in text) {
    let t = text[i].toUpperCase();
    console.log(morse[t])
    console.log(morsePunctMap[t])
    console.log(t);
    plaintext += (morse[t] ?? (punct ? (morsePunctMap[t] ?? t) : t)) + ' ';
  }
  return plaintext;
}
