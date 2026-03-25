<template>
  <Teleport to="body">
    <div v-if="open && normalizedItems.length" class="lightbox" @click.self="emit('close')">
      <div class="lightbox-toolbar">
        <div v-if="hasMultiple" class="lightbox-counter glass">
          {{ currentIndex + 1 }} / {{ normalizedItems.length }}
        </div>
        <button class="lightbox-close button-secondary" type="button" @click="emit('close')">Close</button>
      </div>

      <div class="lightbox-frame" :class="{ 'is-multi': hasMultiple, 'is-single': !hasMultiple }">
        <button
          v-if="hasMultiple"
          class="lightbox-nav lightbox-nav-prev button-secondary"
          type="button"
          aria-label="Previous image"
          :disabled="currentIndex === 0"
          @click.stop="goTo(currentIndex - 1)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </button>

        <div
          class="lightbox-stage glass"
          @touchstart.passive="handleTouchStart"
          @touchmove.passive="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="resetSwipe"
        >
          <div class="lightbox-track" :style="trackStyle">
            <div
              v-for="(item, index) in normalizedItems"
              :key="`${item.src}-${index}`"
              class="lightbox-media"
            >
              <img :src="item.src" :alt="item.alt || ''" loading="lazy" decoding="async" />
              <div v-if="item.caption" class="lightbox-caption">{{ item.caption }}</div>
            </div>
          </div>
        </div>

        <button
          v-if="hasMultiple"
          class="lightbox-nav lightbox-nav-next button-secondary"
          type="button"
          aria-label="Next image"
          :disabled="currentIndex >= normalizedItems.length - 1"
          @click.stop="goTo(currentIndex + 1)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>
      </div>

      <div v-if="hasMultiple" class="lightbox-filmstrip">
        <button
          v-for="(item, index) in normalizedItems"
          :key="`${item.src}-${index}`"
          class="lightbox-thumb"
          :class="{ active: index === currentIndex }"
          type="button"
          :aria-label="`View image ${index + 1}`"
          @click="goTo(index)"
        >
          <img :src="item.src" :alt="item.alt || ''" loading="lazy" decoding="async" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type LightboxItem = {
  src: string
  alt?: string
  caption?: string
}

const props = withDefaults(
  defineProps<{
    open: boolean
    src?: string
    alt?: string
    caption?: string
    items?: LightboxItem[]
    startIndex?: number
  }>(),
  {
    src: '',
    alt: '',
    caption: '',
    items: () => [],
    startIndex: 0
  }
)

const emit = defineEmits<{
  close: []
}>()

const currentIndex = ref(0)
const swipeStartX = ref(0)
const swipeStartY = ref(0)
const swipeDeltaX = ref(0)
const swipeDeltaY = ref(0)
const swipeTracking = ref(false)
const swipeAxis = ref<'pending' | 'horizontal' | 'vertical'>('pending')

const normalizedItems = computed<LightboxItem[]>(() => {
  const items = props.items.filter((item) => item?.src)
  if (items.length) {
    return items
  }
  return props.src ? [{ src: props.src, alt: props.alt, caption: props.caption }] : []
})

const hasMultiple = computed(() => normalizedItems.value.length > 1)
const currentItem = computed(() => normalizedItems.value[currentIndex.value] ?? normalizedItems.value[0] ?? null)
const swipeOffsetX = computed(() => {
  if (!hasMultiple.value || !swipeTracking.value || swipeAxis.value !== 'horizontal') {
    return 0
  }

  const atLeadingEdge = currentIndex.value === 0 && swipeDeltaX.value > 0
  const atTrailingEdge = currentIndex.value === normalizedItems.value.length - 1 && swipeDeltaX.value < 0

  return atLeadingEdge || atTrailingEdge ? swipeDeltaX.value * 0.25 : swipeDeltaX.value
})

const trackStyle = computed(() => {
  if (!hasMultiple.value) return undefined
  const baseOffset = currentIndex.value * -100
  return {
    transform: `translate3d(calc(${baseOffset}% + ${swipeOffsetX.value}px), 0, 0)`,
    transition: swipeTracking.value ? 'none' : 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)'
  }
})

watch(
  () => [props.open, props.startIndex, normalizedItems.value.length] as const,
  ([open, startIndex, total]) => {
    if (!open || !total) {
      currentIndex.value = 0
      resetSwipe()
      return
    }
    currentIndex.value = clampIndex(startIndex, total)
    resetSwipe()
  },
  { immediate: true }
)

