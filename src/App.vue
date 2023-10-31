<script setup>
  import Workspace from './components/Workspace.vue';
  import { useStore } from './stores/store.js';
  import { ref } from 'vue';
  const store = useStore();
</script>

<template>
  <button
    v-for="id in store.tabs"
    @click="store.focusedWorkspace = id"
    :style="`color: ${id === store.focusedWorkspace ? 'blue' : 'auto'}`"
    :key="id"
  >
    {{ store.workspaces[id].name }}
    <span
      v-if="id === store.focusedWorkspace && store.tabs.length > 1"
      @click="store.deleteWorkspace(id)"
      >X</span
    >
  </button>
  <Workspace :tab-id="store.focusedWorkspace"></Workspace>
</template>
