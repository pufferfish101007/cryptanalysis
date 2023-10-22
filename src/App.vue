<script setup>
    import { normalizedIoC, monogramFitness, monogramFrequencies, tetragramFitness, entropy } from './lib/fitness.js';
    import Table from './components/Table.vue';
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
      <div>Monogram fitness: {{ monogramFitness(cyphertext).toFixed(2) }}</div>
      <div>Tetragram fitness: {{ tetragramFitness(cyphertext).toFixed(2) }}</div>
      <div>Index of coincidence: {{ normalizedIoC(cyphertext).toFixed(2) }}</div>
      <div>Entropy: {{ entropy(cyphertext).toFixed(2) }}</div>
    </div>
    <Table :headings="['letter', 'count', 'relative frequency']" :data="Object.entries(monogramFrequencies(cyphertext)).map(a => [...a, ((a[1] / cyphertext.length) || 0).toFixed(3)])"></Table>
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