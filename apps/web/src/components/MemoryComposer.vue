<template>
  <Teleport to="body">
    <Transition name="composer-fade">
      <div v-if="modelValue" class="composer-overlay" @click.self="close">
        <div class="composer-backdrop" @click="close"></div>
        <div class="composer-sheet">
          <div class="composer-handle" @click="close"></div>

          <div class="composer-header">
            <div class="composer-header-copy">
              <strong class="headline-md">{{ t('actions.addMemory') }}</strong>
              <p class="helper-copy">照片会优先上传，随后这段回忆将以精致卡片的形式保存在你的日记本中。</p>
            </div>
            <button class="button-icon composer-close" aria-label="Close composer" @click="close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="composer-scroll">
            <section class="composer-card">
              <div class="composer-grid">
                <label class="field-block">
                  <span class="field-label">标题</span>
                  <input v-model="form.title" class="field" placeholder="晚间咖啡、初雪、落日列车..." />
                </label>

                <label class="field-block">
                  <span class="field-label">时间</span>
                  <VueDatePicker
                    v-model="form.occurredAt"
                    :locale="datepickerLocale"
                    format="yyyy-MM-dd HH:mm"
                    model-type="yyyy-MM-dd'T'HH:mm"
                    :enable-time-picker="true"
                    auto-apply
                    :clearable="false"
                    input-class-name="custom-dp-input"
                    hide-input-icon
                  />
                </label>
              </div>

              <label class="field-block">
                <span class="field-label">心情</span>
                <div class="pill-row is-scrollable mood-row">
                  <button
                    v-for="option in moodChoices"
                    :key="option.value"
                    class="pill-button"
                    :class="{ active: form.mood === option.value }"
                    @click="form.mood = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
                <input
                  v-model="form.customMood"
                  class="field mood-custom-field"
                  placeholder="自定义心情（可选）"
                  maxlength="32"
                />
              </label>

              <label class="field-block">
                <span class="field-label">地点</span>
                <input v-model="form.locationName" class="field" placeholder="咖啡馆、车站、城市、小巷..." />
              </label>

              <label class="field-block">
                <span class="field-label">故事</span>
                <textarea
                  v-model="form.story"
                  class="textarea"
                  rows="6"
                  placeholder="写下发生了什么，有着怎样的气味，那些你几乎快要淡忘的细节..."
                ></textarea>
              </label>
            </section>

            <section class="composer-card">
              <div class="upload-card">
                <div class="upload-copy">
                  <span class="field-label">照片集</span>
                  <strong>添加那些定格瞬间的照片。</strong>
                  <p class="helper-copy">
                    {{
                      uploading
                        ? '正在上传选中的图片...'
                        : uploadedAssets.length
                          ? `已有 ${uploadedAssets.length} 张图片准备保存。`
                          : '为这段回忆选择一张或多张照片。'
                    }}
                  </p>
                </div>

                <div class="upload-actions">
                  <input
                    ref="fileInput"
                    class="visually-hidden"
                    type="file"
                    accept="image/*"
                    multiple
                    :disabled="uploading || saving"
                    @change="handleFileSelection"
                  />
                  <button class="button-secondary" :disabled="uploading || saving" @click="triggerFilePicker">
                    选择照片
                  </button>
                </div>

                <TransitionGroup name="thumb" tag="div" class="selected-files" v-if="uploadedAssets.length">
                  <div v-for="asset in uploadedAssets" :key="asset.assetId" class="selected-file-card">
                    <img :src="asset.previewUrl" :alt="asset.name" class="selected-file-thumb" />
                    <span>{{ asset.name }}</span>
                  </div>
                </TransitionGroup>
              </div>
            </section>

            <p v-if="composerError" class="composer-error">{{ composerError }}</p>
          </div>

          <div class="composer-actions">
            <button class="button-ghost" @click="close">{{ t('actions.cancel') }}</button>
            <button class="button-primary" :disabled="saving || uploading" @click="saveMemory">
              {{ uploading ? '上传中...' : saving ? '保存中...' : t('actions.save') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQueryClient } from '@tanstack/vue-query'
import { enUS, zhCN } from 'date-fns/locale'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { api, ApiError } from '@/lib/api'
import { dateTimeLocalToIso, getCurrentDateTimeLocalValue } from '@/lib/datetime'
import { writeRecentMemoryAnnouncement } from '@/lib/recentMemoryAnnouncement'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'saved', memory: any): void
}>()

const { t, locale } = useI18n()
const queryClient = useQueryClient()

