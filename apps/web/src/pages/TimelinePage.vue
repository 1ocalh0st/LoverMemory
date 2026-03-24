<template>
  <div class="page timeline-page">
    <header class="editorial-header">
      <div class="header-content">
        <h1 class="display-lg">{{ t('timeline.title') }}</h1>
        <p class="body-lg">Search by date, mood, or place, then add fresh moments without leaving the flow.</p>
      </div>
      <button class="button-primary write-btn" @click="openComposer = true">
        <span class="btn-icon">+</span> {{ t('actions.addMemory') }}
      </button>
    </header>

    <section class="timeline-toolbar">
      <div class="search-wrapper section-card">
        <input v-model="search" class="field search-field" :placeholder="t('timeline.search')" />
      </div>
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

    <section v-if="memoriesQuery.data.value?.items.length" class="shared-thread">
      <div class="thread-line"></div>
      
      <article 
        v-for="(memory, index) in memoriesQuery.data.value?.items" 
        :key="memory.id" 
        class="thread-node"
        :class="Number(index) % 2 === 0 ? 'node-left' : 'node-right'"
      >
        <div class="node-dot"></div>
        <div class="timeline-item section-card">
          <img :src="memory.coverAsset?.variants?.md || memory.coverAsset?.originalUrl || '/pictures/coffee.jpg'" :alt="memory.title" />
          <div class="timeline-item-copy">
            <div class="timeline-meta">
              <span class="meta-date">{{ formatDate(memory.occurredAt) }}</span>
              <span v-if="memory.mood" class="meta-mood">{{ memory.mood }}</span>
            </div>
            <h2 class="headline-md">{{ memory.title }}</h2>
            <p class="body-lg">{{ memory.story }}</p>
            <small v-if="memory.locationName" class="meta-location">{{ memory.locationName }}</small>
          </div>
        </div>
      </article>
    </section>
    <div v-else class="empty-state">{{ t('timeline.empty') }}</div>

    <Teleport to="body">
      <div v-if="openComposer" class="composer-overlay" @click.self="closeComposer">
        <div class="composer-container">
          <div class="composer-header">
            <div>
              <strong class="headline-md">{{ t('actions.addMemory') }}</strong>
              <p class="body-lg">Photos upload directly to object storage before the memory is saved.</p>
            </div>
            <button class="button-secondary close-btn" @click="closeComposer">×</button>
          </div>

          <div class="composer-grid">
            <input v-model="form.title" class="field ledger-style" placeholder="Title" />
            <input v-model="form.occurredAt" class="field ledger-style" type="datetime-local" />
            <select v-model="form.mood" class="select ledger-style">
              <option v-for="option in moodOptions.filter((item) => item.value)" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input v-model="form.locationName" class="field ledger-style" placeholder="Location" />
            <textarea v-model="form.story" class="textarea ledger-style" rows="6" placeholder="Tell the story of this moment"></textarea>
            
            <div class="file-upload-wrapper ledger-style">
              <label class="file-upload-label">
                <span>Select Photos</span>
                <input ref="fileInput" class="file-input-hidden" type="file" accept="image/*" multiple />
              </label>
            </div>
          </div>

          <p v-if="composerError" class="composer-error">{{ composerError }}</p>

          <div class="composer-actions">
            <button class="button-primary save-btn" :disabled="saving" @click="saveMemory">
              {{ saving ? 'Saving...' : t('actions.save') }}
            </button>
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
    const body = new FormData()
    body.append('file', file, file.name)
    const uploaded = await api<any>('/uploads/direct', {
      method: 'POST',
      body
    })
    assetIds.push(uploaded.assetId)
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
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}
</script>

<style scoped>
.timeline-page {
  gap: 3.5rem;
}

.editorial-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
  max-width: 1000px;
}

.editorial-header h1 {
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.write-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.btn-icon {
  font-size: 1.5rem;
  line-height: 0;
}

.timeline-toolbar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1000px;
}

.search-wrapper {
  padding: 0.5rem;
  border-radius: var(--radius-full);
}

.search-field {
  background: transparent;
  border: none;
  font-size: 1.1rem;
}

.search-field:focus {
  background: transparent;
}

