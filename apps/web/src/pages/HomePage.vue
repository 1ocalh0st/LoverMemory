<template>
  <div class="page home-page">
    <section class="section-card home-hero">
      <div class="home-hero-copy">
        <span class="eyebrow"></span>
        <h1 class="display-lg">{{ t('home.welcome') }}</h1>
        <p class="body-lg">从现在起，时间线、纪念日、照片与未来的计划都安放于这一个温柔明亮的看板里。</p>

        <div class="home-stats">
          <article class="home-stat-card">
            <span>{{ t('home.stats.memories') }}</span>
            <strong>{{ homeQuery.data.value?.stats.memoryCount ?? 0 }}</strong>
          </article>
          <article class="home-stat-card">
            <span>{{ t('home.stats.anniversaries') }}</span>
            <strong>{{ homeQuery.data.value?.stats.anniversaryCount ?? 0 }}</strong>
          </article>
          <article class="home-stat-card">
            <span>{{ t('home.stats.wishlist') }}</span>
            <strong>{{ homeQuery.data.value?.stats.wishlistCompleted ?? 0 }}</strong>
          </article>
        </div>
      </div>

      <article class="home-feature glass">
        <div class="home-feature-image">
          <img class="hero-image" :src="featuredImage" alt="Featured memory" />
        </div>
        <div class="home-feature-copy">
          <span class="field-label">{{ t('common.featuredMemory') }}</span>
          <h2 class="headline-md">{{ homeQuery.data.value?.featuredMemory?.title || t('home.empty') }}</h2>
          <p class="body-lg">
            {{
              homeQuery.data.value?.featuredMemory?.story ||
              '从一张照片、一句话，或者一个让平凡某天突然值得铭记的地方开始。'
            }}
          </p>
        </div>
      </article>
    </section>

    <RecentMemoryNotice
      v-if="recentMemoryAnnouncement"
      :memory="recentMemoryAnnouncement"
      :title="t('common.justAdded')"
      :subtitle="t('home.recentlyAddedNote')"
      :fallback-copy="t('home.recentlyAddedFallback')"
    >
      <template #actions>
        <button class="button-secondary" type="button" @click="goToTimeline">{{ t('common.viewTimeline') }}</button>
        <button class="button-ghost" type="button" @click="dismissRecentMemoryAnnouncement">
          {{ t('common.dismiss') }}
        </button>
      </template>
    </RecentMemoryNotice>

    <section class="home-panels">
      <article class="section-card home-panel">
        <span class="field-label">{{ t('common.nextAnniversary') }}</span>
        <template v-if="homeQuery.data.value?.nextAnniversary">
          <h2 class="headline-md">{{ homeQuery.data.value?.nextAnniversary.title }}</h2>
          <p class="body-lg">{{ t('common.daysLeft', { count: homeQuery.data.value?.nextAnniversary.daysLeft }) }}</p>
        </template>
        <div v-else class="empty-state">{{ t('anniversaries.empty') }}</div>
      </article>

      <article class="section-card home-panel">
        <span class="field-label">{{ t('common.recentMemories') }}</span>
        <div v-if="homeQuery.data.value?.recentMemories?.length" class="recent-list">
          <div
            v-for="memory in homeQuery.data.value?.recentMemories"
            :key="memory.id"
            class="recent-item"
            :class="{
              'recent-item--new': recentMemoryAnnouncement?.id === memory.id,
              'recent-item--text-only': !getRecentMemoryCoverSrc(memory)
            }"
          >
            <img v-if="getRecentMemoryCoverSrc(memory)" :src="getRecentMemoryCoverSrc(memory)" :alt="memory.title" />
            <div class="recent-item-copy">
              <div class="recent-item-title">
                <strong>{{ memory.title }}</strong>
                <span v-if="recentMemoryAnnouncement?.id === memory.id" class="recent-item-badge">{{ t('common.justAdded') }}</span>
              </div>
              <small>{{ formatMemoryDate(memory.occurredAt) }}</small>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">{{ t('home.empty') }}</div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import RecentMemoryNotice from '@/components/RecentMemoryNotice.vue'
