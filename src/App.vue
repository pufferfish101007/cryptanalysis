<script setup>
  import {
    normalizedIoC,
    monogramFitness,
    monogramFrequencies,
    tetragramFitness,
    entropy,
    calculateProbablePeriod,
  } from './lib/fitness.js';
  import Table from './components/Table.vue';
  import Info from './components/Info.vue';
  import Modal from './components/Modal.vue';
  import {
    decipherMonoAlphabeticSubstitution,
    encipherPeriodicSubstitution,
    inverseSubstitutionKey,
  } from './lib/cipher.js';
  import HillClimbWorker from './lib/hill-climbing.js?worker';
  import { computed, reactive, ref, watch, watchEffect } from 'vue';
  const hillClimberWorker = new HillClimbWorker();
  const modesEnum = [
    ['plaintext', 'plaintext'],
    ['monoalphabetic', 'monoalphabetic substitution'],
    ['polyalphabetic', 'periodic polyalphabetic substitution'],
  ];
  const encoding = ref(false);
  const ciphertext = ref('');
  const plaintext = ref('');
  const ciphermode = ref('plaintext');
  const subletters = reactive('abcdefghijklmnopqrstuvwxyz'.split(''));
  const polySubLetters = reactive(
    Array.from({ length: 5 }, (_) => 'abcdefghijklmnopqrstuvwxyz'.split('')),
  );
  const polyalphabeticPeriod = ref(5);
  const processingModal = ref();
  const thresholdModal = ref();
  const hillClimbThreshold = ref(25_000);
  const hillClimbType = ref('');
  const noticeModal = ref();
  const noticeModalMsg = ref('');
  const probablePeriod = ref(0);
  const probablePeriodThreshold = ref(20);
  const probablePeriodModal = ref();
  const letterFreqsColumns = computed(() =>
    reactive(
      [
        { key: 'cipherletter', name: 'ciphertext letter' },
        { key: 'count' },
        { key: 'freq', name: 'relative frequency' },
      ].concat(
        ciphermode.value === 'monoalphabetic'
          ? [{ key: 'subletter0', name: 'substitution letter' }]
          : ciphermode.value === 'polyalphabetic'
          ? Array.from({ length: polyalphabeticPeriod.value }, (_, i) => ({
              key: `subletter${i}`,
              name: `substitution letter ${i + 1}`,
            }))
          : [],
      ),
    ),
  );
  const letterFreqsData = computed(() =>
    Object.entries(monogramFrequencies(ciphertext.value, true)).map((a, i) =>
      [...a, (a[1] / ciphertext.value.length || 0).toFixed(3)].concat(
        ciphermode.value === 'monoalphabetic'
          ? [subletters[i]]
          : ciphermode.value === 'polyalphabetic'
          ? polySubLetters
              .slice(0, polyalphabeticPeriod.value ?? 0)
              .map((s) => s[i])
          : [],
      ),
    ),
  );
  watch(ciphertext, () => {
    ciphertext.value = ciphertext.value.toUpperCase();
  });
  watch(polyalphabeticPeriod, () => {
    if (polyalphabeticPeriod.value > polySubLetters.length) {
      polySubLetters.push(
        ...Array.from(
          { length: polyalphabeticPeriod.value - polySubLetters.length },
          (_) => 'abcdefghijklmnopqrstuvwxyz'.split(''),
        ),
      );
    }
  });
  watchEffect(() => {
    if (encoding.value) return;
    let c = ciphertext.value;
    switch (ciphermode.value) {
      case 'monoalphabetic':
        plaintext.value = decipherMonoAlphabeticSubstitution(c, subletters);
        break;
      case 'polyalphabetic':
        plaintext.value = encipherPeriodicSubstitution(
          c,
          polySubLetters.map(inverseSubstitutionKey),
        );
        break;
      case 'plaintext':
      default:
        plaintext.value = c.toLowerCase();
        break;
    }
  });
  watchEffect(() => {
    if (!encoding.value) return;
    let p = plaintext.value;
    switch (ciphermode.value) {
      case 'monoalphabetic':
        ciphertext.value = decipherMonoAlphabeticSubstitution(
          p,
          inverseSubstitutionKey(subletters),
        );
        break;
      case 'polyalphabetic':
        ciphertext.value = encipherPeriodicSubstitution(p, polySubLetters);
        break;
      case 'plaintext':
      default:
        ciphertext.value = p.toUpperCase();
        break;
    }
  });
  const subLetterInput = (e, primaryKey) => {
    e.target.textContent = e.data;
    checkSubLetterContent(e.target, primaryKey);
    if (e.target.textContent.length === 1)
      subletters[primaryKey.toLowerCase().charCodeAt(0) - 97] =
        e.target.textContent;
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
    subletters[primaryKey.toLowerCase().charCodeAt(0) - 97] =
      e.target.textContent;
  };
  hillClimberWorker.addEventListener(
    'message',
    ({ data: { event, text, key, plaintext } }) => {
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
    },
  );
  const hillClimb = (type) => {
    hillClimbType.value = type;
    thresholdModal.value.show();
  };
  const thresholdModalCloseListener = (val) => {
    switch (val) {
      case 'ok':
        sendHillClimb(hillClimbType.value);
        break;
    }
  };
  const sendHillClimb = (type) => {
    hillClimberWorker.postMessage({
      event: type,
      text: ciphertext.value,
      threshold: hillClimbThreshold.value,
    });
    processingModal.value.show();
  };
  const quickVigenere = (e) => {
    const key = e.target.key.value.toLowerCase();
    polyalphabeticPeriod.value = key.length;
    for (const i in key) {
      const offset = key[i].charCodeAt(0) - 97;
      polySubLetters[i] = Array.from({ length: 26 }, (_, i) =>
        String.fromCharCode(((i + offset) % 26) + 97),
      );
    }
  };
  const quickCaesar = (e) => {
    const offset = +e.target.key.value;
    subletters.forEach(
      (_, i) => (subletters[i] = String.fromCharCode(((i + offset) % 26) + 97)),
    );
  };
  const calcProbablePeriod = () => {
    probablePeriodModal.value.show();
  };
