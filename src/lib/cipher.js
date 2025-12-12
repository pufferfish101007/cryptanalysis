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
  let plaintext = text.toUpperCase().replaceAll(/[^A-Z]/g, '');
  let period = key.length;
  while (plaintext.length % period !== 0) {
    plaintext += 'X';
  }
  let output = '';
  for (let i = 0; i < period; i++) {
    for (let j = key[i]; j < plaintext.length; j += period) {
      console.log(j)
      output += plaintext[j];
      if (output.length % (period + 1) === period) {
        output += ' ';
      } 
    }
  }
  return output;
}

export function decipherColumnarTransposition(text, key) {
  let plaintext = text.toLowerCase().replaceAll(/[^a-z]/g, '');
  let period = key.length;
  while (plaintext.length % period !== 0) {
    plaintext += 'x';
  }
  let blocksize = plaintext.length / period;
  let output = '';
  for (let i = 0; i < blocksize; i++) {
    for (let j = 0; j < period; j++) {
      console.log(i, j, key.indexOf(j) * blocksize + i, plaintext[key.indexOf(j) * blocksize + i])
      output += plaintext[key.indexOf(j) * blocksize + i];
      if (output.length % (period + 1) === period) {
        output += ' ';
      } 
    }
  }
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

export function fiveSquareRowCol(idx) {
  return [Math.floor(idx / 5), idx % 5]
}

/**
 * 
 * @param {string[]} textChunks
 * @param {string[]} key 
 * @returns 
 */
function playfair(textChunks, key) {
  let output = "";
  for (let i = 0; i < textChunks.length; i++) {
    const [a, b] = textChunks[i];
    const [aRow, aCol] = fiveSquareRowCol(key.findIndex(x => x === a));
    const [bRow, bCol] = fiveSquareRowCol(key.findIndex(x => x === b));
    if (aRow === bRow) {
      output += key[5 * aRow + ((aCol + 1) % 5)];
      output += key[5 * bRow + ((bCol + 1) % 5)];
      continue;
    }
    if (aCol === bCol) {
      output += key[5 * ((aRow + 1) % 5) + aCol];
      output += key[5 * ((bRow + 1) % 5) + bCol];
      continue;
    }
    output += key[5 * aRow + bCol];
    output += key[5 * bRow + aCol];
  }

  return output;
}

/**
 * 
 * @param {string} text 
 * @param {string[][]} key 
 * @returns 
 */
export function encipherPlayfair(text, key) {
  text = (text ?? '').toLowerCase().replaceAll(/[^a-z]/g, '').replaceAll('j', 'i');
  const chars = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (chars.length % 2 === 0) {
      chars.push(char);
      continue;
    }
    if (chars.at(-1) === char) {
      chars.push('x');
      i--;
      continue;
    }
    chars.push(char);
  }

  if (chars.length % 2 == 1) {
    chars.push('x');
  }

  let textChunks = [];
  for (let j = 0; j < chars.length; j++) {
    if ((textChunks.at(-1) ?? ['','']).length == 2) {
      textChunks.push([chars[j]]);
    } else {
      textChunks.at(-1).push(chars[j]);
    }
  }
  textChunks = textChunks.map(cs => cs.join(''));

  return playfair(textChunks, key.flat());
}

/**
 * 
 * @param {string} text 
 * @param {string[][]} key 
 * @returns 
 */
export function decipherPlayfair(text, key) {
  const textChunks = (text ?? '').toLowerCase().replaceAll(/[^a-z]/g, '').replaceAll('j', 'i').match(/.{1,2}/g) ?? [];
  return playfair(textChunks, key.toReversed().map(a => a.toReversed()).flat());
}