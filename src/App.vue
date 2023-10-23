<script setup>
    import { normalizedIoC, monogramFitness, monogramFrequencies, tetragramFitness, entropy } from './lib/fitness.js';
    import Table from './components/Table.vue';
    import Info from './components/Info.vue';
    import { reactive, ref, watch } from 'vue';
    const cyphertext = ref('');
    const plaintext = ref('');
    const ciphermode = ref('plaintext');
    const subletters = reactive('abcdefghijklmnopqrstuvwxyz'.split(''));
    watch([cyphertext, subletters, ciphermode], () => {
      cyphertext.value = cyphertext.value.toUpperCase();
      switch (ciphermode.value) {
        case 'monoalphabetic':
          plaintext.value = cyphertext.value;
          for (let i = 0; i < 26; i++) {
            plaintext.value = plaintext.value.replaceAll('ABCDEFGHIJKLMNOPQRSTUCWXYZ'[i], subletters[i]);
          }
          break;
        case 'plaintext':
        default:
          plaintext.value = cyphertext.value.toLowerCase();
          break;
      }
    });
    const subLetterInput = (e, primaryKey) => {
      e.target.textContent = e.data;
      checkSubLetterContent(e.target, primaryKey);
      if (e.target.textContent.length === 1) subletters[primaryKey.toLowerCase().charCodeAt(0) - 97] = e.target.textContent;
    };
    const checkSubLetterContent = (el, primaryKey) => {
      if (!/[a-z]/i.test(el.textContent)) {
        el.textContent = subletters[primaryKey.toLowerCase().charCodeAt(0) - 97];
      } else if (el.textContent.length > 1) {
        el.textContent = /[a-z]/i.match(el.textContent)[0].toLowerCase;
      } else {
        el.textContent = el.textContent.toLowerCase();
      }
    };
    const subLetterBlur = (e, primaryKey) => {
      checkSubLetterContent(e.target);
      subletters[primaryKey.toLowerCase().charCodeAt(0) - 97] = e.target.textContent;
    }
</script>

<template>
  <div class="container">
    <div id="ciphermodeselect">mode:
      <input type="radio" v-model="ciphermode" id="mode-plaintext" value="plaintext" name="ciphermode"><label for="mode-plaintext">plaintext</label>
      <input type="radio" v-model="ciphermode" id="mode-monoalphabetic" value="monoalphabetic" name="ciphermode"><label for="mode-monoalphabetic">monoalphabetic substitution</label>
    </div>
    <div class="container vertical">ciphertext:<textarea v-model="cyphertext"></textarea></div>
    <div class="container vertical">plaintext:<textarea v-model="plaintext" disabled></textarea></div>
    <div>
      <div>Monogram fitness: {{ monogramFitness(cyphertext).toFixed(2) }} <Info>A monogram fitness close to 1 is simlar to standard English; close to 0 is not similar.</Info></div>
      <div>Tetragram fitness: {{ tetragramFitness(cyphertext).toFixed(2) }} <Info>Less negative is a better fit to English; more negative is a worse fit.</Info></div>
      <div>Index of coincidence: {{ normalizedIoC(cyphertext).toFixed(2) }} <Info>Typical English IoC: 1.75</Info></div>
      <div>Entropy: {{ entropy(cyphertext).toFixed(2) }} <Info>A higher entropy value means it is more predictable and less random.</Info></div>
    </div>
    <details open>
      <summary>
        letter frequencies
      </summary>
      <Table
        :columns="[{ key: 'cipherletter', name: 'ciphertext letter' }, { key: 'count' }, { key: 'freq', name: 'relative frequency' }].concat(ciphermode === 'monoalphabetic' ? [{ key: 'subletter', name: 'substitution letter' }] : [])"
        :data="Object.entries(monogramFrequencies(cyphertext, true)).map((a, i) => [...a, ((a[1] / cyphertext.length) || 0).toFixed(3)].concat(ciphermode === 'monoalphabetic' ? [subletters[i]] : []))"
      >
        <template #subletter="{ data, primaryKey }">
          <div contenteditable @keydown.enter.prevent="$event.target.blur()" @input="subLetterInput($event, primaryKey)" @blur='subLetterBlur($event, primaryKey)' class="subletter-input">{{ data }}</div>
        </template>
      </Table>
    </details>
  </div>
</template>

<style scoped>
  .container {
    display: flex;
    flex-direction: row;
    align-content: stretch;
    flex-wrap: wrap;
    max-width: 100%;
    min-height: 50vh;
  }
  .vertical {
    flex-direction: column;
  }
  .item, .container > * {
    flex-grow: 1;
    margin: 1em;
  }
  table, th, td {
    border: solid black 1px;
    border-collapse: collapse;
    flex-grow: 0;
  }
  input[type="radio"] {
    display: none;
  }
  input[type="radio"] + label {
    padding: 0 0.5em;
    outline: 1px solid black;
    margin-left: 1px;
    color: black;
    transition: 0.5s;
    text-wrap: nowrap;
  }
  label[for="mode-plaintext"] {
    border-radius: 2px 0 0 2px;
  }
  div#ciphermodeselect > label:last-child {
    border-radius: 0 2px 2px 0;
  }
  input[type="radio"]:checked + label {
    color: blue;
    outline: 1px solid blue;
    transition: 0.5s;
    position: relative;
  }
  div.subletter-input {
    padding: 0;
    margin: 0;
    width: 100%;
  }
</style>