const saving = ref(false)
const uploading = ref(false)
const composerError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const datepickerLocale = computed(() => (locale.value === 'zh' ? zhCN : enUS))

type UploadedAsset = {
  assetId: string
  name: string
  previewUrl: string
}

const uploadedAssets = ref<UploadedAsset[]>([])
const lastAutoOccurredAt = ref(getCurrentDateTimeLocalValue())

const form = ref(createMemoryForm())

const moodChoices = [
  { value: 'romantic', label: '浪漫' },
  { value: 'happy', label: '开心' },
  { value: 'peaceful', label: '平静' },
  { value: 'excited', label: '激动' },
  { value: 'nostalgic', label: '怀旧' },
  { value: 'grateful', label: '感激' },
  { value: 'tender', label: '温柔' }
]

function createMemoryForm() {
  const occurredAt = getCurrentDateTimeLocalValue()
  lastAutoOccurredAt.value = occurredAt
  return {
    title: '',
    occurredAt,
    mood: 'romantic',
    customMood: '',
    locationName: '',
    story: ''
  }
}

function refreshComposerOccurredAt() {
  if (!form.value.occurredAt || form.value.occurredAt === lastAutoOccurredAt.value) {
    const occurredAt = getCurrentDateTimeLocalValue()
    form.value.occurredAt = occurredAt
    lastAutoOccurredAt.value = occurredAt
  }
}

// 锁定打开/关闭
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      refreshComposerOccurredAt()
      document.body.style.overflow = 'hidden'
      document.body.style.overscrollBehaviorY = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.overscrollBehaviorY = ''
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.overscrollBehaviorY = ''
})

function close() {
  resetUploads()
  emit('update:modelValue', false)
}

function triggerFilePicker() {
  fileInput.value?.click()
}

function resetUploads() {
  for (const asset of uploadedAssets.value) {
    URL.revokeObjectURL(asset.previewUrl)
  }
  uploadedAssets.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement | null
  const files = Array.from(input?.files ?? [])
  if (!files.length) return

  uploading.value = true
  composerError.value = ''

  try {
    const currentAssets = [...uploadedAssets.value]
    for (const file of files) {
      const body = new FormData()
      body.append('file', file, file.name)
      const uploaded = await api<any>('/uploads/direct', {
        method: 'POST',
        body
      })
      currentAssets.push({
        assetId: uploaded.assetId,
        name: file.name,
        previewUrl: URL.createObjectURL(file)
      })
      // 渐进式更新
      uploadedAssets.value = [...currentAssets]
    }
  } catch (cause) {
    composerError.value = cause instanceof ApiError ? cause.message : 'Unable to upload image'
  } finally {
    uploading.value = false
    if (input) input.value = ''
  }
}

async function saveMemory() {
  saving.value = true
  composerError.value = ''
  try {
    const assetIds = uploadedAssets.value.map((a) => a.assetId)
    const createdMemory = await api<any>('/memories', {
      method: 'POST',
      body: JSON.stringify({
        ...form.value,
        occurredAt: dateTimeLocalToIso(form.value.occurredAt),
        customMood: form.value.customMood.trim() || undefined,
        assetIds,
        coverAssetId: assetIds[0]
      })
    })
    const announcement = writeRecentMemoryAnnouncement(createdMemory)
    form.value = createMemoryForm()
    resetUploads()
    emit('saved', announcement)
    emit('update:modelValue', false)

    // 延迟刷新列表数据，等关闭过渡动画完成后再触发
    setTimeout(async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['memories'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
        queryClient.invalidateQueries({ queryKey: ['gallery'] })
      ])
    }, 450)
  } catch (cause) {
    composerError.value = cause instanceof ApiError ? cause.message : 'Unable to save memory'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ── Overlay & Transition ── */
.composer-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.composer-backdrop {
  position: absolute;
  inset: -100px;
  background: rgba(30, 24, 24, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: -1;
  transform: translateZ(0);
}

/* ── 入/出场过渡 ── */
.composer-fade-enter-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.composer-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 1, 1);
}
.composer-fade-enter-from,
.composer-fade-leave-to {
  opacity: 0;
}
.composer-fade-enter-active .composer-sheet {
  animation: sheet-enter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.composer-fade-leave-active .composer-sheet {
  animation: sheet-leave 0.35s cubic-bezier(0.4, 0, 1, 1) both;
}

@keyframes sheet-enter {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes sheet-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(24px) scale(0.96);
  }
}

