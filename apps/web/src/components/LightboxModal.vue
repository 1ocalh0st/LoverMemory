<template>
  <Teleport to="body">
    <Transition name="lightbox-fade">
      <div v-if="open && normalizedItems.length" class="lightbox" @click.self="emit('close')">
        <!-- Close button -->
        <button class="lightbox-close" type="button" aria-label="Close" @click="emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        <!-- Counter -->
        <div v-if="hasMultiple" class="lightbox-counter">
          {{ currentIndex + 1 }} / {{ normalizedItems.length }}
        </div>

        <!-- Main image area -->
        <div
          class="lightbox-stage"
          :class="{ 'is-multi': hasMultiple }"
          @touchstart.passive="handleTouchStart"
          @touchmove.passive="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="resetSwipe"
        >
          <div class="lightbox-track" :style="trackStyle">
            <div
              v-for="(item, index) in normalizedItems"
              :key="`${item.src}-${index}`"
              class="lightbox-slide"
            >
              <img :src="item.src" :alt="item.alt || ''" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>

        <!-- Caption -->
        <div v-if="currentItem?.caption" class="lightbox-caption">{{ currentItem.caption }}</div>

        <!-- Navigation arrows (PC) -->
        <button
          v-if="hasMultiple"
          class="lightbox-nav lightbox-nav-prev"
          type="button"
          aria-label="Previous image"
          :disabled="currentIndex === 0"
          @click.stop="goTo(currentIndex - 1)"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </button>
        <button
          v-if="hasMultiple"
          class="lightbox-nav lightbox-nav-next"
          type="button"
          aria-label="Next image"
          :disabled="currentIndex >= normalizedItems.length - 1"
          @click.stop="goTo(currentIndex + 1)"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>

        <!-- Filmstrip dots (mobile) / thumbnails (PC) -->
        <div v-if="hasMultiple" class="lightbox-indicators">
          <button
            v-for="(item, index) in normalizedItems"
            :key="`thumb-${item.src}-${index}`"
            class="lightbox-dot"
            :class="{ active: index === currentIndex }"
            type="button"
            :aria-label="`View image ${index + 1}`"
            @click="goTo(index)"
          >
            <img :src="item.src" :alt="item.alt || ''" loading="lazy" decoding="async" />
          </button>
        </div>
      </div>
    </Transition>
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
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeydown)
      return
    }
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleKeydown)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
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
/* ─── Transition ─── */
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}

/* ─── Overlay ─── */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(20, 16, 16, 0.55);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 1rem;
  gap: 0;
}

/* ─── Close button ─── */
.lightbox-close {
  position: absolute;
  top: clamp(0.8rem, 2vw, 1.2rem);
  right: clamp(0.8rem, 2vw, 1.2rem);
  z-index: 5;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 999px;
  border: 0;
  padding: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  transform: scale(1.06);
}

/* ─── Counter ─── */
.lightbox-counter {
  position: absolute;
  top: clamp(0.8rem, 2vw, 1.2rem);
  left: clamp(0.8rem, 2vw, 1.2rem);
  z-index: 5;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

/* ─── Stage (no frame/shell) ─── */
.lightbox-stage {
  min-width: 0;
  width: 100%;
  max-width: min(1200px, 100%);
  overflow: hidden;
  touch-action: pan-y;
  flex: 0 1 auto;
}

.lightbox-track {
  display: flex;
  align-items: center;
  height: 100%;
  will-change: transform;
}

.lightbox-slide {
  flex: 0 0 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
}

/* Image — no enclosing frame, clean and immersive */
.lightbox-stage img {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 10rem);
  max-height: calc(100svh - 10rem);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  object-fit: contain;
}

/* ─── Caption ─── */
.lightbox-caption {
  margin-top: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.88rem;
  font-weight: 500;
  text-align: center;
  letter-spacing: 0.01em;
}

/* ─── Nav arrows (positioned on sides) ─── */
.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  border: 0;
  padding: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.lightbox-nav:disabled {
  opacity: 0.25;
  pointer-events: none;
}

.lightbox-nav-prev {
  left: clamp(0.6rem, 2vw, 1.5rem);
}

.lightbox-nav-next {
  right: clamp(0.6rem, 2vw, 1.5rem);
}

/* ─── Indicator dots / thumbnails ─── */
.lightbox-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 0.1rem;
}

.lightbox-indicators::-webkit-scrollbar {
  height: 4px;
}

.lightbox-indicators::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
}

.lightbox-dot {
  width: 3.6rem;
  height: 3.6rem;
  padding: 0;
  border: 0;
  border-radius: 12px;
  overflow: hidden;
  opacity: 0.4;
  transform: scale(0.92);
  cursor: pointer;
  transition:
    opacity 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.lightbox-dot.active {
  opacity: 1;
  transform: scale(1);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.lightbox-dot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ─── Mobile ─── */
@media (max-width: 720px) {
  .lightbox {
    padding: 0.65rem;
  }

  .lightbox-stage img {
    max-height: calc(100svh - 9rem);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  }

  .lightbox-nav {
    top: auto;
    bottom: 5rem;
    transform: none;
    width: 2.6rem;
    height: 2.6rem;
    background: rgba(255, 255, 255, 0.1);
  }

  .lightbox-nav-prev {
    left: 0.8rem;
  }

  .lightbox-nav-next {
    right: 0.8rem;
  }

  .lightbox-indicators {
    margin-top: 0.75rem;
    gap: 0.4rem;
  }

  .lightbox-dot {
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 8px;
  }

  .lightbox-caption {
    font-size: 0.82rem;
    margin-top: 0.65rem;
  }
}
</style>
