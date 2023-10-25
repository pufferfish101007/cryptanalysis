<script setup>
    import { normalizedIoC, monogramFitness, monogramFrequencies, tetragramFitness, entropy } from './lib/fitness.js';
    import Table from './components/Table.vue';
    import Info from './components/Info.vue';
    import Modal from './components/Modal.vue';
    import { decipherMonoAlphabeticSubstitution } from './lib/hill-climbing.js';
    import HillClimbWorker from './lib/hill-climbing.js?worker'
    import { computed, reactive, ref, watch } from 'vue';
    const hillClimberWorker = new HillClimbWorker();
    const modesEnum = [['plaintext', 'plaintext'], ['monoalphabetic', 'monoalphabetic substitution'], ['polyalphabetic', 'periodic polyalphabetic substitution']];
    const cyphertext = ref('');
    const ciphermode = ref('plaintext');
    const subletters = reactive('abcdefghijklmnopqrstuvwxyz'.split(''));
    const polySubLetters = reactive(Array.from({ length: 5 }, _ => 'abcdefghijklmnopqrstuvwxyz'.split('')))
    const polyalphabeticPeriod = ref(5);
    const processingModal = ref();
    const thresholdModal = ref();
    const hillClimbThreshold = ref(25_000);
    const hillClimbType = ref('');
    const letterFreqsColumns = computed(() => reactive(
      [
        { key: 'cipherletter', name: 'ciphertext letter' },
        { key: 'count' },
        { key: 'freq', name: 'relative frequency' }
      ].concat(ciphermode.value === 'monoalphabetic' ? 
      [{ key: 'subletter0', name: 'substitution letter' }] : 
      (ciphermode.value === 'polyalphabetic' ?
        Array.from({ length: polyalphabeticPeriod.value }, (_, i) => ({ 
            key: `subletter${i}`,
            name: `substitution letter ${i + 1}`
          })
        ) : [])
      )
    ));
    const letterFreqsData = computed(() => Object.entries(monogramFrequencies(cyphertext.value, true)).map((a, i) => [
        ...a, 
        ((a[1] / cyphertext.value.length) || 0).toFixed(3)].concat(
          ciphermode.value === 'monoalphabetic' ? 
          [subletters[i]] :
          (ciphermode.value === 'polyalphabetic' ?
            polySubLetters.slice(0, polyalphabeticPeriod.value ?? 0).map(s => s[i]) :
            []))
    ));
    watch(cyphertext, () => {
      cyphertext.value = cyphertext.value.toUpperCase();
    })
    watch(polyalphabeticPeriod, () => {
      console.log('pap')
      if (polyalphabeticPeriod.value > polySubLetters.length) {
        console.log('big pap')
        polySubLetters.push(...Array.from({ length: polyalphabeticPeriod.value - polySubLetters.length }, _ => 'abcdefghijklmnopqrstuvwxyz'.split('')));
        console.log(polySubLetters)
      }
    });
    const plaintext = computed(() => {
      let c = cyphertext.value;
      switch (ciphermode.value) {
        case 'monoalphabetic':
          return decipherMonoAlphabeticSubstitution(c, subletters);
          break;
        case 'plaintext':
        default:
          return c.toLowerCase();
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
    hillClimberWorker.addEventListener('message', ({ data: { event, text, key, plaintext }}) => {
      console.log('worker msg: %s (key?: %s)', event, key);
      switch (event) {
        case 'error':
          console.error(text);
          break;
        case 'monoalphabetic-result':
          subletters.forEach((_, i) => {
            subletters[i] = key[i];
          });
      }
      processingModal.value.close();
    });
    const hillClimb = (type) => {
      hillClimbType.value = type;
      thresholdModal.value.show();
    }
    const thresholdModalCloseListener = (val) => {
            switch (val) {
              case 'ok':
                sendHillClimb(hillClimbType.value);
                break;
            }
        };
    const sendHillClimb = (type) => {
      hillClimberWorker.postMessage({ event: type, text: cyphertext.value, threshold: hillClimbThreshold.value });
      processingModal.value.show();
    }
</script>

<template>
  <div class="container">
    <div id="ciphermodeselect">mode:
      <template v-for="[id, display] in modesEnum">
        <input type="radio" v-model="ciphermode" :id="`mode-${id}`" :value="id" name="ciphermode">
        <label :for="`mode-${id}`">{{ display }}</label>
      </template>
    </div>
    <div v-if="ciphermode === 'polyalphabetic'"><label>period: <input type="number" v-model="polyalphabeticPeriod"></label></div>
    <div class="container vertical">ciphertext:<textarea v-model="cyphertext"></textarea></div>
    <div class="container vertical">plaintext:<textarea v-model="plaintext" disabled></textarea></div>
    <div>
      <div>Monogram fitness: {{ monogramFitness(cyphertext).toFixed(2) }} <Info>A monogram fitness close to 1 is simlar to standard English; close to 0 is not similar.</Info></div>
      <div>Tetragram fitness: {{ tetragramFitness(cyphertext).toFixed(2) }} <Info>Less negative is a better fit to English; more negative is a worse fit.</Info></div>
      <div>Index of coincidence: {{ normalizedIoC(cyphertext).toFixed(2) }} <Info>Typical English IoC: 1.75</Info></div>
      <div>Entropy: {{ entropy(cyphertext).toFixed(2) }} <Info>A higher entropy value means it is more predictable and less random.</Info></div>
    </div>
    <button v-if="ciphermode === 'monoalphabetic'" @click="hillClimb('monoalphabetic')">carry out stochastic hill climbing attack for monoalphabetic substituion cipher</button>
    <details open>
      <summary>
        letter frequencies
      </summary>
      <Table
        :columns="letterFreqsColumns"
        :data="letterFreqsData"
      >
        <template v-for="i in polyalphabeticPeriod" #[`subletter${i-1}`]="{ data, primaryKey }">
          <div contenteditable @keydown.enter.prevent="$event.target.blur()" @input="subLetterInput($event, primaryKey)" @blur='subLetterBlur($event, primaryKey)' class="subletter-input">{{ data }}</div>
        </template>
      </Table>
    </details>
  </div>
  <Modal ref="thresholdModal" :closeonblur="false" :close-buttons="['cancel', 'ok']" @close="thresholdModalCloseListener">
    <label>
      Hill climbing threshold
      <input type="number" v-model="hillClimbThreshold">
    </label>
  </Modal>
  <Modal ref="processingModal" :closeonblur="false" :close-buttons="[]"><span id="processing-span">processing</span></Modal>
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
  div#ciphermodeselect > label:nth-child(2) {
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
  span#processing-span::after {
    content: "...";
    font-family: monospace;
    animation: loading 0.8s infinite linear;
  }
  @keyframes loading {
    0% {
      content: "\0000a0\0000a0\0000a0";
    }
    25% {
      content: ".\0000a0\0000a0";
    }
    50% {
      content: "..\0000a0";
    }
    75% {
      content: "...";
    }
  } 
</style>