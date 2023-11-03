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
      plaintext[i] = String.fromCharCode((plaintext[i].charCodeAt(0) - 39 + key[i % period]) % 26 + 97);
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
      if (!plaintext[pos]) break $outer;
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