</script>

<template>
  <div class="container">
    <div id="ciphermodeselect">
      mode:
      <template v-for="[id, display] in modesEnum" :key="id">
        <input
          type="radio"
          v-model="ciphermode"
          :id="`mode-${id}`"
          :value="id"
          name="ciphermode"
        />
        <label :for="`mode-${id}`">{{ display }}</label>
      </template>
    </div>
    <div v-if="ciphermode === 'polyalphabetic'">
      <label
        >period: <input type="number" v-model="polyalphabeticPeriod"
      /></label>
    </div>
    <div v-if="ciphermode === 'polyalphabetic'">
      quick access keys:
      <form @submit.prevent="quickVigenere">
        <label
          >vigenère: <input type="text" name="key" style="max-width: 4em"
        /></label>
        <button type="submit">go</button>
      </form>
    </div>
    <div v-if="ciphermode === 'monoalphabetic'">
      quick access keys:
      <form @submit.prevent="quickCaesar">
        <label
          >caesar:
          <input type="number" name="key" value="3" style="max-width: 4em"
        /></label>
        <button type="submit">go</button>
      </form>
      <button
        @click="
          subletters.forEach(
            (_, i) => (subletters[i] = 'zyxwvutsrqponmlkjihgfedcba'[i]),
          )
        "
      >
        atbash
      </button>
    </div>
    <div>
      <label> <input type="checkbox" v-model="encoding" /> Reverse? </label>
    </div>
    <div v-if="ciphermode === 'polyalphabetic'">
      probable period: {{ probablePeriod || 'unknown' }}
      <button @click="calcProbablePeriod">recalculate</button>
      <button
        v-if="probablePeriod > 0"
        @click="polyalphabeticPeriod = probablePeriod"
      >
        use this period
      </button>
    </div>
    <div class="container vertical">
      ciphertext:<textarea v-model="ciphertext" :disabled="encoding"></textarea>
    </div>
    <div class="container vertical">
      plaintext:<textarea v-model="plaintext" :disabled="!encoding"></textarea>
    </div>
    <div>
      <div>
        Monogram fitness: {{ monogramFitness(ciphertext).toFixed(2) }}
        <Info
          >A monogram fitness close to 1 is similar to standard English; close
          to 0 is not similar.</Info
        >
      </div>
      <div>
        Tetragram fitness: {{ tetragramFitness(ciphertext).toFixed(2) }}
        <Info
          >Less negative is a better fit to English; more negative is a worse
          fit.</Info
        >
      </div>
      <div>
        Index of coincidence: {{ normalizedIoC(ciphertext).toFixed(2) }}
        <Info>Typical English IoC: 1.75</Info>
      </div>
      <div>
        Entropy: {{ entropy(ciphertext).toFixed(2) }}
        <Info
          >A higher entropy value means it is more random and less
          predictable.</Info
        >
      </div>
    </div>
    <div>
      <button
        v-if="ciphermode === 'monoalphabetic' && !encoding"
        @click="hillClimb('monoalphabetic')"
      >
        <!-- prettier-ignore -->
        carry out stochastic hill climbing attack for monoalphabetic substitution cipher
      </button>
    </div>
    <details open>
      <summary>letter frequencies</summary>
      <Table :columns="letterFreqsColumns" :data="letterFreqsData">
        <template
          v-for="i in polyalphabeticPeriod"
          #[`subletter${i-1}`]="{ data, primaryKey }"
        >
          <div
            contenteditable
            @keydown.enter.prevent="$event.target.blur()"
            @input="subLetterInput($event, primaryKey)"
            @blur="subLetterBlur($event, primaryKey)"
            class="subletter-input"
          >
            {{ data }}
          </div>
        </template>
      </Table>
    </details>
  </div>
  <Modal
    ref="thresholdModal"
    :closeonblur="false"
    :close-buttons="['cancel', 'ok']"
    @close="thresholdModalCloseListener"
  >
    <label>
      hill climbing threshold
      <input type="number" v-model="hillClimbThreshold" />
    </label>
  </Modal>
  <Modal ref="processingModal" :closeonblur="false" :close-buttons="[]"
    ><span id="processing-span">processing</span></Modal
  >
  <Modal ref="noticeModal" closeonblur>
    {{ noticeModalMsg }}
  </Modal>
  <Modal
    ref="probablePeriodModal"
    :close-buttons="['cancel', 'ok']"
    @close="
      (v) => {
        if (v === 'ok') {
          probablePeriod = calculateProbablePeriod(
            ciphertext,
            probablePeriodThreshold,
          );
        }
      }
    "
  >
    <label>
      probable period threshold:
      <input type="number" v-model="probablePeriodThreshold" />
    </label>
  </Modal>
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
  .item,
  .container > * {
    flex-grow: 1;
    margin: 1em;
  }
  table,
  th,
  td {
    border: solid black 1px;
    border-collapse: collapse;
    flex-grow: 0;
  }
  input[type='radio'] {
    display: none;
  }
  input[type='radio'] + label {
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
  input[type='radio']:checked + label {
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
    content: '...';
    font-family: monospace;
    animation: loading 0.8s infinite linear;
  }
  @keyframes loading {
    0% {
      content: '\0000a0\0000a0\0000a0';
    }
    25% {
      content: '.\0000a0\0000a0';
    }
    50% {
      content: '..\0000a0';
    }
    75% {
      content: '...';
    }
  }
</style>
