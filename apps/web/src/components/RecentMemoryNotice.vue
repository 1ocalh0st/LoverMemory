<template>
  <article class="section-card recent-memory-notice" :class="{ 'recent-memory-notice--text-only': !coverSrc }">
    <div v-if="coverSrc" class="recent-memory-media">
      <img :src="coverSrc" :alt="memory.title" loading="lazy" decoding="async" />
    </div>

    <div class="recent-memory-copy">
      <div class="recent-memory-header">
        <div class="recent-memory-heading">
          <span class="eyebrow">{{ title }}</span>
          <p v-if="subtitle" class="recent-memory-subtitle">{{ subtitle }}</p>
        </div>
        <slot name="aside"></slot>
      </div>

      <h2 class="headline-md">{{ memory.title }}</h2>
      <p class="body-lg">{{ memory.story || fallbackCopy }}</p>

      <div class="recent-memory-meta">
        <span>{{ formattedDate }}</span>
        <span v-if="memory.assetCount > 1">{{ t('common.photoCount', { count: memory.assetCount }) }}</span>
      </div>

      <div v-if="$slots.actions" class="recent-memory-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveApiAssetUrl } from '@/lib/api'
import { formatDateInAppTimeZone } from '@/lib/datetime'
import type { RecentMemoryAnnouncement } from '@/lib/recentMemoryAnnouncement'

const props = withDefaults(
  defineProps<{
    memory: RecentMemoryAnnouncement
    title: string
    subtitle?: string
    fallbackCopy?: string
  }>(),
  {
    subtitle: '',
    fallbackCopy: '留下一段文字、一张照片，或者一个值得记住的时刻。'
  }
)

const { t } = useI18n()

const coverSrc = computed(() => resolveApiAssetUrl(props.memory.coverPath))
const formattedDate = computed(() => formatDateInAppTimeZone(props.memory.occurredAt))
</script>

<style scoped>
.recent-memory-notice {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  align-items: stretch;
}

.recent-memory-notice--text-only {
  grid-template-columns: 1fr;
}

.recent-memory-notice::before {
  background: radial-gradient(circle, rgba(255, 214, 194, 0.55), transparent 72%);
}

.recent-memory-media {
  overflow: hidden;
  border-radius: 22px;
  min-height: 100%;
}

.recent-memory-media img {
  width: 100%;
  height: 100%;
  min-height: 180px;
  object-fit: cover;
}

.recent-memory-copy {
  display: grid;
  gap: 0.9rem;
  align-content: center;
}

.recent-memory-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.recent-memory-heading {
  display: grid;
  gap: 0.55rem;
}

.recent-memory-subtitle {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.55;
}

.recent-memory-copy h2,
.recent-memory-copy p {
  margin: 0;
}

.recent-memory-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-soft);
  font-size: 0.84rem;
  font-weight: 700;
}

.recent-memory-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (max-width: 720px) {
  .recent-memory-notice {
    grid-template-columns: 1fr;
  }

  .recent-memory-media img {
    min-height: 200px;
  }
}
</style>
