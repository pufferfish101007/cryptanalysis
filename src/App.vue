<script setup>
  import Workspace from './components/Workspace.vue';
  import { useStore } from './stores/store.js';
  import { useTemplateRef, computed, nextTick } from 'vue';
  import VueSimpleContextMenu from 'vue-simple-context-menu';
  const store = useStore();
  console.log(store, store.workspaces)
  const contextMenu = useTemplateRef('wkspBtnCtxtMenu');
  const ctxtMenuOpts = computed(() =>
    (store.tabs.length > 1
      ? ['rename', 'duplicate', 'delete', 'new workspace']
      : ['rename', 'duplicate', 'new workspace']
    ).map((name) => ({
      name,
    })),
  );
  const handleClick1 = (event, id) => {
    contextMenu.value.showMenu(event, id);
  };
  const ctxtMenuOptClicked = (event) => {
    switch (event.option.name) {
      case 'duplicate': {
        store.duplicateWorkspace(event.item, { name: undefined });
        break;
      }
      case 'rename': {
        const newName = window.prompt('New name:');
        if (newName !== null) {
          store.renameWorkspace(event.item, newName);
        }
        break;
      }
      case 'delete': {
        const deletingSelf = store.focusedWorkspace === event.item;
        store.deleteWorkspace(event.item);
        if (deletingSelf) {
          store.focusWorkspace(store.tabs.at(-1));
        }
        break;
      }
      case 'new workspace': {
        store.addWorkspace();
        store.focusWorkspace(store.tabs.at(-1));
        break;
      }
    }
  };
</script>

<template>
  <button
    v-for="id in store.tabs"
    @click="store.focusedWorkspace = id"
    @contextmenu.prevent.stop="handleClick1($event, id)"
    :style="`color: ${id === store.focusedWorkspace ? 'blue' : 'auto'}`"
    :key="id"
  >
    {{ store.workspaces[id].name }}
  </button>
  <VueSimpleContextMenu
    element-id="wkspBtnCtxtMenu"
    :options="ctxtMenuOpts"
    ref="wkspBtnCtxtMenu"
    @option-clicked="ctxtMenuOptClicked"
  >
  </VueSimpleContextMenu>
  <Workspace :tab-id="store.focusedWorkspace"></Workspace>
</template>
