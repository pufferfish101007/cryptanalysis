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
  for (let i = 0; i < period; i++) {
    for (let j = i; j < plaintext.length; j += period) {
      plaintext[j] = key[i][plaintext[j].charCodeAt(0) - 65] ?? plaintext[j];
    }
  }
  return plaintext.join('');
}
