<template>
  <div class="page home-page">
    <header class="editorial-header">
      <h1 class="display-lg">{{ t('home.welcome') }}</h1>
      <p class="body-lg">Timelines, anniversaries, photos, and future plans live here in one quiet space.</p>
    </header>

    <section class="hero-editorial">
      <div class="hero-image-wrapper">
        <img
          class="hero-image"
          :src="featuredImage"
          alt="Featured memory"
        />
      </div>
      <div class="hero-card glass">
        <span class="hero-chip">{{ t('common.featuredMemory') }}</span>
        <h2 class="headline-md">{{ homeQuery.data.value?.featuredMemory?.title || t('home.empty') }}</h2>
        <p class="body-lg">{{ homeQuery.data.value?.featuredMemory?.story || 'Begin with a photo, a line of text, or the place where your story turned warm.' }}</p>
      </div>
    </section>

    <section class="stats-editorial">
      <article class="stat-item section-card">
        <span class="stat-label">{{ t('home.stats.memories') }}</span>
        <strong class="display-lg">{{ homeQuery.data.value?.stats.memoryCount ?? 0 }}</strong>
      </article>
      <article class="stat-item section-card">
        <span class="stat-label">{{ t('home.stats.anniversaries') }}</span>
        <strong class="display-lg">{{ homeQuery.data.value?.stats.anniversaryCount ?? 0 }}</strong>
      </article>
      <article class="stat-item section-card">
        <span class="stat-label">{{ t('home.stats.wishlist') }}</span>
        <strong class="display-lg">{{ homeQuery.data.value?.stats.wishlistCompleted ?? 0 }}</strong>
      </article>
    </section>

    <section class="home-grid">
      <article class="section-card anniversary-card">
        <h3 class="headline-md">{{ t('common.nextAnniversary') }}</h3>
        <template v-if="homeQuery.data.value?.nextAnniversary">
          <p class="next-anniversary-title">{{ homeQuery.data.value?.nextAnniversary.title }}</p>
          <p class="next-anniversary-meta">
            {{ t('common.daysLeft', { count: homeQuery.data.value?.nextAnniversary.daysLeft }) }}
          </p>
        </template>
        <div v-else class="empty-state">{{ t('anniversaries.empty') }}</div>
      </article>

      <article class="section-card recent-memories-card">
        <h3 class="headline-md">{{ t('common.recentMemories') }}</h3>
        <div v-if="homeQuery.data.value?.recentMemories?.length" class="recent-list">
          <div v-for="(memory, index) in homeQuery.data.value?.recentMemories" :key="memory.id" class="recent-item">
            <img 
              :src="memory.coverAsset?.originalUrl || '/pictures/coffee.jpg'" 
              :alt="memory.title" 
              :class="{ 'asymmetric-radius-1': Number(index) % 2 === 0, 'asymmetric-radius-2': Number(index) % 2 !== 0 }"
            />
            <div class="recent-item-copy">
              <strong>{{ memory.title }}</strong>
              <small>{{ new Date(memory.occurredAt).toLocaleDateString() }}</small>
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
.home-page {
  gap: 4rem;
}

.editorial-header {
  max-width: 800px;
}

.editorial-header h1 {
  margin-bottom: 1rem;
  color: var(--primary);
}

.hero-editorial {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-top: 1rem;
}

.hero-image-wrapper {
  width: 100%;
  height: 500px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-ambient);
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-card {
  position: relative;
  margin-top: -6rem;
  margin-right: 2rem;
  width: min(90%, 500px);
  padding: 2.5rem;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 10;
}

.hero-chip {
  display: inline-flex;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-full);
  background: var(--primary-container);
  color: var(--on-primary-container);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
}

.hero-card h2 {
  margin: 0 0 1rem;
  color: var(--primary);
}

.hero-card p {
  margin: 0;
  color: var(--text-soft);
}

.stats-editorial {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-radius: var(--radius-xl);
  padding: 2.5rem 1.5rem;
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-4px);
}

.stat-label {
  color: var(--text-soft);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.stat-item strong {
  color: var(--primary);
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem;
}

.anniversary-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container-low));
}

.anniversary-card h3, .recent-memories-card h3 {
  margin-top: 0;
  margin-bottom: 2rem;
  color: var(--primary);
}

.next-anniversary-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.next-anniversary-meta {
  color: var(--primary);
  opacity: 0.8;
  font-size: 1.1rem;
}

.recent-list {
  display: grid;
  gap: 1.5rem;
}

.recent-item {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 1.5rem;
  align-items: center;
}

.recent-item img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  box-shadow: var(--shadow-ambient);
}

/* Asymmetric Image Corners for Scrapbook Feel */
.asymmetric-radius-1 {
  border-radius: var(--radius-xl) var(--radius-sm) var(--radius-lg) var(--radius-xl);
}

.asymmetric-radius-2 {
  border-radius: var(--radius-md) var(--radius-xl) var(--radius-xl) var(--radius-sm);
}

.recent-item-copy {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.recent-item-copy strong {
  font-size: 1.1rem;
  line-height: 1.4;
  font-family: var(--font-display);
}

.recent-item-copy small {
  color: var(--text-soft);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@media (max-width: 840px) {
  .stats-editorial,
  .home-grid {
    grid-template-columns: 1fr;
  }
  
  .hero-card {
    margin-right: 0;
    margin-top: -3rem;
    width: 95%;
    align-self: center;
    padding: 1.8rem;
  }
}
</style>
