<script setup>
import Layout from './components/Layout.vue'
</script>

<template>
  <Layout />
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, filter 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  filter: blur(8px);
}
</style>
