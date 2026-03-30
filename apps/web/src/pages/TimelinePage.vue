<template>
  <div class="page timeline-page">
    <section class="section-card timeline-hero">
      <div class="timeline-hero-copy">
        <span class="eyebrow">旧时光</span>
        <h1 class="display-lg">{{ t('timeline.title') }}</h1>
        <p class="body-lg">
          你可以通过日期、心情或地点来搜索回忆，并将接下来的点划记录在一张温暖的卡片中。
        </p>
      </div>
      <button class="button-primary timeline-hero-action" @click="showComposer">
        <span class="timeline-hero-plus">+</span>
        <span>{{ t('actions.addMemory') }}</span>
      </button>
    </section>

    <section class="section-card timeline-controls">
      <div class="timeline-mobile-action">
        <button class="button-primary timeline-mobile-action-button" type="button" @click="showComposer">
          <span class="timeline-mobile-action-plus">+</span>
          <span>{{ t('actions.addMemory') }}</span>
        </button>
      </div>

      <label class="field-block">
        <span class="field-label">{{ t('timeline.search') }}</span>
        <input v-model="search" class="field" :placeholder="t('timeline.search')" />
      </label>

      <div class="field-block">
        <span class="field-label">心情筛选</span>
        <div class="pill-row is-scrollable mood-row">
          <button
            v-for="option in moodOptions"
            :key="option.value || 'all'"
            class="pill-button"
            :class="{ active: mood === option.value }"
            @click="mood = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </section>

    <RecentMemoryNotice
      v-if="recentMemoryAnnouncement"
      :memory="recentMemoryAnnouncement"
      :title="t('common.justAdded')"
      :subtitle="t('timeline.recentlyAddedNote')"
      :fallback-copy="t('timeline.recentlyAddedFallback')"
    >
      <template #actions>
        <button class="button-ghost" type="button" @click="dismissRecentMemoryAnnouncement">
          {{ t('common.dismiss') }}
        </button>
      </template>
    </RecentMemoryNotice>

    <section v-if="memoriesQuery.data.value?.items.length" class="timeline-river">
      <div class="timeline-axis"></div>
      <article
        v-for="(memory, idx) in memoriesQuery.data.value?.items"
        :key="memory.id"
        class="timeline-node"
        :class="[
          getNodeLayout(Number(idx)),
          { 'timeline-node--continued': !shouldShowDate(memory, Number(idx)) },
          { 'memory-card--recent': recentMemoryAnnouncement?.id === memory.id }
        ]"
      >
        <div v-if="shouldShowDate(memory, Number(idx))" class="timeline-date-bubble glass">
          {{ formatDate(memory.occurredAt) }}
        </div>
        <div class="timeline-node-marker"></div>
        <div
          class="memory-card glass"
          :class="{ 'cursor-pointer': memoryAssetCount(memory) > 0 }"
          @click="openMemoryGallery(memory)"
        >
          <div
            v-if="memoryAssetCount(memory) > 0"
            class="memory-cover"
            :class="{ 'has-stack': memoryAssetCount(memory) > 1, 'is-interactive': memoryAssetCount(memory) > 0 }"
            role="button"
            :tabindex="0"
            :aria-label="`查看 ${memory.title} 的照片`"
            @click="openMemoryGallery(memory)"
            @keydown.enter.prevent="openMemoryGallery(memory)"
            @keydown.space.prevent="openMemoryGallery(memory)"
          >
            <div class="memory-cover-stack" :class="`layers-${Math.min(memoryAssetCount(memory), 3)}`">
              <div
                v-for="(asset, aIdx) in memoryBackdropAssets(memory)"
                :key="`${memory.id}-backdrop-${asset.id}`"
                class="memory-cover-layer memory-cover-layer-back"
                :class="`backdrop-${Number(aIdx) + 1}`"
              >
                <img
                  :src="resolveApiAssetUrl(asset.variants?.md || asset.originalUrl) || '/pictures/coffee.jpg'"
                  :alt="memory.title"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div class="memory-cover-layer memory-cover-layer-front">
                <img
                  :src="resolveApiAssetUrl(memoryPrimaryAsset(memory)?.variants?.md || memoryPrimaryAsset(memory)?.originalUrl) || '/pictures/coffee.jpg'"
                  :alt="memory.title"
                  loading="lazy"
                  decoding="async"
                />

                <div v-if="memoryAssetCount(memory) > 1" class="memory-cover-indicator">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M8.5 7.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>{{ memoryAssetCount(memory) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="memory-card-body">
            <div class="memory-meta">
              <div class="memory-meta-tags">
                <span v-if="recentMemoryAnnouncement?.id === memory.id" class="memory-new-badge">{{ t('common.justAdded') }}</span>
                <span class="memory-time">{{ formatTime(memory.occurredAt) }}</span>
                <span v-if="memory.mood" class="memory-mood">{{ moodLabel(memory.mood) }}</span>
              </div>
            </div>
            <h2 class="headline-md">{{ memory.title }}</h2>
            <p class="body-lg">{{ memory.story || '留下一段文字、一张照片，或者是那天感觉起来不同寻常的地点吧。' }}</p>
            <div v-if="memory.locationName" class="memory-location">{{ memory.locationName }}</div>
          </div>
        </div>
      </article>
    </section>
    <div v-else class="empty-state">{{ t('timeline.empty') }}</div>

    <LightboxModal
      :open="Boolean(activeMemoryGallery)"
      :items="activeMemoryGalleryItems"
      :start-index="0"
      @close="closeMemoryGallery"
    />

    <MemoryComposer
      v-model="openComposer"
      @saved="onMemorySaved"
    />
  </div>
</template>


<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import LightboxModal from '@/components/LightboxModal.vue'
import RecentMemoryNotice from '@/components/RecentMemoryNotice.vue'
import MemoryComposer from '@/components/MemoryComposer.vue'
import { api, resolveApiAssetUrl } from '@/lib/api'
import { formatDateInAppTimeZone, getDatePartsInAppTimeZone } from '@/lib/datetime'
import {
  clearRecentMemoryAnnouncement,
  readRecentMemoryAnnouncement
} from '@/lib/recentMemoryAnnouncement'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const search = ref('')
const mood = ref('')
const openComposer = ref(route.query.compose === '1')
const activeMemoryGallery = ref<any | null>(null)
const recentMemoryAnnouncement = ref(readRecentMemoryAnnouncement())

watch(
  () => route.query.compose,
  (value) => {
    openComposer.value = value === '1'
  }
)

const moodOptions = [
  { value: '', label: '所有心情' },
  { value: 'romantic', label: '浪漫' },
  { value: 'happy', label: '开心' },
  { value: 'peaceful', label: '平静' },
  { value: 'excited', label: '激动' },
  { value: 'nostalgic', label: '怀旧' },
  { value: 'grateful', label: '感激' },
  { value: 'tender', label: '温柔' }
]

const queryParams = computed(() => ({
  q: search.value,
  mood: mood.value
}))

const memoriesQuery = useQuery({
  queryKey: ['memories', queryParams],
  queryFn: () => {
    const params = new URLSearchParams()
    if (queryParams.value.q) params.set('q', queryParams.value.q)
    if (queryParams.value.mood) params.set('mood', queryParams.value.mood)
    return api<any>(`/memories?${params.toString()}`)
  }
})

function moodLabel(value: string) {
  return moodOptions.find((item) => item.value === value)?.label ?? value
}

function orderedMemoryAssets(memory: any) {
  const assets = Array.isArray(memory?.assets) ? memory.assets : []
  if (memory?.coverAsset) {
    return [memory.coverAsset, ...assets.filter((asset: any) => asset.id !== memory.coverAsset.id)]
  }
  return assets
}

function memoryPrimaryAsset(memory: any) {
  return orderedMemoryAssets(memory)[0] ?? null
}

function memoryBackdropAssets(memory: any) {
  return orderedMemoryAssets(memory).slice(1, 3).reverse()
}

function memoryAssetCount(memory: any) {
  return orderedMemoryAssets(memory).length
}

const activeMemoryGalleryItems = computed(() =>
  activeMemoryGallery.value
    ? orderedMemoryAssets(activeMemoryGallery.value).map((asset: any, index: number) => ({
        src: resolveApiAssetUrl(asset.variants?.lg || asset.variants?.md || asset.originalUrl) || '/pictures/coffee.jpg',
        alt: activeMemoryGallery.value.title || `Memory photo ${index + 1}`,
        caption:
          memoryAssetCount(activeMemoryGallery.value) > 1
            ? `${activeMemoryGallery.value.title} · ${index + 1} / ${memoryAssetCount(activeMemoryGallery.value)}`
            : activeMemoryGallery.value.title
      }))
    : []
)

function openMemoryGallery(memory: any) {
  if (!memoryAssetCount(memory)) {
    return
  }
  activeMemoryGallery.value = memory
}

function closeMemoryGallery() {
  activeMemoryGallery.value = null
}

function dismissRecentMemoryAnnouncement() {
  clearRecentMemoryAnnouncement()
  recentMemoryAnnouncement.value = null
}

function showComposer() {
  openComposer.value = true
  router.replace({ name: 'timeline', query: { compose: '1' } })
}

// 子组件关闭时同步路由
watch(openComposer, (val) => {
  if (!val && route.query.compose) {
    router.replace({ name: 'timeline' })
  }
})

function onMemorySaved(announcement: any) {
  recentMemoryAnnouncement.value = announcement
}

function formatDate(value: string) {
  return formatDateInAppTimeZone(value)
}

function formatTime(value: string) {
  return formatDateInAppTimeZone(value, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function dateGroupKey(value: string) {
  const parts = getDatePartsInAppTimeZone(value)
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : value
}

function shouldShowDate(memory: any, index: number) {
  if (index === 0) {
    return true
  }

  const previous = memoriesQuery.data.value?.items?.[index - 1]
  if (!previous) {
    return true
  }

  return dateGroupKey(memory.occurredAt) !== dateGroupKey(previous.occurredAt)
}

function getNodeLayout(index: number) {
  const cycle = index % 6
  switch (cycle) {
    case 0: return 'node-left'
    case 1: return 'node-right'
    case 2: return 'node-left node-wide'
    case 3: return 'node-right'
    case 4: return 'node-left'
    case 5: return 'node-right node-wide'
    default: return 'node-left'
  }
}
</script>

<style scoped>
.timeline-page {
  gap: 1.4rem;
}

.timeline-hero {
  display: grid;
  gap: 1rem;
  background:
    radial-gradient(circle at top right, rgba(255, 225, 212, 0.52), transparent 30%),
    linear-gradient(180deg, rgba(255, 252, 248, 0.94), rgba(250, 239, 230, 0.9));
}

.timeline-hero-copy {
  display: grid;
  gap: 0.95rem;
}

.timeline-hero h1,
.memory-card h2 {
  margin: 0;
}

.timeline-hero p,
.memory-card p {
  margin: 0;
}

.timeline-hero-action {
  justify-self: start;
}

.timeline-hero-plus {
  display: inline-grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 1.2rem;
  line-height: 1;
}

.timeline-controls {
  display: grid;
  gap: 1.1rem;
}

.timeline-mobile-action {
  display: none;
}

.timeline-mobile-action-button {
  width: 100%;
  justify-content: center;
}

.timeline-mobile-action-plus {
  display: inline-grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 1.15rem;
  line-height: 1;
}

.mood-row {
  padding-inline: 0.05rem;
}

.mood-custom-field {
  margin-top: 0.9rem;
}

/* ── Timeline River ─────────────────────────────── */
.timeline-river {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-block: 1.7rem 1.1rem;
}

/* 添加到 .timeline-river 的伪元素实现时间轴线 */
.timeline-river::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: linear-gradient(180deg, transparent 0%, var(--outline-strong) 6%, var(--outline-strong) 94%, transparent 100%);
  transform: translateX(-50%);
  pointer-events: none;
}
@media (max-width: 980px) {
  .timeline-axis {
    width: 1.5px;
    opacity: 0.6;
  }
}

.timeline-node {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: 1.5rem;
  padding-block: 1.1rem 1.3rem;
}

.timeline-date-bubble {
  grid-column: 2;
  grid-row: 1;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  background: var(--surface);
  backdrop-filter: blur(16px) saturate(1.5);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  border: 1px solid var(--outline);
  box-shadow: 0 8px 20px rgba(170, 130, 119, 0.1);
  font-size: 0.82rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
  transform: translateZ(0); 
}

.timeline-node-marker {
  grid-column: 2;
  grid-row: 1;
  z-index: 2;
  width: 0.95rem;
  height: 0.95rem;
  border-radius: 999px;
  justify-self: center;
  align-self: start;
  margin-top: 0.85rem;
  background: linear-gradient(135deg, #c68486 0%, #efb7ab 100%);
  box-shadow:
    0 10px 22px rgba(181, 127, 120, 0.18),
    0 0 0 4px rgba(255, 249, 244, 0.92);
}

.timeline-node .memory-card {
  grid-row: 1;
}

.node-left .memory-card {
  grid-column: 1;
  justify-self: end;
}

.node-right .memory-card {
  grid-column: 3;
  justify-self: start;
}

.memory-card {
  max-width: 440px;
  width: 100%;
  display: grid;
  gap: 1.25rem;
  padding: 1.25rem;
}

/* Wider cards in dynamic layout */
.node-wide .memory-card {
  max-width: 500px;
}

.memory-card--recent {
  box-shadow:
    0 24px 52px rgba(173, 128, 119, 0.2),
    inset 0 0 0 1px rgba(207, 140, 128, 0.34);
}

/* ── Stacked Photo Display ── */
.memory-cover {
  position: relative;
  overflow: visible;
  padding: 0.3rem 1.3rem 1.3rem 0.3rem;
}

.memory-cover.is-interactive {
  cursor: pointer;
}

.memory-cover.is-interactive:focus-visible {
  outline: none;
}

.memory-cover.is-interactive:focus-visible .memory-cover-layer-front,
.memory-cover.is-interactive:hover .memory-cover-layer-front {
  box-shadow:
    0 24px 56px rgba(116, 79, 75, 0.2),
    0 8px 18px rgba(116, 79, 75, 0.08),
    0 0 0 3px rgba(255, 255, 255, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.memory-cover-stack {
  position: relative;
  aspect-ratio: 16 / 11;
}

.memory-cover-layer {
  position: absolute;
  inset: 0 auto auto 0;
  width: calc(100% - 1.3rem);
  height: calc(100% - 1.3rem);
  overflow: hidden;
  border-radius: 20px;
  background: linear-gradient(180deg, #fffff9, #fbf7f4);
  box-shadow:
    0 16px 40px rgba(116, 79, 75, 0.12),
    0 4px 12px rgba(116, 79, 75, 0.06),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  transition:
    transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 280ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 280ms ease;
}

.memory-cover-layer-back {
  pointer-events: none;
  filter: saturate(0.95) brightness(0.98);
}

.memory-cover-layer-front {
  z-index: 3;
}

.memory-cover.is-interactive:hover .memory-cover-layer-front {
  transform: translate(-0.1rem, -0.1rem) scale(1.01);
}

.backdrop-1 {
  z-index: 1;
  transform: translate(1.4rem, 1.2rem) rotate(3deg);
}

.backdrop-2 {
  z-index: 2;
  transform: translate(0.7rem, 0.6rem) rotate(1.5deg);
}

.memory-cover.is-interactive:hover .backdrop-1 {
  transform: translate(1.6rem, 1.4rem) rotate(4deg);
}

.memory-cover.is-interactive:hover .backdrop-2 {
  transform: translate(0.8rem, 0.7rem) rotate(2deg);
}

.layers-2 .backdrop-1,
.layers-3 .backdrop-2 {
  box-shadow:
    0 14px 30px rgba(116, 79, 75, 0.1),
    0 2px 8px rgba(116, 79, 75, 0.04),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.memory-cover-layer img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.memory-cover-indicator {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  min-width: 2.2rem;
  min-height: 1.8rem;
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(255, 249, 246, 0.98);
  background: rgba(42, 32, 32, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    0 8px 24px rgba(39, 28, 29, 0.16),
    inset 0 0 0 1px rgba(255, 255, 255, 0.18);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  z-index: 4;
}

.memory-cover-indicator svg {
  flex: 0 0 auto;
}

.memory-card-body {
  display: grid;
  gap: 0.85rem;
  padding: 0 0.5rem 0.5rem;
}

.memory-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.memory-meta-tags {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}

.memory-date {
  color: var(--accent-strong);
  font-weight: 800;
  letter-spacing: 0.02em;
}

.memory-time,
.memory-mood {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--text-soft);
  background: rgba(255, 255, 255, 0.65);
  box-shadow: none;
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.memory-time {
  color: #ab6a61;
  background: rgba(255, 244, 238, 0.82);
  box-shadow: none;
  letter-spacing: 0.06em;
}

.memory-new-badge {
  display: inline-flex;
  align-items: center;
  color: #fff8f4;
  background: linear-gradient(135deg, #b07074 0%, #d69896 100%);
  box-shadow: 0 4px 12px rgba(176, 112, 116, 0.25);
  border-radius: 8px;
  padding: 0.4rem 0.65rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.memory-mood {
  letter-spacing: 0.01em;
}

.memory-location {
  justify-self: end;
  width: fit-content;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
  margin-top: 0.4rem;
  color: var(--text-soft);
  font-family: "Optima", "Georgia", serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.7;
}



@media (max-width: 980px) {
  .timeline-page {
    gap: 1rem;
  }

  .timeline-controls {
    gap: 0.95rem;
  }

  .timeline-river {
    padding: 0.35rem 0 0.55rem;
  }

  .timeline-axis {
    left: 0.85rem;
    width: 2px;
  }

  .timeline-node {
    grid-template-columns: 1fr;
    gap: 0.72rem;
    padding-block: 0 0.95rem;
  }

  .timeline-date-bubble {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
    margin-left: 2rem;
    padding: 0.46rem 0.82rem;
    font-size: 0.74rem;
  }

  .timeline-node-marker {
    grid-column: 1;
    justify-self: start;
    margin-left: 0.4rem;
    margin-top: 0.62rem;
    width: 0.85rem;
    height: 0.85rem;
  }

  .node-left .memory-card,
  .node-right .memory-card {
    grid-column: 1;
    grid-row: auto;
    justify-self: end;
    max-width: none;
    width: calc(100% - 2.2rem);
    margin-left: 2.2rem;
  }

  .memory-card {
    gap: 1.1rem;
    padding: 1.1rem;
  }

  .memory-card-body {
    gap: 0.75rem;
    padding: 0 0.2rem 0.3rem;
  }

  .memory-meta-tags {
    justify-content: flex-start;
    gap: 0.45rem;
  }
}

@media (max-width: 640px) {
  .timeline-page {
    gap: 0.85rem;
  }

  .timeline-controls {
    padding: 1rem;
    border-radius: 24px;
  }

  .timeline-axis {
    left: 0.75rem;
  }

  .timeline-node-marker {
    margin-left: 0.35rem;
    width: 0.8rem;
    height: 0.8rem;
  }

  .timeline-date-bubble {
    margin-left: 1.8rem;
  }

  .node-left .memory-card,
  .node-right .memory-card {
    width: calc(100% - 2rem);
    margin-left: 2rem;
  }

  .memory-card {
    border-radius: 22px;
  }

  .memory-cover {
    padding: 0.15rem 1.1rem 1.1rem 0.15rem;
  }

  .memory-cover-layer {
    width: calc(100% - 1.1rem);
    height: calc(100% - 1.1rem);
    border-radius: 18px;
  }

  .backdrop-1 {
    transform: translate(1.1rem, 0.95rem) rotate(2deg);
  }

  .backdrop-2 {
    transform: translate(0.55rem, 0.45rem) rotate(1deg);
  }

  .memory-cover.is-interactive:hover .backdrop-1 {
    transform: translate(1.4rem, 1.2rem) rotate(3deg);
  }

  .memory-cover.is-interactive:hover .backdrop-2 {
    transform: translate(0.7rem, 0.6rem) rotate(1.5deg);
  }
}

@media (max-width: 720px) {
  .timeline-hero {
    display: none;
  }

  .timeline-mobile-action {
    display: block;
  }
}
</style>