.mood-row {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.mood-button {
  padding: 0.6rem 1.4rem;
  border-radius: var(--radius-full);
  background: var(--surface-container-low);
  color: var(--text-soft);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.mood-button.active, .mood-button:hover {
  background: var(--primary-container);
  color: var(--on-primary-container);
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
}

/* The Shared Thread */
.shared-thread {
  position: relative;
  max-width: 1000px;
  margin: 3rem auto 0;
  padding-bottom: 4rem;
}

.thread-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  margin-left: -1px;
  background-color: var(--secondary-fixed);
  z-index: 0;
}

.thread-node {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 5rem;
  width: 100%;
}

.node-left {
  justify-content: flex-end;
  padding-right: 50%;
}

.node-right {
  justify-content: flex-start;
  padding-left: 50%;
}

.node-dot {
  position: absolute;
  left: 50%;
  top: 40px;
  width: 16px;
  height: 16px;
  margin-left: -8px;
  border-radius: 50%;
  background-color: var(--primary);
  border: 4px solid var(--surface);
  z-index: 1;
}

.timeline-item {
  width: 90%;
  max-width: 480px;
  padding: 1.5rem;
  border-radius: var(--radius-xl);
  display: grid;
  gap: 1.5rem;
  background: var(--surface-container-lowest);
  position: relative;
  z-index: 2;
  transition: transform 0.25s ease;
}

.node-left .timeline-item {
  margin-right: 2.5rem;
}

.node-right .timeline-item {
  margin-left: 2.5rem;
}

.timeline-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-float);
}

.timeline-item img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-ambient);
}

.timeline-item-copy {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.timeline-meta {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--outline-variant);
  padding-bottom: 0.5rem;
}

.meta-date {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--primary);
  font-size: 1.1rem;
}

.meta-mood {
  background: var(--secondary-container);
  color: var(--secondary);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.timeline-item-copy h2 {
  margin: 0;
  color: var(--primary);
}

.timeline-item-copy p {
  margin: 0;
  color: var(--text-soft);
}

.meta-location {
  color: var(--outline);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

/* Composer Overlay */
.composer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(27, 28, 28, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 1.5rem;
}

.composer-container {
  width: min(800px, 100%);
  background: var(--surface-container-lowest);
  border-radius: var(--radius-xl);
  padding: 3rem;
  box-shadow: var(--shadow-ambient);
  display: grid;
  gap: 2rem;
  max-height: 90vh;
  overflow-y: auto;
}

.composer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--outline-variant);
  padding-bottom: 1.5rem;
}

.composer-header h2 {
  margin: 0;
  color: var(--primary);
}

.composer-header p {
  color: var(--text-soft);
  margin-top: 0.5rem;
}

.close-btn {
  background: var(--surface-container-low);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  padding: 0;
}

.composer-grid {
  display: grid;
  gap: 1.5rem;
}

.ledger-style {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--outline-variant);
  border-radius: 0;
  padding: 1rem 0;
  font-size: 1.1rem;
}

.ledger-style:focus {
  background: var(--surface-container-low);
  border-bottom-color: var(--primary);
}

.file-upload-wrapper {
  padding: 1.5rem 0;
}

.file-upload-label {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  border: 1px dashed var(--outline);
  border-radius: var(--radius-lg);
  cursor: pointer;
  color: var(--text-soft);
  font-weight: 600;
  transition: all 0.2s ease;
}

.file-upload-label:hover {
  background: var(--surface-container-low);
  border-color: var(--primary);
  color: var(--primary);
}

.file-input-hidden {
  display: none;
}

.composer-error {
  color: #ba1a1a;
  background: #ffdad6;
  padding: 1rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 1.5rem;
}

.save-btn {
  padding: 1rem 3rem;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .editorial-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .thread-line {
    left: 1.5rem;
  }
  
  .node-left, .node-right {
    padding-left: 3rem;
    padding-right: 0;
  }
  
  .node-dot {
    left: 1.5rem;
  }
  
  .node-left .timeline-item, .node-right .timeline-item {
    margin: 0;
    width: 100%;
  }

  .composer-container {
    padding: 1.5rem;
  }
}
</style>
