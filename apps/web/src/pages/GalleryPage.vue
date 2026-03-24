<template>
  <div class="page gallery-page">
    <header class="page-header editorial-header">
      <h1 class="display-lg">{{ t('gallery.title') }}</h1>
      <p class="body-lg">Preloaded image variants keep the masonry surface quick on mobile and crisp on desktop.</p>
    </header>

    <section v-if="galleryQuery.data.value?.items.length" class="gallery-masonry">
      <button
        v-for="(item, index) in galleryQuery.data.value?.items"
        :key="item.id"
        class="gallery-item glass"
        @click="active = item"
      >
        <img
          :src="item.variants?.md || item.originalUrl"
          :alt="item.memory?.title || 'Gallery item'"
          loading="lazy"
          :class="{
            'radius-1': Number(index) % 3 === 0,
            'radius-2': Number(index) % 3 === 1,
            'radius-3': Number(index) % 3 === 2
          }"
        />
        <div class="gallery-meta">
          <strong class="headline-md">{{ item.memory?.title }}</strong>
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
.gallery-page {
  gap: 3rem;
}

.editorial-header {
  max-width: 800px;
}

.editorial-header h1 {
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.gallery-masonry {
  columns: 3 320px;
  column-gap: 2.5rem;
}

.gallery-item {
  width: 100%;
  border: none;
  background: var(--surface-container-lowest);
  box-shadow: var(--shadow-ambient);
  display: inline-grid;
  gap: 1.2rem;
  margin: 0 0 2.5rem;
  padding: 1.2rem;
  border-radius: var(--radius-xl);
  text-align: left;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  break-inside: avoid;
}

.gallery-item:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-float);
}

.gallery-item img {
  width: 100%;
  display: block;
  object-fit: cover;
}

/* Asymmetric Image Radii */
.radius-1 { border-radius: var(--radius-sm) var(--radius-xl) var(--radius-md) var(--radius-xl); }
.radius-2 { border-radius: var(--radius-xl) var(--radius-sm) var(--radius-xl) var(--radius-md); }
.radius-3 { border-radius: var(--radius-lg) var(--radius-xl) var(--radius-sm) var(--radius-xl); }

.gallery-meta {
  display: grid;
  gap: 0.4rem;
  padding: 0 0.5rem 0.5rem;
}

.gallery-meta strong {
  font-size: 1.3rem; /* headline-md like */
  color: var(--primary);
  line-height: 1.2;
}

.gallery-meta small {
  color: var(--text-soft);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .gallery-masonry {
    columns: 2 200px;
    column-gap: 1.5rem;
  }
  .gallery-item {
    margin-bottom: 1.5rem;
    padding: 0.8rem;
    gap: 0.8rem;
  }
}

@media (max-width: 480px) {
  .gallery-masonry {
    columns: 1 100%;
  }
}
</style>
