<script setup>
  import { ref } from 'vue';
  const props = defineProps({
    closeonblur: {
      type: Boolean,
      default: false,
    },
    closeButtons: {
      type: Array,
      default: ['close'],
    },
  });
  const emit = defineEmits(['close']);
  const dialog = ref();
  const show = () => {
    console.log('showing modal');
    dialog.value.showModal();
  };
  const close = (val) => {
    dialog.value.close();
    emit('close', val);
  };
  defineExpose({
    show,
    close,
  });
  const handleClick = (e) => {
    if (!props.closeonblur) return;
    let rect = e.target.getBoundingClientRect();
    if (e.clientY < rect.top || e.clientY > rect.bottom) return close();
    if (e.clientX < rect.left || e.clientX > rect.right) return close();
  };
  const escKeyHandle = (e) => {
    if (!props.closeonblur) e.preventDefault(); // accessibility do be neglected
  };
</script>

<template>
  <dialog ref="dialog" @click="handleClick" @keydown.esc="escKeyHandle">
    <slot></slot>
    <br v-if="props.closeButtons.length > 0" />
    <button @click="close(closeText)" v-for="closeText in closeButtons">
      {{ closeText }}
    </button>
  </dialog>
</template>

<style scoped>
  button {
    margin: 1em 1em 0 1em;
  }
  ::backdrop {
    background-color: black;
    opacity: 0.5;
    transition: 1s;
  }
</style>
