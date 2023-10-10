<script setup>
  import { ref, watch } from 'vue';
  const props = defineProps({
    headings: Array,
    data: Array,
  });
  let sortBy = ref(null);
  let sortedData = computed(() => {
    return data;
  });
</script>

<template>
  <table>
    <thead>
      <th v-for='heading in props.headings'>{{ heading }}</th>
    </thead>
    <tr v-for="data in sortedData">
      <td v-for="el in data">{{ el }}</td>
    </tr>
  </table>
</template>

<style scoped>
  table, th, td {
    border: 1px solid black;
    border-collapse: collapse;
  }
</style>