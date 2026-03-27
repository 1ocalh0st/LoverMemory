<template>
  <div class="page gallery-page">
    <button class="gallery-exit button-secondary glass" type="button" aria-label="Leave gallery" @click="leaveGallery">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 18-6-6 6-6"></path>
      </svg>
    </button>

    <section v-if="galleryQuery.data.value?.items.length" class="gallery-masonry" ref="masonryRef">
      <button
        v-for="(item, index) in galleryQuery.data.value?.items"
        :key="item.id"
        class="gallery-item"
        :class="getItemClass(Number(index))"
        type="button"
        :aria-label="item.memory?.title || 'Open photo'"
        @click="active = item"
      >
        <img
          :src="resolveApiAssetUrl(item.variants?.md || item.originalUrl)"
          :alt="item.memory?.title || 'Gallery item'"
          loading="lazy"
          :style="item.width && item.height ? { aspectRatio: `${item.width} / ${item.height}` } : undefined"
        />
        <span v-if="item.memory?.title" class="gallery-item-caption">{{ item.memory.title }}</span>
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LightboxModal from '@/components/LightboxModal.vue'
import { api, resolveApiAssetUrl } from '@/lib/api'

const { t } = useI18n()
const router = useRouter()
const active = ref<any | null>(null)
const masonryRef = ref<HTMLElement | null>(null)

const galleryQuery = useQuery({
  queryKey: ['gallery'],
  queryFn: () => api<any>('/gallery')
})

/**
 * Deterministic organic class assignment for border-radius + stagger delay.
 */
function getItemClass(index: number) {
  const classes: string[] = []
  // 5 border-radius variants
  classes.push(`radius-v${index % 5}`)
  // Staggered reveal delay
  classes.push(`stagger-${index % 6}`)
  return classes
}

// Intersection Observer for scroll-reveal animation
let observer: IntersectionObserver | null = null

function setupObserver() {
  if (!masonryRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          ;(entry.target as HTMLElement).classList.add('gallery-item--visible')
          observer?.unobserve(entry.target)
        }
      })
    },
    {
      rootMargin: '80px 0px',
      threshold: 0.05
    }
  )

  const items = masonryRef.value.querySelectorAll('.gallery-item')
  items.forEach((el) => observer?.observe(el))
}

watch(
  () => galleryQuery.data.value,
  (val) => {
    if (val?.items?.length) {
      nextTick(() => setupObserver())
    }
  }
)

onMounted(() => {
  if (galleryQuery.data.value?.items?.length) {
    nextTick(() => setupObserver())
  }
})

onUnmounted(() => {
  observer?.disconnect()
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
  padding: clamp(0.4rem, 1vw, 0.8rem) clamp(0.6rem, 1.5vw, 1.2rem) clamp(0.6rem, 1.5vw, 1.2rem);
}

/* ─── CSS-columns Masonry (natural height, real waterfall) ─── */
.gallery-masonry {
  columns: 4 260px;
  column-gap: clamp(0.55rem, 1.2vw, 0.95rem);
}

/* ─── Base Item ─── */
.gallery-item {
  position: relative;
  width: 100%;
  border: 0;
  background: transparent;
  display: inline-block;
  margin: 0 0 clamp(0.55rem, 1.2vw, 0.95rem);
  padding: 0;
  border-radius: 0;
  text-align: unset;
  cursor: pointer;
  break-inside: avoid;
  overflow: hidden;
  /* start hidden for reveal animation */
  opacity: 0;
  transform: translateY(28px) scale(0.97);
  transition:
    opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

.gallery-item--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Staggered reveal delays */
.stagger-0.gallery-item--visible { transition-delay: 0ms; }
.stagger-1.gallery-item--visible { transition-delay: 60ms; }
.stagger-2.gallery-item--visible { transition-delay: 120ms; }
.stagger-3.gallery-item--visible { transition-delay: 180ms; }
.stagger-4.gallery-item--visible { transition-delay: 240ms; }
.stagger-5.gallery-item--visible { transition-delay: 300ms; }

/* ─── Image styling ─── */
.gallery-item img {
  width: 100%;
  display: block;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 6px 24px rgba(68, 42, 44, 0.10),
    0 1px 4px rgba(68, 42, 44, 0.05);
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.5s ease;
  filter: saturate(1.02) brightness(1.01);
  border-radius: inherit;
}

.gallery-item:hover img {
  transform: scale(1.035);
  box-shadow:
    0 16px 40px rgba(68, 42, 44, 0.18),
    0 3px 10px rgba(68, 42, 44, 0.07);
  filter: saturate(1.08) brightness(1.02);
}

/* ─── Hover caption overlay ─── */
.gallery-item-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 3rem 0.9rem 0.85rem;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.48) 0%, transparent 100%);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.4;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
  pointer-events: none;
  border-radius: inherit;
}

.gallery-item:hover .gallery-item-caption {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Organic border-radius variants ─── */
.radius-v0 { border-radius: 20px 30px 18px 32px; }
.radius-v1 { border-radius: 32px 18px 28px 20px; }
.radius-v2 { border-radius: 24px 26px 14px 34px; }
.radius-v3 { border-radius: 14px 34px 24px 22px; }
.radius-v4 { border-radius: 28px 16px 30px 16px; }

/* ─── Hover lift ─── */
.gallery-item:hover {
  transform: translateY(-3px) scale(1) !important;
  z-index: 2;
}

/* ─── Gallery exit button ─── */
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

/* ─── Responsive ─── */
@media (max-width: 1100px) {
  .gallery-masonry {
    columns: 3 220px;
  }
}

@media (max-width: 768px) {
  .gallery-masonry {
    columns: 2 180px;
    column-gap: 0.55rem;
  }

  .gallery-item {
    margin-bottom: 0.55rem;
  }
}

@media (max-width: 520px) {
  .gallery-page {
    padding: 0.45rem;
  }

  .gallery-masonry {
    columns: 2 140px;
    column-gap: 0.4rem;
  }

  .gallery-item {
    margin-bottom: 0.4rem;
  }

  /* Smaller border-radii on small screens */
  .radius-v0 { border-radius: 14px 20px 12px 22px; }
  .radius-v1 { border-radius: 22px 12px 18px 14px; }
  .radius-v2 { border-radius: 16px 18px 10px 24px; }
  .radius-v3 { border-radius: 10px 24px 16px 14px; }
  .radius-v4 { border-radius: 18px 10px 20px 10px; }

  .gallery-exit {
    top: calc(env(safe-area-inset-top, 0px) + 0.65rem);
    left: 0.65rem;
    width: 2.6rem;
    min-width: 2.6rem;
    min-height: 2.6rem;
  }

  /* Disable caption on touch */
  .gallery-item-caption {
    display: none;
  }
}
</style>
