<script setup>
    import Modal from './Modal.vue';
    import { ref } from 'vue';
    const dialog = ref();
</script>

<template>
    <span @click="dialog.show()" id="info-btn">ⓘ</span>
    <Modal ref="dialog" closeonblur>
        <slot>info should be here but none was provided</slot>
    </Modal>
</template>

<style scoped>
    span#info-btn {
        cursor: pointer;
    }
</style>