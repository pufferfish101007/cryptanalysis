<script setup>
    import { normalizedIoC, monogramFitness, monogramFrequencies, tetragramFitness } from './lib/fitness.js';
    import { ref, watch } from 'vue';
    const cyphertext = ref('');
    const plaintext = ref('');
    watch(cyphertext, () => {
      cyphertext.value = cyphertext.value.toUpperCase();
      plaintext.value = cyphertext.value.toLowerCase();
    });
</script>

<template>
  <div class="container">
    <div class="container vertical">ciphertext:<textarea v-model="cyphertext"></textarea></div>
    <div class="container vertical">plaintext:<textarea v-model="plaintext" disabled></textarea></div>
    <div>
      <div>Monogram fitness: {{ monogramFitness(cyphertext) }}</div>
      <div>Tetragram fitness: {{ tetragramFitness(cyphertext) }}</div>
      <div>Index of coincidence: {{ normalizedIoC(cyphertext) }}</div>
    </div>
    <div class="container vertical">
      <table>
        <thead>
          <tr>
            <th>letter</th>
            <th>count</th>
            <th>relative frequency</th>
          </tr>
        </thead>
        <tr v-for="[letter, count] in Object.entries(monogramFrequencies(cyphertext))">
          <td>{{ letter }}</td>
          <td>{{ count }}</td>
          <td></td>
        </tr>
      </table>
    </div>
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
</style>