watch(
  () => props.open,
  (open) => {
    if (open) {
      window.addEventListener('keydown', handleKeydown)
      return
    }
    window.removeEventListener('keydown', handleKeydown)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function clampIndex(index: number, total = normalizedItems.value.length) {
  if (!total) {
    return 0
  }
  return Math.min(Math.max(index, 0), total - 1)
}

function goTo(index: number) {
  currentIndex.value = clampIndex(index)
  resetSwipe()
}

function handleTouchStart(event: TouchEvent) {
  if (!hasMultiple.value || event.touches.length !== 1) {
    return
  }

  const touch = event.touches.item(0)
  if (!touch) {
    return
  }
  swipeStartX.value = touch.clientX
  swipeStartY.value = touch.clientY
  swipeDeltaX.value = 0
  swipeDeltaY.value = 0
  swipeTracking.value = true
  swipeAxis.value = 'pending'
}

function handleTouchMove(event: TouchEvent) {
  if (!swipeTracking.value || event.touches.length !== 1) {
    return
  }

  const touch = event.touches.item(0)
  if (!touch) {
    return
  }
  swipeDeltaX.value = touch.clientX - swipeStartX.value
  swipeDeltaY.value = touch.clientY - swipeStartY.value

  if (swipeAxis.value !== 'pending') {
    return
  }

  const absX = Math.abs(swipeDeltaX.value)
  const absY = Math.abs(swipeDeltaY.value)

  if (absX < 10 && absY < 10) {
    return
  }

  swipeAxis.value = absX > absY ? 'horizontal' : 'vertical'
}

function handleTouchEnd() {
  if (!swipeTracking.value) {
    return
  }

  if (swipeAxis.value === 'horizontal') {
    const threshold = 60
    if (swipeDeltaX.value <= -threshold) {
      goTo(currentIndex.value + 1)
      return
    }

    if (swipeDeltaX.value >= threshold) {
      goTo(currentIndex.value - 1)
      return
    }
  }

  resetSwipe()
}

function resetSwipe() {
  swipeTracking.value = false
  swipeAxis.value = 'pending'
  swipeDeltaX.value = 0
  swipeDeltaY.value = 0
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.open) {
    return
  }

  if (event.key === 'Escape') {
    emit('close')
    return
  }

  if (!hasMultiple.value) {
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    goTo(currentIndex.value - 1)
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    goTo(currentIndex.value + 1)
  }
}
</script>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(39, 28, 29, 0.52);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  display: grid;
  align-content: center;
  gap: 1rem;
  z-index: 60;
  padding: 1.25rem;
}

.lightbox-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.lightbox-counter {
  min-height: 2.8rem;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  color: rgba(255, 248, 244, 0.96);
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.lightbox-close {
  margin-left: auto;
}

.lightbox-frame {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
}

.lightbox-frame.is-single {
  grid-template-columns: minmax(0, 1fr);
}

.lightbox-stage {
  min-width: 0;
  width: min(1120px, 100%);
  max-width: min(1120px, 100%);
  margin: 0 auto;
  justify-self: center;
  border-radius: 32px;
  padding: 1rem;
  overflow: hidden;
  touch-action: pan-y;
}

.lightbox-track {
  display: flex;
  align-items: center;
  height: 100%;
  will-change: transform;
}

.lightbox-media {
  flex: 0 0 100%;
  width: 100%;
  padding: 0 0.25rem;
}

.lightbox-stage img {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 12rem);
  margin: 0 auto;
  border-radius: 24px;
}

.lightbox-caption {
  margin-top: 0.9rem;
  color: var(--text-soft);
  text-align: center;
}

.lightbox-nav {
  width: 3rem;
  min-width: 3rem;
  min-height: 3rem;
  padding: 0;
  border-radius: 999px;
}

.lightbox-filmstrip {
  display: flex;
  justify-content: center;
  gap: 0.65rem;
  overflow-x: auto;
  padding-bottom: 0.1rem;
}

.lightbox-filmstrip::-webkit-scrollbar {
  height: 6px;
}

.lightbox-filmstrip::-webkit-scrollbar-thumb {
  background: var(--outline-strong);
  border-radius: 999px;
}

.lightbox-thumb {
  width: 4.5rem;
  height: 4.5rem;
  padding: 0;
  border: 0;
  border-radius: 18px;
  overflow: hidden;
  opacity: 0.58;
  transform: scale(0.96);
  box-shadow:
    0 10px 24px rgba(39, 28, 29, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.lightbox-thumb.active {
  opacity: 1;
  transform: scale(1);
  box-shadow:
    0 16px 32px rgba(39, 28, 29, 0.18),
    0 0 0 2px rgba(255, 248, 244, 0.5);
}

.lightbox-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 720px) {
  .lightbox {
    padding: 0.8rem;
    align-content: stretch;
  }

  .lightbox-toolbar {
    align-items: flex-start;
  }

  .lightbox-frame {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.75rem;
  }

  .lightbox-stage {
    padding: 0.8rem;
  }

  .lightbox-stage img {
    max-height: calc(100svh - 14rem);
    border-radius: 20px;
  }

  .lightbox-nav {
    position: fixed;
    bottom: 6.2rem;
    z-index: 2;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .lightbox-nav-prev {
    left: 1rem;
  }

  .lightbox-nav-next {
    right: 1rem;
  }

  .lightbox-filmstrip {
    justify-content: flex-start;
    padding-inline: 0.1rem;
  }
}
</style>
