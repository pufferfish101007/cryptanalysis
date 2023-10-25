<script setup>
  import { ref, watch, computed } from 'vue';
  const props = defineProps({
    columns: {
      type: Array,
      required: true,
    },
    data: {
      type: Array,
      required: true,
    },
    sortBy: {
      type: Number,
      default: 0,
    },
  });
  console.log(props.columns);
  let sortBy = ref(props.sortBy);
  let sortAscending = ref(true);
  let sortedData = computed(() => {
    // @ts-ignore
    return props.data.toSorted((a, b) =>
      a[sortBy.value] < b[sortBy.value]
        ? -(+sortAscending.value * 2 - 1)
        : b[sortBy.value] < a[sortBy.value]
        ? +sortAscending.value * 2 - 1
        : 0,
    );
  });
  function setSortBy(index) {
    if (sortBy.value === index) {
      sortAscending.value = !sortAscending.value;
    } else {
      sortBy.value = index;
      sortAscending.value = true;
    }
  }
</script>

<template>
  <table>
    <thead>
      <th v-for="(column, index) in props.columns" @click="setSortBy(index)">
        {{ column.name ?? column.key }}
        <span class="sortarrow">{{
          sortBy === index ? (sortAscending ? '↓' : '↑') : '&nbsp;'
        }}</span>
      </th>
    </thead>
    <tr v-for="data in sortedData">
      <td v-for="(el, index) in data">
        <slot
          :name="props.columns[index].key"
          :data="el"
          :primary-key="data[0]"
          >{{ el }}</slot
        >
      </td>
    </tr>
  </table>
</template>

<style scoped>
  table,
  th,
  td {
    border: 1px solid black;
    border-collapse: collapse;
  }
  th {
    cursor: pointer;
  }
  th > span.sortarrow {
    font-family: monospace;
  }
</style>
