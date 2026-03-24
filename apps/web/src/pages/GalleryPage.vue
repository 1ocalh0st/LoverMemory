<template>
  <div class="page">
    <header class="page-header">
      <h1>{{ t('gallery.title') }}</h1>
      <p>Preloaded image variants keep the masonry surface quick on mobile and crisp on desktop.</p>
    </header>

    <section v-if="galleryQuery.data.value?.items.length" class="gallery-columns">
      <button
        v-for="item in galleryQuery.data.value?.items"
        :key="item.id"
        class="gallery-item glass"
        @click="active = item"
      >
        <img
          :src="item.variants?.md || item.originalUrl"
          :alt="item.memory?.title || 'Gallery item'"
          loading="lazy"
        />
        <div class="gallery-meta">
          <strong>{{ item.memory?.title }}</strong>
          <small>{{ item.memory ? new Date(item.memory.occurredAt).toLocaleDateString() : '' }}</small>
        </div>
      </button>
    </section>
    <div v-else class="empty-state">{{ t('gallery.empty') }}</div>

    <LightboxModal
      :open="Boolean(active)"
      :src="active?.variants?.lg || active?.originalUrl || ''"
      :alt="active?.memory?.title"
      :caption="active?.memory?.title"
      @close="active = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import LightboxModal from '@/components/LightboxModal.vue'
import { api } from '@/lib/api'

const { t } = useI18n()
const active = ref<any | null>(null)

const galleryQuery = useQuery({
  queryKey: ['gallery'],
  queryFn: () => api<any>('/gallery')
})
</script>

<style scoped>
.gallery-columns {
  columns: 3 280px;
  column-gap: 1rem;
}

.gallery-item {
  width: 100%;
  border: none;
  display: inline-grid;
  gap: 0.8rem;
  margin: 0 0 1rem;
  padding: 0.8rem;
  border-radius: 28px;
  text-align: left;
}

.gallery-item img {
  width: 100%;
  display: block;
  border-radius: 22px;
}

.gallery-meta {
  display: grid;
  gap: 0.2rem;
}

.gallery-meta small {
  color: var(--text-soft);
}
</style>
