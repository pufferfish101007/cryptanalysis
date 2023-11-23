<script setup>
  import {
    normalizedIoC,
    monogramFitness,
    monogramFrequencies,
    tetragramFitness,
    entropy,
    calculateProbablePeriod,
  } from '../lib/fitness.js';
  import Table from './Table.vue';
  import Info from './Info.vue';
  import Modal from './Modal.vue';
  import {
    decipherMonoAlphabeticSubstitution,
    encipherBlockTransposition,
    encipherPeriodicSubstitution,
    inverseSubstitutionKey,
    inversePermutation,
    encipherMorse,
    decipherMorse,
  } from '../lib/cipher.js';
  import HillClimbWorker from '../lib/hill-climbing.js?worker';
  import { computed, reactive, ref, watch, watchEffect } from 'vue';
  import { useStore } from '../stores/store.js';
  const props = defineProps({
    tabId: {
      required: true,
      type: String,
    },
  });
  const store = useStore();
  //let info = store.workspaces[props.tabId];
  //watch([props, info.subletters], () => {info = store.workspaces[props.tabId];console.log(props.tabId, info, info.subletters)},{immediate:true})
  const info = computed(() => store.workspaces[props.tabId]);
  //const hillClimberWorker = new HillClimbWorker();
  const modesEnum = [
    ['plaintext', 'plaintext'],
    ['monoalphabetic', 'monoalphabetic substitution'],
    ['polyalphabetic', 'periodic polyalphabetic substitution'],
    ['permutation', 'block transposition/permutation'],
    ['morse', 'morse code'],
  ];
  const plaintext = ref('');
  const processingModal = ref();
  const thresholdModal = ref();
  const hillClimbType = ref('');
  const noticeModal = ref();
  const noticeModalMsg = ref('');
  const probablePeriodModal = ref();
  let permutationText = computed({
    get: () => info.value.permutation.map(x => x.toString(16)).join(''),
    set: (newVal) => {
      let arr = newVal
        .split('')
        .map(x => parseInt(x, 16))
        .map((n) => (Number.isNaN(n) ? 0 : n));
      if (!arr.length) arr.push(0);
      info.value.permutation = reactive(arr);
    },
  });
  const letterFreqsColumns = computed(() =>
    reactive(
      [
        { key: 'cipherletter', name: 'ciphertext letter' },
        { key: 'count' },
        { key: 'freq', name: 'relative frequency' },
      ].concat(
        info.value.ciphermode === 'monoalphabetic'
          ? [{ key: 'subletter0', name: 'substitution letter' }]
          : info.value.ciphermode === 'polyalphabetic'
          ? Array.from({ length: info.value.polyalphabeticPeriod }, (_, i) => ({
              key: `subletter${i}`,
              name: `substitution letter ${i + 1}`,
            }))
          : [],
      ),
    ),
  );
  const letterFreqsData = computed(() =>
    Object.entries(monogramFrequencies(info.value.ciphertext, true)).map(
      (a, i) =>
        [...a, (a[1] / info.value.ciphertext.length || 0).toFixed(3)].concat(
          info.value.ciphermode === 'monoalphabetic'
            ? [info.value.subletters[i]]
            : info.value.ciphermode === 'polyalphabetic'
            ? info.value.polySubLetters
                .slice(0, info.value.polyalphabeticPeriod ?? 0)
                .map((s) => s[i])
            : [],
        ),
    ),
  );
  watch(
    () => info.value.ciphertext,
    () => {
      info.value.ciphertext = info.value.ciphertext.toUpperCase();
    },
  );
  watch(
    () => info.value.polyalphabeticPeriod,
    () => {
      if (info.value.polyalphabeticPeriod > info.value.polySubLetters.length) {
        info.value.polySubLetters.push(
          ...Array.from(
            {
              length:
                info.value.polyalphabeticPeriod -
                info.value.polySubLetters.length,
            },
            (_) => 'abcdefghijklmnopqrstuvwxyz'.split(''),
          ),
        );
      }
    },
  );
  watchEffect(() => {
    if (info.value.encoding) return;
    let c = info.value.ciphertext;
    switch (info.value.ciphermode) {
      case 'monoalphabetic':
        plaintext.value = decipherMonoAlphabeticSubstitution(
          c,
          info.value.subletters,
        );
        break;
      case 'polyalphabetic':
        plaintext.value = encipherPeriodicSubstitution(
          c,
          info.value.polySubLetters
            .slice(0, info.value.polyalphabeticPeriod)
            .map(inverseSubstitutionKey),
        );
        break;
      case 'permutation':
        plaintext.value = encipherBlockTransposition(
          c,
          inversePermutation(info.value.permutation),
        );
        break;
      case 'morse':
        plaintext.value = decipherMorse(c, info.value.useMorsePunct);
        break;
      case 'plaintext':
      default:
        plaintext.value = c.toLowerCase();
        break;
    }
  });
  watchEffect(() => {
    if (!info.value.encoding) return;
    let p = plaintext.value;
    switch (info.value.ciphermode) {
      case 'monoalphabetic':
        info.value.ciphertext = decipherMonoAlphabeticSubstitution(
          p,
          inverseSubstitutionKey(info.value.subletters),
        );
        break;
      case 'polyalphabetic':
        info.value.ciphertext = encipherPeriodicSubstitution(
          p,
          info.value.polySubLetters.slice(0, info.value.polyalphabeticPeriod),
        );
        break;
      case 'permutation':
        info.value.ciphertext = encipherBlockTransposition(
          p,
          info.value.permutation,
        );
        break;
      case 'morse':
        info.value.ciphertext = encipherMorse(p, info.value.useMorsePunct);
        break;
      case 'plaintext':
      default:
        info.value.ciphertext = p.toUpperCase();
        break;
    }
  });
  const subLetterInput = (e, primaryKey) => {
    e.target.textContent = e.data;
    checkSubLetterContent(e.target, primaryKey);
    if (e.target.textContent.length === 1)
      info.value.subletters[primaryKey.toLowerCase().charCodeAt(0) - 97] =
        e.target.textContent;
  };
  const checkSubLetterContent = (el, primaryKey) => {
    if (!/[a-z]/i.test(el.textContent)) {
      el.textContent =
        info.value.subletters[primaryKey.toLowerCase().charCodeAt(0) - 97];
    } else if (el.textContent.length > 1) {
      el.textContent = /[a-z]/i.match(el.textContent)[0].toLowerCase;
    } else {
      el.textContent = el.textContent.toLowerCase();
    }
  };
  const subLetterBlur = (e, primaryKey) => {
    checkSubLetterContent(e.target);
    info.value.subletters[primaryKey.toLowerCase().charCodeAt(0) - 97] =
      e.target.textContent;
  };
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
    let waiting = info.value.hillClimbThreads;
    const results = [];
    for (let i = 0; i < info.value.hillClimbThreads; i++) {
      let hillClimbWorker = new HillClimbWorker();
      hillClimbWorker.addEventListener(
        'message',
        ({ data: { event, text, key, fitness, plaintext } }) => {
          console.log('worker msg: %s (key?: %s)', event, key);
          switch (event) {
            case 'error':
              console.error(text);
              break;
            case 'monoalphabetic-result':
            case 'polyalphabetic-result':
              /*info.subletters.forEach((_, i) => {
              info.subletters[i] = key[i];
            });*/
              results.push({
                key,
                fitness,
              });
            /*store.duplicateWorkspace(props.tabId, {
              name: 'hill-climb result',
              subletters: key,
            });
            store.focusWorkspace(store.tabs.at(-1));*/
          }
          waiting--;
          if (waiting === 0) {
            results.sort((a, b) => a.fitness - b.fitness);
            console.log(results.length, structuredClone(results), results[0]);
            for (let j = 0; j < info.value.hillClimbResultsNum; j++) {
              if (!results.length) break;
              console.log(structuredClone(results));
              store.duplicateWorkspace(props.tabId, {
                name: `hill-climb result ${j + 1}`,
                ...{
                  monoalphabetic: { subletters: results.pop().key },
                  polyalphabetic: info.value.assumeVigenere
                    ? {
                        polySubLetters: results
                          .pop()
                          .key.map((offset) =>
                            Array.from({ length: 26 }, (_, k) =>
                              String.fromCharCode(((k + offset) % 26) + 97),
                            ),
                          ),
                      }
                    : {},
                }[hillClimbType.value],
              });
              console.log('a');
              if (j === 0) {
                store.focusWorkspace(store.tabs.at(-1));
              }
            }
            processingModal.value.close();
          }
          hillClimbWorker.terminate();
        },
      );
      hillClimbWorker.postMessage({
        event: type,
        text: info.value.ciphertext,
        threshold: info.value.hillClimbThreshold,
        period: info.value.polyalphabeticPeriod,
        assumeVigenere: info.value.assumeVigenere,
        initialGuess: info.value.assumeVigenere ? info.value.vigenereInitialGuess.toLowerCase().split('').map(c => c.charCodeAt(0) - 97) : null,
      });
    }
    processingModal.value.show();
  };
  const quickVigenere = (e) => {
    const key = e.target.key.value.toLowerCase();
    info.value.polyalphabeticPeriod = key.length;
    for (const i in key) {
      const offset = key[i].charCodeAt(0) - 97;
      info.value.polySubLetters[i] = Array.from({ length: 26 }, (_, i) =>
        String.fromCharCode(((i + offset) % 26) + 97),
      );
    }
  };
  const quickCaesar = (e) => {
    const offset = +e.target.key.value;
    info.value.subletters.forEach(
      (_, i) =>
        (info.value.subletters[i] = String.fromCharCode(
          ((i + offset) % 26) + 97,
        )),
    );
  };
  const calcProbablePeriod = () => {
    probablePeriodModal.value.show();
  };
  const bruteForceVigenere = () => {
    processingModal.value.show();
    const worker = new HillClimbWorker();
    worker.addEventListener(
      'message',
      ({ data: { event, text, key, fitness, plaintext, chunks } }) => {
        if (event === 'vigenere-bruteforce-result') {
          store.duplicateWorkspace(props.tabId, {
            name: 'vigenère brute-force result',
            polySubLetters: key.map((offset) =>
              Array.from({ length: 26 }, (_, i) =>
                String.fromCharCode(((i + offset) % 26) + 97),
              ),
            ),
          });
          store.focusWorkspace(store.tabs.flat(-1));
        } else {
          console.error(`invalid worker event: ${event}`);
        }
        processingModal.value.close();
        worker.terminate();
      },
    );
    worker.postMessage({
      event: 'vigenere-bruteforce',
      text: info.value.ciphertext,
      period: info.value.polyalphabeticPeriod,
    });
  };
