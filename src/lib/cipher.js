/**
 * @param {String|Array<String>} key
 * @returns {String}
 */
export function inverseSubstitutionKey(key) {
  let inverse = Array.from({ length: 26 });
  for (const i in key) {
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
