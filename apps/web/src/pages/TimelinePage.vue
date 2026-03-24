<template>
  <div class="page">
    <header class="page-header timeline-header">
      <div>
        <h1>{{ t('timeline.title') }}</h1>
        <p>Search by date, mood, or place, then add fresh moments without leaving the flow.</p>
      </div>
      <button class="button-primary" @click="openComposer = true">{{ t('actions.addMemory') }}</button>
    </header>

    <section class="timeline-toolbar glass section-card">
      <input v-model="search" class="field" :placeholder="t('timeline.search')" />
      <div class="mood-row">
        <button
          v-for="option in moodOptions"
          :key="option.value"
          class="button-secondary mood-button"
          :class="{ active: mood === option.value }"
          @click="mood = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section v-if="memoriesQuery.data.value?.items.length" class="timeline-list">
      <article v-for="memory in memoriesQuery.data.value?.items" :key="memory.id" class="glass timeline-item">
        <img :src="memory.coverAsset?.variants?.md || memory.coverAsset?.originalUrl || '/pictures/coffee.jpg'" :alt="memory.title" />
        <div class="timeline-item-copy">
          <div class="timeline-meta">
            <span>{{ formatDate(memory.occurredAt) }}</span>
            <span>{{ memory.mood }}</span>
          </div>
          <h2>{{ memory.title }}</h2>
          <p>{{ memory.story }}</p>
          <small v-if="memory.locationName">{{ memory.locationName }}</small>
        </div>
      </article>
    </section>
    <div v-else class="empty-state">{{ t('timeline.empty') }}</div>

    <Teleport to="body">
      <div v-if="openComposer" class="composer-overlay" @click.self="closeComposer">
        <div class="composer glass">
          <div class="composer-header">
            <div>
              <strong>{{ t('actions.addMemory') }}</strong>
              <p>Photos upload directly to object storage before the memory is saved.</p>
            </div>
            <button class="button-secondary" @click="closeComposer">{{ t('actions.cancel') }}</button>
          </div>

          <div class="composer-grid">
            <input v-model="form.title" class="field" placeholder="Title" />
            <input v-model="form.occurredAt" class="field" type="datetime-local" />
            <select v-model="form.mood" class="select">
              <option v-for="option in moodOptions.filter((item) => item.value)" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input v-model="form.locationName" class="field" placeholder="Location" />
            <textarea v-model="form.story" class="textarea" rows="6" placeholder="Tell the story of this moment"></textarea>
            <input ref="fileInput" class="field" type="file" accept="image/*" multiple />
          </div>

          <p v-if="composerError" class="composer-error">{{ composerError }}</p>

          <div class="composer-actions">
            <button class="button-primary" :disabled="saving" @click="saveMemory">{{ t('actions.save') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api, ApiError } from '@/lib/api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const search = ref('')
const mood = ref('')
const openComposer = ref(route.query.compose === '1')
const saving = ref(false)
const composerError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const form = ref({
  title: '',
  occurredAt: new Date().toISOString().slice(0, 16),
  mood: 'romantic',
  locationName: '',
  story: ''
})

watch(
  () => route.query.compose,
  (value) => {
    openComposer.value = value === '1'
  }
)

const moodOptions = [
  { value: '', label: 'All moods' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'happy', label: 'Happy' },
  { value: 'peaceful', label: 'Peaceful' },
  { value: 'excited', label: 'Excited' },
  { value: 'nostalgic', label: 'Nostalgic' },
  { value: 'grateful', label: 'Grateful' },
  { value: 'tender', label: 'Tender' }
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

function closeComposer() {
  openComposer.value = false
  router.replace({ name: 'timeline' })
}

async function uploadFiles(files: File[]) {
  const assetIds: string[] = []
  for (const file of files) {
    const presign = await api<any>('/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        byteSize: file.size
      })
    })
    await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: presign.headers,
      body: file
    })
    const complete = await api<any>('/uploads/complete', {
      method: 'POST',
      body: JSON.stringify({
        storageKey: presign.storageKey,
        originalUrl: presign.publicUrl,
        mimeType: file.type,
        byteSize: file.size
      })
    })
    assetIds.push(complete.assetId)
  }
  return assetIds
}

async function saveMemory() {
  saving.value = true
  composerError.value = ''
  try {
    const files = Array.from(fileInput.value?.files ?? [])
    const assetIds = files.length ? await uploadFiles(files) : []
    await api('/memories', {
      method: 'POST',
      body: JSON.stringify({
        ...form.value,
        occurredAt: new Date(form.value.occurredAt).toISOString(),
        assetIds,
        coverAssetId: assetIds[0]
      })
    })
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['memories'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] }),
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
    ])
    form.value = {
      title: '',
      occurredAt: new Date().toISOString().slice(0, 16),
      mood: 'romantic',
      locationName: '',
      story: ''
    }
    if (fileInput.value) fileInput.value.value = ''
    closeComposer()
  } catch (cause) {
    composerError.value = cause instanceof ApiError ? cause.message : 'Unable to save memory'
  } finally {
    saving.value = false
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<style scoped>
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
}

.timeline-toolbar {
  display: grid;
  gap: 1rem;
}

.mood-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.mood-button.active {
  background: var(--accent-soft);
}

.timeline-list {
  display: grid;
  gap: 1rem;
}

.timeline-item {
  border-radius: 32px;
  padding: 1rem;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1rem;
}

.timeline-item img {
  width: 100%;
  min-height: 220px;
  object-fit: cover;
  border-radius: 24px;
}

.timeline-item-copy {
  display: grid;
  align-content: start;
  gap: 0.7rem;
}

.timeline-item-copy h2,
.timeline-item-copy p {
  margin: 0;
}

.timeline-meta,
.timeline-item-copy small {
  color: var(--text-soft);
}

.composer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 10, 14, 0.58);
  backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  z-index: 50;
  padding: 1rem;
}

.composer {
  width: min(760px, 100%);
  border-radius: 32px;
  padding: 1.25rem;
  display: grid;
  gap: 1rem;
}

.composer-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.composer-header p {
  margin: 0.4rem 0 0;
  color: var(--text-soft);
}

.composer-grid {
  display: grid;
  gap: 0.9rem;
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
}

.composer-error {
  color: var(--accent);
}

@media (max-width: 760px) {
  .timeline-header {
    flex-direction: column;
    align-items: stretch;
  }

  .timeline-item {
    grid-template-columns: 1fr;
  }
}
</style>
