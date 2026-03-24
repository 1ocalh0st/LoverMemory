<template>
  <div class="page">
    <header class="page-header">
      <h1>{{ t('home.welcome') }}</h1>
      <p>Timelines, anniversaries, photos, and future plans live here in one quiet space.</p>
    </header>

    <section class="hero glass">
      <img
        class="hero-image"
        :src="featuredImage"
        alt="Featured memory"
      />
      <div class="hero-copy">
        <span class="hero-chip">{{ t('common.featuredMemory') }}</span>
        <h2>{{ homeQuery.data.value?.featuredMemory?.title || t('home.empty') }}</h2>
        <p>{{ homeQuery.data.value?.featuredMemory?.story || 'Begin with a photo, a line of text, or the place where your story turned warm.' }}</p>
      </div>
    </section>

    <section class="stats-grid">
      <article class="glass section-card stat-card">
        <small>{{ t('home.stats.memories') }}</small>
        <strong>{{ homeQuery.data.value?.stats.memoryCount ?? 0 }}</strong>
      </article>
      <article class="glass section-card stat-card">
        <small>{{ t('home.stats.anniversaries') }}</small>
        <strong>{{ homeQuery.data.value?.stats.anniversaryCount ?? 0 }}</strong>
      </article>
      <article class="glass section-card stat-card">
        <small>{{ t('home.stats.wishlist') }}</small>
        <strong>{{ homeQuery.data.value?.stats.wishlistCompleted ?? 0 }}</strong>
      </article>
    </section>

    <section class="home-grid">
      <article class="glass section-card">
        <h3>{{ t('common.nextAnniversary') }}</h3>
        <template v-if="homeQuery.data.value?.nextAnniversary">
          <p class="next-anniversary-title">{{ homeQuery.data.value?.nextAnniversary.title }}</p>
          <p class="next-anniversary-meta">
            {{ t('common.daysLeft', { count: homeQuery.data.value?.nextAnniversary.daysLeft }) }}
          </p>
        </template>
        <div v-else class="empty-state">{{ t('anniversaries.empty') }}</div>
      </article>

      <article class="glass section-card">
        <h3>{{ t('common.recentMemories') }}</h3>
        <div v-if="homeQuery.data.value?.recentMemories?.length" class="recent-list">
          <div v-for="memory in homeQuery.data.value?.recentMemories" :key="memory.id" class="recent-item">
            <img :src="memory.coverAsset?.originalUrl || '/pictures/coffee.jpg'" :alt="memory.title" />
            <div>
              <strong>{{ memory.title }}</strong>
              <p>{{ new Date(memory.occurredAt).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">{{ t('home.empty') }}</div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'

const { t } = useI18n()

const homeQuery = useQuery({
  queryKey: ['home'],
  queryFn: () => api<any>('/home')
})

const featuredImage = computed(
  () =>
    homeQuery.data.value?.featuredMemory?.coverAsset?.variants?.lg ||
    homeQuery.data.value?.featuredMemory?.coverAsset?.originalUrl ||
    '/pictures/fujimountain.jpg'
)
</script>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  min-height: 420px;
  border-radius: 34px;
}

.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.1) contrast(1.04);
}

.hero-copy {
  position: relative;
  z-index: 1;
  color: white;
  padding: clamp(1.5rem, 4vw, 2.6rem);
  display: flex;
  min-height: 420px;
  flex-direction: column;
  justify-content: flex-end;
  background: linear-gradient(180deg, rgba(7, 9, 13, 0.04), rgba(7, 9, 13, 0.64));
}

.hero-chip {
  display: inline-flex;
  width: fit-content;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  margin-bottom: 1rem;
}

.hero-copy h2 {
  font-size: clamp(2rem, 5vw, 4rem);
  margin: 0;
  max-width: 16ch;
  line-height: 0.95;
}

.hero-copy p {
  max-width: 36rem;
  margin: 1rem 0 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.6;
}

.stats-grid,
.home-grid {
  display: grid;
  gap: 1rem;
}

.stats-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.home-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.stat-card small {
  display: block;
  color: var(--text-soft);
}

.stat-card strong {
  display: block;
  margin-top: 0.8rem;
  font-size: clamp(2rem, 4vw, 3.1rem);
  letter-spacing: -0.05em;
}

.recent-list {
  display: grid;
  gap: 0.9rem;
}

.recent-item {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 0.9rem;
  align-items: center;
}

.recent-item img {
  width: 84px;
  height: 84px;
  border-radius: 20px;
  object-fit: cover;
}

.recent-item p,
.next-anniversary-meta {
  color: var(--text-soft);
}

.next-anniversary-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 1rem 0 0.4rem;
}

@media (max-width: 840px) {
  .stats-grid,
  .home-grid {
    grid-template-columns: 1fr;
  }
}
</style>