import { api, resolveApiAssetUrl } from '@/lib/api'
import { formatDateInAppTimeZone } from '@/lib/datetime'
import { clearRecentMemoryAnnouncement, readRecentMemoryAnnouncement } from '@/lib/recentMemoryAnnouncement'

const { t } = useI18n()
const router = useRouter()
const recentMemoryAnnouncement = ref(readRecentMemoryAnnouncement())

const homeQuery = useQuery({
  queryKey: ['home'],
  queryFn: () => api<any>('/home')
})

const featuredImage = computed(
  () =>
    resolveApiAssetUrl(homeQuery.data.value?.featuredMemory?.coverAsset?.variants?.lg) ||
    resolveApiAssetUrl(homeQuery.data.value?.featuredMemory?.coverAsset?.originalUrl) ||
    '/pictures/fujimountain.jpg'
)

function getRecentMemoryCoverSrc(memory: any) {
  return resolveApiAssetUrl(memory?.coverAsset?.variants?.sm) || resolveApiAssetUrl(memory?.coverAsset?.originalUrl)
}

function goToTimeline() {
  router.push({ name: 'timeline' })
}

function dismissRecentMemoryAnnouncement() {
  clearRecentMemoryAnnouncement()
  recentMemoryAnnouncement.value = null
}

function formatMemoryDate(value: string) {
  return formatDateInAppTimeZone(value)
}
</script>

<style scoped>
.home-page {
  gap: 1.4rem;
}

.home-hero {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.95fr);
  align-items: stretch;
}

.home-hero-copy,
.home-feature,
.home-feature-copy,
.home-panel {
  display: grid;
  gap: 1.25rem;
  align-content: center;
}

.home-hero h1,
.home-feature h2,
.home-panel h2 {
  margin: 0;
}

.home-feature {
  padding: 1rem;
  border-radius: 28px;
}

.home-feature-image {
  overflow: hidden;
  border-radius: 22px;
  aspect-ratio: 4 / 5;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-stats {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.home-stat-card {
  padding: 1rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: inset 0 0 0 1px var(--outline);
  display: grid;
  gap: 0.35rem;
}

.home-stat-card span {
  color: var(--text-soft);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.home-stat-card strong {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 2.8rem);
  line-height: 0.95;
}

.home-panels {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
}

.recent-list {
  display: grid;
  gap: 0.85rem;
}

.recent-item {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 0.9rem;
  align-items: center;
  padding: 0.55rem;
  border-radius: 20px;
}

.recent-item--text-only {
  grid-template-columns: 1fr;
}

.recent-item--new {
  background: rgba(255, 255, 255, 0.62);
  box-shadow: inset 0 0 0 1px rgba(207, 140, 128, 0.24);
}

.recent-item img {
  width: 76px;
  height: 76px;
  object-fit: cover;
  border-radius: 18px;
}

.recent-item-copy {
  display: grid;
  gap: 0.22rem;
}

.recent-item-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.recent-item-copy strong {
  font-family: var(--font-display);
  font-size: 1.25rem;
  line-height: 1;
}

.recent-item-badge {
  display: inline-flex;
  align-items: center;
  color: #fff8f4;
  background:
    radial-gradient(circle at top right, rgba(255, 223, 207, 0.5), transparent 36%),
    linear-gradient(135deg, #a5666d 0%, #d08b8a 100%);
  box-shadow: var(--shadow-glow);
  border-radius: 999px;
  padding: 0.35rem 0.62rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.recent-item-copy small {
  color: var(--text-soft);
  font-size: 0.84rem;
  font-weight: 700;
}

@media (max-width: 980px) {
  .home-hero,
  .home-panels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .home-stats {
    grid-template-columns: 1fr;
  }
}
</style>
