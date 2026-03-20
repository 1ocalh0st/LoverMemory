<template>
  <div class="px-6 md:px-12 py-8 md:py-16 space-y-12">
    <!-- Desktop Header Title -->
    <header class="hidden md:block">
      <h2 class="text-4xl font-serif text-on-surface mb-2">{{ t('greeting') }}</h2>
      <p class="text-lg text-on-surface-variant">{{ t('greetingSub') }}</p>
    </header>

    <!-- Highlight Card (Hero) -->
    <section>
      <div class="glass-card rounded-[2rem] p-6 flex flex-col justify-end h-80 md:h-[400px] relative overflow-hidden group shadow-[0_12px_40px_rgba(135,78,88,0.12)]">
        <img src="/pictures/fujimountain.jpg" class="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-multiply brightness-110 group-hover:scale-[1.03] transition-transform duration-[1.5s] ease-out" alt="Memory">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        
        <div class="relative z-10 text-white md:p-4">
          <span class="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide mb-3 border border-white/20 text-white shadow-sm">{{ t('featuredMoment') }}</span>
          <h2 class="text-3xl md:text-5xl font-serif mb-2 leading-tight">Fuji Mountain</h2>
          <p class="text-sm md:text-lg text-white/90">A beautiful spring escape filled with cherry blossoms.</p>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Quick Actions / Stats -->
      <section class="grid grid-cols-2 md:grid-cols-1 gap-6 md:col-span-1">
        <div class="glass-card rounded-[1.5rem] p-6 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
          <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5">
            <HeartIcon class="w-6 h-6"/>
          </div>
          <p class="text-[13px] uppercase tracking-wider text-on-surface-variant font-medium mb-1">{{ t('daysTogether') }}</p>
          <p class="text-3xl font-serif text-on-surface">1,245</p>
        </div>
        <div class="glass-card rounded-[1.5rem] p-6 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
          <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5">
            <ImagePointerIcon class="w-6 h-6"/>
          </div>
          <p class="text-[13px] uppercase tracking-wider text-on-surface-variant font-medium mb-1">{{ t('memoriesCaptured') }}</p>
          <p class="text-3xl font-serif text-on-surface">342</p>
        </div>
      </section>

      <!-- Recent Entries -->
      <section class="md:col-span-2">
        <div class="flex justify-between items-end mb-6 px-1">
          <h3 class="text-2xl md:text-3xl font-serif text-on-surface">{{ t('recentTimeline') }}</h3>
          <router-link to="/records" class="text-sm text-primary font-medium flex items-center gap-1 hover:opacity-70 transition-opacity">
            {{ t('viewAll') }} <ChevronRightIcon class="w-4 h-4"/>
          </router-link>
        </div>

        <div class="space-y-4">
          <!-- Item 1 -->
          <div class="glass-panel rounded-2xl p-5 flex gap-5 md:gap-6 items-center hover:bg-surface-container/60 transition-colors cursor-pointer group">
            <div class="w-16 h-16 md:w-20 md:h-20 rounded-[1.25rem] overflow-hidden shrink-0 shadow-sm border border-outline-variant/20 relative">
              <img src="/pictures/coffee.jpg" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1s] ease-out">
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-base md:text-xl text-on-surface font-semibold truncate mb-1 md:mb-2">{{ t('coffeeDateTitle') }}</h4>
              <p class="text-sm md:text-[15px] text-on-surface-variant line-clamp-2 md:leading-relaxed">{{ t('coffeeDateDesc') }}</p>
            </div>
            <div class="text-xs md:text-sm text-on-surface-variant/70 shrink-0 font-medium whitespace-nowrap self-start mt-1">
              {{ t('daysAgo') }}
            </div>
          </div>
          <!-- Item 2 -->
           <div class="glass-panel rounded-2xl p-5 flex gap-5 md:gap-6 items-center hover:bg-surface-container/60 transition-colors cursor-pointer group">
            <div class="w-16 h-16 md:w-20 md:h-20 rounded-[1.25rem] overflow-hidden shrink-0 shadow-sm border border-outline-variant/20 relative">
              <img src="/pictures/电影.jpg" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1s] ease-out">
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-base md:text-xl text-on-surface font-semibold truncate mb-1 md:mb-2">{{ t('movieNightTitle') }}</h4>
              <p class="text-sm md:text-[15px] text-on-surface-variant line-clamp-2 md:leading-relaxed">{{ t('movieNightDesc') }}</p>
            </div>
            <div class="text-xs md:text-sm text-on-surface-variant/70 shrink-0 font-medium whitespace-nowrap self-start mt-1">
              {{ t('weekAgo') }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { 
  HeartIcon, 
  ImageIcon as ImagePointerIcon, 
  ChevronRightIcon
} from 'lucide-vue-next'
import { useI18n } from '../i18n'

const { t } = useI18n()
</script>
