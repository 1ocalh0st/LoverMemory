<template>
  <Teleport to="body">
    <div v-if="open" class="lightbox" @click.self="$emit('close')">
      <button class="lightbox-close button-secondary" @click="$emit('close')">Close</button>
      <div class="lightbox-stage glass">
        <img :src="src" :alt="alt" />
        <div v-if="caption" class="lightbox-caption">{{ caption }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  src: string
  alt?: string
  caption?: string
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(8, 10, 14, 0.82);
  backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  z-index: 50;
  padding: 1.5rem;
}

.lightbox-stage {
  max-width: min(960px, 100%);
  max-height: calc(100vh - 4rem);
  border-radius: 28px;
  padding: 1rem;
}

.lightbox-stage img {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 10rem);
  border-radius: 20px;
}

.lightbox-caption {
  margin-top: 0.9rem;
  color: var(--text-soft);
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
}
</style>
