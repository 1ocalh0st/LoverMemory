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

        <!-- Reset Zoom (Mobile/PC) -->
        <Transition name="fade">
          <button v-if="isZoomed" class="lightbox-reset" type="button" aria-label="Reset Zoom" @click="resetZoom">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            <span class="lightbox-tip-key">按 R</span>
          </button>
        </Transition>

        <!-- Main image area -->
        <div
          class="lightbox-stage"
          :class="{ 'is-multi': hasMultiple, 'is-zoomed': isZoomed }"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
          @wheel="handleWheel"
        >
          <div class="lightbox-track" :style="trackStyle">
            <div
              v-for="(item, index) in normalizedItems"
              :key="`${item.src}-${index}`"
              class="lightbox-slide"
            >
              <img
                :src="item.src"
                :alt="item.alt || ''"
                :style="index === currentIndex ? activeImageStyle : {}"
                loading="lazy"
                decoding="async"
                @click="handleImageClick"
                @dblclick="toggleZoom"
              />
            </div>
          </div>
        </div>

        <!-- Caption -->
        <div v-if="currentItem?.caption" class="lightbox-caption">{{ currentItem.caption }}</div>

        <!-- Navigation arrows (PC) -->
        <button
          v-if="hasMultiple && !isZoomed"
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
          v-if="hasMultiple && !isZoomed"
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
        <div v-if="hasMultiple && !isZoomed" class="lightbox-indicators">
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
const swipeAxis = ref<'pending' | 'horizontal' | 'vertical' | 'zoom'>('pending')

// Zoom state
const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
const lastPinchDist = ref(0)
const wasDragged = ref(false)
const movedCount = ref(0)

const isZoomed = computed(() => scale.value > 1.05)

const activeImageStyle = computed(() => ({
  transform: `translate3d(${panX.value}px, ${panY.value}px, 0) scale(${scale.value})`,
  transition: isDragging.value || swipeAxis.value === 'zoom' ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
  cursor: isZoomed.value ? (isDragging.value ? 'grabbing' : 'grab') : 'zoom-in',
  touchAction: 'none'
}))

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

function resetZoom() {
  scale.value = 1
  panX.value = 0
  panY.value = 0
  isDragging.value = false
  wasDragged.value = false
  movedCount.value = 0
}

function toggleZoom(e?: MouseEvent) {
  if (isZoomed.value) {
    resetZoom()
  } else {
    scale.value = 2.5
    // Optionally zoom towards mouse position
    if (e) {
      // Small refinement: centering zoom roughly could be done here if needed
    }
  }
}

function handleImageClick() {
  if (isZoomed.value && !wasDragged.value) {
    resetZoom()
  }
}

watch(
  () => [props.open, props.startIndex, normalizedItems.value.length] as const,
  ([open, startIndex, total]) => {
    if (!open || !total) {
      currentIndex.value = 0
      resetSwipe()
      resetZoom()
      return
    }
    currentIndex.value = clampIndex(startIndex, total)
    resetSwipe()
    resetZoom()
  },
  { immediate: true }
)

watch(currentIndex, resetZoom)

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
  if (!total) return 0
  return Math.min(Math.max(index, 0), total - 1)
}

function goTo(index: number) {
  if (isZoomed.value) return
  currentIndex.value = clampIndex(index)
  resetSwipe()
}

function handleMouseDown(e: MouseEvent) {
  if (!isZoomed.value) return
  e.preventDefault()
  isDragging.value = true
  wasDragged.value = false
  movedCount.value = 0
  swipeStartX.value = e.clientX
  swipeStartY.value = e.clientY
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  const dx = e.clientX - swipeStartX.value
  const dy = e.clientY - swipeStartY.value
  
  movedCount.value += Math.abs(dx) + Math.abs(dy)
  if (movedCount.value > 5) {
    wasDragged.value = true
  }

  panX.value += dx
  panY.value += dy
  swipeStartX.value = e.clientX
  swipeStartY.value = e.clientY
}

