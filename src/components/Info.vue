<script setup>
    import { ref } from 'vue';
    const dialog = ref();
</script>

<template>
    <span @click="dialog.showModal()">ⓘ</span>
    <dialog ref="dialog">
        <slot default>info should be here but none was provided</slot>
        <br>
        <button autofocus @click="dialog.close()">close</button>
    </dialog>
</template>

<style scoped>
    span {
        cursor: pointer;
    }
    button {
        margin-top: 1em;
    }
    ::backdrop {
        background-color: black;
        opacity: 0.5;
        transition: 1s;
    }
</style>