/* ── Sheet ── */
.composer-sheet {
  position: relative;
  z-index: 1;
  width: min(920px, calc(100vw - 2rem));
  max-width: 100%;
  height: min(840px, calc(100dvh - 2rem));
  max-height: calc(100dvh - 2rem);
  border-radius: 32px;
  padding: 1rem 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
  background: var(--surface-strong);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.18);
  transform: translateZ(0);
}

.composer-handle {
  width: 4rem;
  height: 0.32rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
  justify-self: center;
}

.composer-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: flex-start;
  gap: 1rem;
  min-width: 0;
  flex: 0 0 auto;
}

.composer-header-copy {
  display: grid;
  gap: 0.7rem;
  min-width: 0;
}

.composer-header-copy strong,
.upload-copy strong {
  margin: 0;
}

/* ── Scroll area ── */
.composer-scroll {
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 0.25rem 0.25rem 0;
  overscroll-behavior-y: none;
  -webkit-overflow-scrolling: touch;
  background: var(--surface-strong);
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

.composer-scroll::-webkit-scrollbar {
  width: 8px;
}

.composer-scroll::-webkit-scrollbar-track {
  background: transparent;
  margin-block: 0.5rem;
}

.composer-scroll::-webkit-scrollbar-thumb {
  background-color: var(--outline-strong);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

/* ── Cards ── */
.composer-card {
  display: grid;
  gap: 1rem;
  min-width: 0;
  overflow: visible;
  padding: 1.5rem;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: var(--surface-soft);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--outline);
  border-radius: var(--radius-card, 28px);
  transform: translateZ(0);
}

.composer-card::before,
.composer-card::after {
  content: none !important;
  display: none !important;
}

.composer-card .field,
.composer-card .textarea,
.composer-card .select,
.composer-card .pill-button,
.composer-card .button-secondary,
.composer-card .button-ghost,
.composer-card .eyebrow,
.composer-card .custom-dp-input {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.composer-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-width: 0;
}

.mood-row {
  padding-inline: 0.05rem;
}

.mood-custom-field {
  margin-top: 0.9rem;
}

/* ── Uploads ── */
.upload-card {
  display: grid;
  gap: 1rem;
}

.upload-copy {
  display: grid;
  gap: 0.4rem;
}

.upload-actions {
  display: flex;
  justify-content: flex-start;
}

.selected-files {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.selected-file-card {
  display: grid;
  gap: 0.7rem;
  padding: 0.8rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.45);
  font-size: 0.9rem;
  font-weight: 700;
  contain: layout paint;
  transform: translateZ(0); /* 使用 translateZ 强制硬件加速但更符合标准 */
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  will-change: transform, opacity;
  overflow: hidden;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease;
}

.selected-file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(116, 79, 75, 0.12);
}

.selected-file-card:active {
  transform: scale(0.95);
}

/* 缩略图淡入 */
.thumb-enter-active {
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.thumb-leave-active {
  transition: all 0.25s ease;
}
.thumb-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}
.thumb-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.selected-file-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 16px;
  /* 解决移动端图片边缘抗锯齿引发的渲染突变 */
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* ── Error ── */
.composer-error {
  margin: 0;
  padding: 0.95rem 1rem;
  border-radius: 20px;
  background: rgba(201, 69, 89, 0.12);
  color: #8b3141;
  font-weight: 700;
}

/* ── Actions ── */
.composer-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.8rem;
  flex: 0 0 auto;
  padding: 1rem 0 calc(0.95rem + env(safe-area-inset-bottom, 0px));
  background: transparent;
  border-top: 1px solid var(--outline);
}

/* ── Responsive ── */
@media (max-width: 720px) {
  .composer-grid {
    grid-template-columns: 1fr;
  }

  .composer-overlay {
    padding: 0;
    place-items: end center;
    background: rgba(39, 28, 29, 0.5);
  }

  .composer-backdrop {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .composer-sheet {
    width: 100vw;
    max-width: 100vw;
    max-height: 100dvh;
    height: 100dvh;
    border-radius: 0;
    padding: 0;
    gap: 0;
    background: var(--surface-strong);
  }

  .composer-header,
  .composer-actions {
    padding: 1rem 1.15rem;
    background: var(--surface-strong);
  }
}

@media (max-width: 640px) {
  .composer-header {
    gap: 0.75rem;
  }

  .composer-card {
    padding: 1.15rem;
  }

  .composer-scroll {
    padding-right: 0;
  }

  .composer-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .composer-actions .button-ghost,
  .composer-actions .button-primary {
    width: 100%;
  }
}
</style>