function handleMouseUp() {
  isDragging.value = false
}

function getPinchDist(t1: Touch, t2: Touch) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
}

function handleTouchStart(event: TouchEvent) {
  if (event.touches.length === 2) {
    const t1 = event.touches[0]
    const t2 = event.touches[1]
    if (t1 && t2) {
      swipeTracking.value = true
      swipeAxis.value = 'zoom'
      lastPinchDist.value = getPinchDist(t1, t2)
    }
    return
  }

  const touch = event.touches[0]
  if (!touch) return

  swipeStartX.value = touch.clientX
  swipeStartY.value = touch.clientY
  swipeDeltaX.value = 0
  swipeDeltaY.value = 0
  swipeTracking.value = true
  swipeAxis.value = isZoomed.value ? 'vertical' : 'pending'
  isDragging.value = isZoomed.value
  wasDragged.value = false
  movedCount.value = 0
}

function handleTouchMove(event: TouchEvent) {
  if (!swipeTracking.value) return

  if (swipeAxis.value === 'zoom' && event.touches.length === 2) {
    const t1 = event.touches[0]
    const t2 = event.touches[1]
    if (t1 && t2) {
      const dist = getPinchDist(t1, t2)
      const delta = dist / lastPinchDist.value
      scale.value = Math.min(Math.max(scale.value * delta, 1), 5)
      lastPinchDist.value = dist
      wasDragged.value = true // Pinch always counts as moved
    }
    return
  }

  const touch = event.touches[0]
  if (!touch) return
  const dx = touch.clientX - swipeStartX.value
  const dy = touch.clientY - swipeStartY.value

  if (isZoomed.value) {
    movedCount.value += Math.abs(dx) + Math.abs(dy)
    if (movedCount.value > 5) wasDragged.value = true
    
    panX.value += dx
    panY.value += dy
    swipeStartX.value = touch.clientX
    swipeStartY.value = touch.clientY
    return
  }

  swipeDeltaX.value = dx
  swipeDeltaY.value = dy

  if (swipeAxis.value === 'pending') {
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    if (absX < 10 && absY < 10) return
    swipeAxis.value = absX > absY ? 'horizontal' : 'vertical'
  }
}

function handleTouchEnd() {
  if (!swipeTracking.value) return
  isDragging.value = false

  if (swipeAxis.value === 'horizontal' && !isZoomed.value) {
    const threshold = 60
    if (swipeDeltaX.value <= -threshold) goTo(currentIndex.value + 1)
    else if (swipeDeltaX.value >= threshold) goTo(currentIndex.value - 1)
  }

  if (isZoomed.value && scale.value < 1.1) {
    resetZoom()
  }

  resetSwipe()
}

function handleWheel(event: WheelEvent) {
  if (!props.open) return
  event.preventDefault()
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.min(Math.max(scale.value * delta, 1), 5)
  if (newScale === 1) resetZoom()
  else scale.value = newScale
}

function resetSwipe() {
  swipeTracking.value = false
  swipeAxis.value = 'pending'
  swipeDeltaX.value = 0
  swipeDeltaY.value = 0
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (isZoomed.value) {
    if (event.key === 'r') resetZoom()
    return
  }
  if (!hasMultiple.value) return
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

/* ─── Reset Zoom ─── */
.lightbox-reset {
  position: absolute;
  bottom: clamp(1.5rem, 6vw, 2.5rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  height: 2.8rem;
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 999px;
  border: 0;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.lightbox-reset:hover {
  background: rgba(255, 255, 255, 0.24);
  transform: translateX(-50%) scale(1.05);
}

.lightbox-tip-key {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  opacity: 0.8;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

@media (max-width: 720px) {
  .lightbox-tip-key {
    display: none;
  }
  .lightbox-reset {
    padding: 0 1rem;
    height: 2.6rem;
  }
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
