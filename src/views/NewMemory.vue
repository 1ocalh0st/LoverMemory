<template>
  <div class="px-6 md:px-12 py-8 md:py-16 space-y-8 md:space-y-10">
    <!-- Desktop Header -->
    <header class="hidden md:flex items-center justify-between">
      <div>
        <h2 class="text-4xl font-serif text-on-surface mb-2">{{ t('newMemoryTitle') }}</h2>
        <p class="text-lg text-on-surface-variant">{{ t('newMemorySubtitle') }}</p>
      </div>
      <button 
        @click="$router.back()" 
        class="text-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5"
      >
        <XIcon class="w-5 h-5" />
      </button>
    </header>

    <!-- Mobile Header -->
    <header class="md:hidden flex items-center justify-between pt-2">
      <button @click="$router.back()" class="text-on-surface-variant hover:text-on-surface transition-colors">
        <ArrowLeftIcon class="w-5 h-5" />
      </button>
      <h2 class="text-lg font-serif text-on-surface">{{ t('newMemoryTitle') }}</h2>
      <div class="w-5"></div>
    </header>

    <div class="max-w-2xl mx-auto space-y-6 md:space-y-8">
      <!-- Cover Photo Upload -->
      <section class="glass-card rounded-[2rem] overflow-hidden shadow-[0_8px_28px_rgba(135,78,88,0.08)]">
        <div class="p-5 md:p-6 border-b border-outline-variant/10">
          <p class="text-[13px] uppercase tracking-[0.15em] text-on-surface-variant font-medium mb-1">{{ t('newMemoryCoverPhoto') }}</p>
          <p class="text-xs text-on-surface-variant/60">{{ t('newMemoryCoverHint') }}</p>
        </div>
        <div 
          class="h-56 md:h-72 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low/60 transition-colors duration-300 group relative"
          :class="coverPreview ? '' : 'bg-surface-container-low/30'"
        >
          <template v-if="!coverPreview">
            <div class="w-16 h-16 rounded-full bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors duration-300">
              <CameraIcon class="w-7 h-7 text-primary/60 group-hover:text-primary transition-colors duration-300" />
            </div>
            <p class="text-sm text-on-surface-variant/60 font-medium">{{ t('newMemoryTapToAdd') }}</p>
          </template>
          <template v-else>
            <img :src="coverPreview" class="w-full h-full object-cover" />
          </template>
        </div>
      </section>

      <!-- Form Fields -->
      <section class="glass-card rounded-[2rem] p-6 md:p-8 space-y-6 shadow-[0_8px_28px_rgba(135,78,88,0.08)]">
        <!-- Title -->
        <div class="space-y-2">
          <label class="text-[13px] uppercase tracking-[0.15em] text-on-surface-variant font-medium flex items-center gap-2">
            <TypeIcon class="w-4 h-4 text-primary/50" />
            {{ t('newMemoryTitleLabel') }}
          </label>
          <input 
            type="text" 
            v-model="form.title"
            :placeholder="t('newMemoryTitlePlaceholder')"
            class="w-full px-4 py-3.5 rounded-xl bg-surface-container-low/60 border-[0.5px] border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/80 transition-all duration-300 text-[15px]"
          />
        </div>

        <!-- Date -->
        <div class="space-y-2">
          <label class="text-[13px] uppercase tracking-[0.15em] text-on-surface-variant font-medium flex items-center gap-2">
            <CalendarIcon class="w-4 h-4 text-primary/50" />
            {{ t('newMemoryDateLabel') }}
          </label>
          <input 
            type="date" 
            v-model="form.date"
            class="w-full px-4 py-3.5 rounded-xl bg-surface-container-low/60 border-[0.5px] border-outline-variant/10 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/80 transition-all duration-300 text-[15px]"
          />
        </div>

        <!-- Tag -->
        <div class="space-y-2">
          <label class="text-[13px] uppercase tracking-[0.15em] text-on-surface-variant font-medium flex items-center gap-2">
            <TagIcon class="w-4 h-4 text-primary/50" />
            {{ t('newMemoryTagLabel') }}
          </label>
          <div class="flex gap-2.5 flex-wrap">
            <button 
              v-for="tag in tags" 
              :key="tag.value"
              @click="form.tag = tag.value"
              class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
              :class="form.tag === tag.value 
                ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(135,78,88,0.25)]' 
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'"
            >
              {{ tag.icon }} {{ tag.label }}
            </button>
          </div>
        </div>

        <!-- Story Content -->
        <div class="space-y-2">
          <label class="text-[13px] uppercase tracking-[0.15em] text-on-surface-variant font-medium flex items-center gap-2">
            <PenLineIcon class="w-4 h-4 text-primary/50" />
            {{ t('newMemoryContentLabel') }}
          </label>
          <textarea 
            v-model="form.content"
            :placeholder="t('newMemoryContentPlaceholder')"
            rows="5"
            class="w-full px-4 py-3.5 rounded-xl bg-surface-container-low/60 border-[0.5px] border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/80 transition-all duration-300 text-[15px] resize-none leading-relaxed"
          ></textarea>
        </div>

        <!-- Mood Selection -->
        <div class="space-y-2">
          <label class="text-[13px] uppercase tracking-[0.15em] text-on-surface-variant font-medium flex items-center gap-2">
            <SmileIcon class="w-4 h-4 text-primary/50" />
            {{ t('newMemoryMoodLabel') }}
          </label>
          <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            <button 
              v-for="mood in moods" 
              :key="mood.value"
              @click="form.mood = mood.value"
              class="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all duration-300 shrink-0 min-w-[72px]"
              :class="form.mood === mood.value 
                ? 'bg-primary/10 ring-2 ring-primary/25 shadow-sm' 
                : 'hover:bg-surface-container-low'"
            >
              <span class="text-2xl">{{ mood.emoji }}</span>
              <span class="text-[11px] font-medium" :class="form.mood === mood.value ? 'text-primary' : 'text-on-surface-variant'">
                {{ t(mood.labelKey) }}
              </span>
            </button>
          </div>
        </div>

        <!-- Location -->
        <div class="space-y-2">
          <label class="text-[13px] uppercase tracking-[0.15em] text-on-surface-variant font-medium flex items-center gap-2">
            <MapPinIcon class="w-4 h-4 text-primary/50" />
            {{ t('newMemoryLocationLabel') }}
          </label>
          <input 
            type="text" 
            v-model="form.location"
            :placeholder="t('newMemoryLocationPlaceholder')"
            class="w-full px-4 py-3.5 rounded-xl bg-surface-container-low/60 border-[0.5px] border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/80 transition-all duration-300 text-[15px]"
          />
        </div>
      </section>

      <!-- Action Buttons -->
      <section class="flex flex-col md:flex-row gap-3 md:gap-4 pb-8">
        <button class="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base shadow-lg hover:shadow-xl transition-shadow">
          <HeartIcon class="w-5 h-5" />
          {{ t('newMemorySave') }}
        </button>
        <button 
          @click="$router.back()"
          class="btn-secondary flex-1 flex items-center justify-center gap-2 py-4 text-base md:flex-none md:px-8"
        >
          {{ t('newMemoryCancel') }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import {
  ArrowLeftIcon,
  XIcon,
  CameraIcon,
  TypeIcon,
  CalendarIcon,
  TagIcon,
  PenLineIcon,
  SmileIcon,
  MapPinIcon,
  HeartIcon,
} from 'lucide-vue-next'
import { useI18n } from '../i18n'

const { t } = useI18n()

const coverPreview = ref(null)

const form = reactive({
  title: '',
  date: '',
  tag: '',
  content: '',
  mood: '',
  location: '',
})

const tags = [
  { value: 'date', label: '💑 Date', icon: '' },
  { value: 'travel', label: '✈️ Travel', icon: '' },
  { value: 'food', label: '🍽️ Food', icon: '' },
  { value: 'movie', label: '🎬 Movie', icon: '' },
  { value: 'other', label: '✨ Other', icon: '' },
]

const moods = [
  { value: 'happy', emoji: '😊', labelKey: 'newMemoryMoodHappy' },
  { value: 'romantic', emoji: '🥰', labelKey: 'newMemoryMoodRomantic' },
  { value: 'peaceful', emoji: '😌', labelKey: 'newMemoryMoodPeaceful' },
  { value: 'excited', emoji: '🤩', labelKey: 'newMemoryMoodExcited' },
  { value: 'nostalgic', emoji: '🥹', labelKey: 'newMemoryMoodNostalgic' },
]
</script>
