<template>
  <div class="page gallery-page">
    <button class="gallery-exit button-secondary glass" type="button" aria-label="Leave gallery" @click="leaveGallery">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 18-6-6 6-6"></path>
      </svg>
    </button>

    <section v-if="galleryQuery.data.value?.items.length" class="gallery-masonry">
      <button
        v-for="(item, index) in galleryQuery.data.value?.items"
        :key="item.id"
        class="gallery-item"
        type="button"
        :aria-label="item.memory?.title || 'Open photo'"
        @click="active = item"
      >
        <img
          :src="resolveApiAssetUrl(item.variants?.md || item.originalUrl)"
          :alt="item.memory?.title || 'Gallery item'"
          loading="lazy"
          :class="{
            'radius-1': Number(index) % 3 === 0,
            'radius-2': Number(index) % 3 === 1,
            'radius-3': Number(index) % 3 === 2
          }"
          :style="item.width && item.height ? { aspectRatio: `${item.width} / ${item.height}` } : undefined"
        />
      </button>
    </section>
    <div v-else class="gallery-empty-state">
      <div class="empty-state">{{ t('gallery.empty') }}</div>
    </div>

    <LightboxModal
      :open="Boolean(active)"
      :src="resolveApiAssetUrl(active?.variants?.lg || active?.originalUrl) || ''"
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
import { useRouter } from 'vue-router'
import LightboxModal from '@/components/LightboxModal.vue'
import { api, resolveApiAssetUrl } from '@/lib/api'

const { t } = useI18n()
const router = useRouter()
const active = ref<any | null>(null)

const galleryQuery = useQuery({
  queryKey: ['gallery'],
  queryFn: () => api<any>('/gallery')
})

function leaveGallery() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push({ name: 'timeline' })
}
</script>

<style scoped>
.gallery-page {
  position: relative;
  min-height: 100vh;
  gap: 0;
  padding: clamp(0.75rem, 1vw, 1rem);
}

.gallery-masonry {
  columns: 4 280px;
  column-gap: 0.95rem;
}

.gallery-item {
  width: 100%;
  border: 0;
  background: transparent;
  display: inline-block;
  margin: 0 0 0.95rem;
  padding: 0;
  border-radius: 0;
  text-align: unset;
  transition: transform 180ms ease;
  break-inside: avoid;
}

.gallery-item:hover {
  transform: translateY(-3px);
}

.gallery-item img {
  width: 100%;
  display: block;
  min-height: 16rem;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.2);
  box-shadow:
    0 22px 48px rgba(68, 42, 44, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.24);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
  filter: saturate(1.02);
}

.gallery-item:hover img {
  transform: scale(1.012);
  box-shadow:
    0 28px 58px rgba(68, 42, 44, 0.24),
    inset 0 0 0 1px rgba(255, 255, 255, 0.34);
  filter: saturate(1.06);
}

.radius-1 {
  border-radius: 22px 34px 22px 34px;
}

.radius-2 {
  border-radius: 34px 22px 34px 22px;
}

.radius-3 {
  border-radius: 26px 30px 20px 30px;
}

.gallery-exit {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 15;
  width: 3rem;
  min-width: 3rem;
  min-height: 3rem;
  padding: 0;
  border-radius: 999px;
}

.gallery-empty-state {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
}

@media (max-width: 900px) {
  .gallery-masonry {
    columns: 3 220px;
  }
}

@media (max-width: 768px) {
  .gallery-masonry {
    columns: 2 180px;
  }

  .gallery-item img {
    min-height: 12rem;
  }
}

@media (max-width: 520px) {
  .gallery-page {
    padding: 0.65rem;
  }

  .gallery-masonry {
    columns: 1 100%;
    column-gap: 0.65rem;
  }

  .gallery-exit {
    top: 0.75rem;
    left: 0.75rem;
  }
}
</style>