</script>

<template>
  <div class="container">
    <div id="ciphermodeselect">
      mode:
      <template v-for="[id, display] in modesEnum" :key="id">
        <input
          type="radio"
          v-model="info.ciphermode"
          :id="`mode-${id}`"
          :value="id"
          name="ciphermode"
        />
        <label :for="`mode-${id}`">{{ display }}</label>
      </template>
    </div>
    <div v-if="info.ciphermode === 'polyalphabetic'">
      <label
        >period: <input type="number" v-model="info.polyalphabeticPeriod"
      /></label>
    </div>
    <div v-if="info.ciphermode === 'polyalphabetic'">
      quick access keys:
      <form @submit.prevent="quickVigenere">
        <label
          >vigenère: <input type="text" name="key" style="max-width: 4em"
        /></label>
        <button type="submit">go</button>
      </form>
    </div>
    <div v-if="info.ciphermode === 'monoalphabetic'">
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
          info.subletters.forEach(
            (_, i) => (info.subletters[i] = 'zyxwvutsrqponmlkjihgfedcba'[i]),
          )
        "
      >
        atbash
      </button>
    </div>
    <div>
      <label>
        <input type="checkbox" v-model="info.encoding" /> Reverse?
      </label>
    </div>
    <div v-if="info.ciphermode === 'polyalphabetic'">
      probable period: {{ info.probablePeriod || 'unknown' }}
      <button @click="calcProbablePeriod">recalculate</button>
      <button
        v-if="info.probablePeriod > 0"
        @click="info.polyalphabeticPeriod = info.probablePeriod"
      >
        use this period
      </button>
    </div>
    <div class="container vertical">
      ciphertext:<textarea
        v-model="info.ciphertext"
        :disabled="info.encoding"
      ></textarea>
    </div>
    <div class="container vertical">
      plaintext:<textarea
        v-model="plaintext"
        :disabled="!info.encoding"
      ></textarea>
    </div>
    <div v-if="info.ciphermode === 'permutation'">
      <input type="text" v-model="permutationText" />
    </div>
    <div>
      <div>
        Monogram fitness: {{ monogramFitness(info.ciphertext).toFixed(2) }}
        <Info
          >A monogram fitness close to 1 is similar to standard English; close
          to 0 is not similar.</Info
        >
      </div>
      <div>
        Tetragram fitness: {{ tetragramFitness(info.ciphertext).toFixed(2) }}
        <Info
          >Less negative is a better fit to English; more negative is a worse
          fit.</Info
        >
      </div>
      <div>
        Index of coincidence: {{ normalizedIoC(info.ciphertext).toFixed(2) }}
        <Info>Typical English IoC: 1.75</Info>
      </div>
      <div>
        Entropy: {{ entropy(info.ciphertext).toFixed(2) }}
        <Info
          >A higher entropy value means it is more random and less
          predictable.</Info
        >
      </div>
    </div>
    <div>
      <button
        v-if="info.ciphermode === 'monoalphabetic' && !info.encoding"
        @click="hillClimb('monoalphabetic')"
      >
        <!-- prettier-ignore -->
        carry out stochastic hill climbing attack for monoalphabetic substitution cipher
      </button>
      <template
        v-else-if="info.ciphermode === 'polyalphabetic' && !info.encoding"
      >
        <button
          @click="hillClimb('polyalphabetic')" >
          <!-- prettier-ignore -->
          carry out stochastic hill climbing attack for periodic polyalphabetic substitution cipher (broken)
        </button>
        <br />
        <button @click="bruteForceVigenere">
          carry out letter frequency attack on vigenère cipher
        </button>
      </template>
    </div>
    <details open>
      <summary>letter frequencies</summary>
      <Table :columns="letterFreqsColumns" :data="letterFreqsData">
        <template
          v-for="i in info.polyalphabeticPeriod"
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
    <template v-if="['monoalphabetic', 'polyyalphabetic'].includes(info.ciphermode)">
      <label>
        hill climbing threshold:
        <input type="number" v-model="info.hillClimbThreshold" />
      </label>
      <br />
      <label>
        number of concurrent threads:
        <input type="number" min="1" v-model="info.hillClimbThreads" />
      </label>
      <br />
      <label>
        show top
        <input type="number" v-model="info.hillClimbResultsNum" min="1" />
        results
      </label>
      <br />
    </template>
    <template v-if="info.ciphermode === 'polyalphabetic'">
      <label>
        assume vigenère? <input type="checkbox" v-model="info.assumeVigenere" />
      </label>
      <br />
      <label v-if="info.assumeVigenere">
        initial guess <input type="text" v-model="info.vigenereInitialGuess" :minlength="info.polyalphabeticPeriod" :maxlength="info.polyalphabeticPeriod" />
      </label>
    </template>
  </Modal>
  <Modal ref="processingModal" :closeonblur="true" :close-buttons="[]"
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
          info.probablePeriod = calculateProbablePeriod(
            info.ciphertext,
            info.probablePeriodThreshold,
          );
        }
      }
    "
  >
    <label>
      probable period threshold:
      <input type="number" v-model="info.probablePeriodThreshold" />
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
