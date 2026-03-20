<template>
  <div class="px-6 md:px-12 py-8 md:py-16 space-y-8 md:space-y-12">
    <!-- Desktop Header -->
    <header class="hidden md:block">
      <h2 class="text-4xl font-serif text-on-surface mb-2">{{ t('annivTitle') }}</h2>
      <p class="text-lg text-on-surface-variant">{{ t('annivSubtitle') }}</p>
    </header>

    <!-- Mobile Header -->
    <header class="md:hidden text-center pt-2">
      <h2 class="text-2xl font-serif text-on-surface mb-1">{{ t('annivTitle') }}</h2>
      <p class="text-sm text-on-surface-variant">{{ t('annivSubtitle') }}</p>
    </header>

    <!-- Hero: Days Together Counter -->
    <section class="glass-card rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden shadow-[0_12px_40px_rgba(135,78,88,0.12)]">
      <!-- Ambient decoration -->
      <div class="absolute top-[-40%] left-[-20%] w-[60%] h-[80%] rounded-full bg-primary/8 blur-[80px] pointer-events-none"></div>
      <div class="absolute bottom-[-30%] right-[-15%] w-[50%] h-[70%] rounded-full bg-secondary/6 blur-[60px] pointer-events-none"></div>

      <div class="relative z-10">
        <div class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6 border border-primary/15">
          <HeartIcon class="w-8 h-8 md:w-10 md:h-10" />
        </div>
        <p class="text-[13px] uppercase tracking-[0.2em] text-on-surface-variant font-medium mb-3">{{ t('annivDaysTogether') }}</p>
        <h1 class="text-6xl md:text-8xl font-serif text-primary mb-4 leading-none tracking-tight">{{ daysTogether }}</h1>
        <p class="text-sm md:text-base text-on-surface-variant max-w-md mx-auto leading-relaxed">{{ t('annivDaysTogetherDesc') }}</p>
      </div>
    </section>

    <!-- Next Milestone -->
    <section>
      <h3 class="text-2xl md:text-3xl font-serif text-on-surface mb-6 px-1">{{ t('annivNextMilestone') }}</h3>
      <div class="glass-card rounded-[1.5rem] p-6 md:p-8 flex items-center gap-6 hover:-translate-y-0.5 transition-transform duration-300 shadow-[0_8px_28px_rgba(135,78,88,0.08)]">
        <div class="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex flex-col items-center justify-center text-white shrink-0 shadow-lg">
          <span class="text-2xl md:text-3xl font-bold leading-none">{{ nextMilestone.daysLeft }}</span>
          <span class="text-[10px] uppercase tracking-wider opacity-80 mt-0.5">{{ t('annivDaysLeft') }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-lg md:text-xl font-semibold text-on-surface mb-1">{{ t(nextMilestone.titleKey) }}</h4>
          <p class="text-sm text-on-surface-variant">{{ t(nextMilestone.dateKey) }}</p>
        </div>
        <CalendarHeartIcon class="w-6 h-6 text-primary/40 shrink-0 hidden md:block" />
      </div>
    </section>

    <!-- Upcoming Anniversaries -->
    <section>
      <h3 class="text-2xl md:text-3xl font-serif text-on-surface mb-6 px-1">{{ t('annivUpcoming') }}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div 
          v-for="(item, index) in upcomingAnniversaries" 
          :key="index"
          class="glass-panel rounded-2xl p-5 md:p-6 flex items-center gap-5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
        >
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300"
            :class="iconBgs[index % iconBgs.length]">
            <component :is="icons[index % icons.length]" class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-base md:text-lg font-semibold text-on-surface truncate mb-0.5">{{ t(item.titleKey) }}</h4>
            <p class="text-sm text-on-surface-variant">{{ t(item.dateKey) }}</p>
          </div>
          <div class="text-xs text-primary font-semibold bg-primary/8 px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
            {{ item.daysLeft }} {{ t('annivDaysLeft') }}
          </div>
        </div>
      </div>
    </section>

    <!-- Past Highlights (Timeline) -->
    <section>
      <h3 class="text-2xl md:text-3xl font-serif text-on-surface mb-6 px-1">{{ t('annivPast') }}</h3>
      
      <div class="relative">
        <!-- Timeline Line -->
        <div class="absolute left-[19px] md:left-[23px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-primary/25 via-primary/10 to-transparent rounded-full"></div>
        
        <div class="space-y-6">
          <div 
            v-for="(item, index) in pastHighlights" 
            :key="index"
            class="flex gap-5 md:gap-6 items-start group"
          >
            <!-- Dot -->
            <div class="flex flex-col items-center shrink-0 pt-1">
              <div class="w-[10px] h-[10px] md:w-[12px] md:h-[12px] rounded-full border-[2.5px] border-primary bg-surface group-hover:bg-primary group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
            </div>

            <!-- Card -->
            <div class="flex-1 glass-panel rounded-2xl p-5 md:p-6 hover:bg-surface-container/50 transition-colors duration-300 cursor-pointer">
              <div class="flex items-start justify-between gap-3 mb-2">
                <h4 class="text-base md:text-lg font-semibold text-on-surface">{{ t(item.titleKey) }}</h4>
                <span class="text-xs text-on-surface-variant/60 font-medium shrink-0 whitespace-nowrap">{{ t(item.dateKey) }}</span>
              </div>
              <p class="text-sm text-on-surface-variant leading-relaxed">{{ t(item.descKey) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  HeartIcon, 
  CalendarHeartIcon, 
  GiftIcon, 
  SparklesIcon, 
  StarIcon 
} from 'lucide-vue-next'
import { useI18n } from '../i18n'

const { t } = useI18n()

// Calculate days since Oct 24, 2023
const startDate = new Date(2023, 9, 24)
const today = new Date()
const daysTogether = computed(() => {
  const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
  return diff.toLocaleString()
})

const nextMilestone = {
  titleKey: 'anniv1Title',
  dateKey: 'anniv1Date',
  daysLeft: computed(() => {
    const target = new Date(2026, 9, 24)
    return Math.max(0, Math.ceil((target - today) / (1000 * 60 * 60 * 24)))
  }).value,
}

const upcomingAnniversaries = [
  {
    titleKey: 'anniv3Title',
    dateKey: 'anniv3Date',
    daysLeft: computed(() => {
      const target = new Date(2026, 6, 20)
      return Math.max(0, Math.ceil((target - today) / (1000 * 60 * 60 * 24)))
    }).value,
  },
  {
    titleKey: 'anniv1Title',
    dateKey: 'anniv1Date',
    daysLeft: computed(() => {
      const target = new Date(2026, 9, 24)
      return Math.max(0, Math.ceil((target - today) / (1000 * 60 * 60 * 24)))
    }).value,
  },
  {
    titleKey: 'anniv2Title',
    dateKey: 'anniv2Date',
    daysLeft: computed(() => {
      const target = new Date(2026, 11, 25)
      return Math.max(0, Math.ceil((target - today) / (1000 * 60 * 60 * 24)))
    }).value,
  },
]

const pastHighlights = [
  { titleKey: 'past4Title', dateKey: 'past4Date', descKey: 'past4Desc' },
  { titleKey: 'past3Title', dateKey: 'past3Date', descKey: 'past3Desc' },
  { titleKey: 'past2Title', dateKey: 'past2Date', descKey: 'past2Desc' },
  { titleKey: 'past1Title', dateKey: 'past1Date', descKey: 'past1Desc' },
]

const icons = [SparklesIcon, GiftIcon, StarIcon]
const iconBgs = [
  'bg-primary/10 text-primary',
  'bg-amber-100 text-amber-600',
  'bg-violet-100 text-violet-600',
]
</script>
