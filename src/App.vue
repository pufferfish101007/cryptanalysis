<script setup>
    import { normalizedIoC, monogramFitness, monogramFrequencies, tetragramFitness, entropy } from './lib/fitness.js';
    import Table from './components/Table.vue';
    import Info from './components/Info.vue';
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
      <div>Monogram fitness: {{ monogramFitness(cyphertext).toFixed(2) }} <Info>A monogram fitness close to 1 is simlar to standard English; close to 0 is not similar.</Info></div>
      <div>Tetragram fitness: {{ tetragramFitness(cyphertext).toFixed(2) }} <Info>Less negative is a better fit to
English; more negative is a worse fit.
</Info></div>
      <div>Index of coincidence: {{ normalizedIoC(cyphertext).toFixed(2) }} <Info>Typical English IoC: 1.75</Info></div>
      <div>Entropy: {{ entropy(cyphertext).toFixed(2) }} <Info>A higher entropy value means it is more predictable and less random.</Info></div>
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