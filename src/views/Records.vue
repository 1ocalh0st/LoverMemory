<template>
  <div class="px-6 md:px-12 py-8 md:py-16 space-y-8 md:space-y-12">
    <!-- Desktop Header -->
    <header class="hidden md:block">
      <h2 class="text-4xl font-serif text-on-surface mb-2">{{ t('recordsTitle') }}</h2>
      <p class="text-lg text-on-surface-variant">{{ t('recordsSubtitle') }}</p>
    </header>

    <!-- Mobile Header -->
    <header class="md:hidden text-center pt-2">
      <h2 class="text-2xl font-serif text-on-surface mb-1">{{ t('recordsTitle') }}</h2>
      <p class="text-sm text-on-surface-variant">{{ t('recordsSubtitle') }}</p>
    </header>

    <!-- Search Bar -->
    <div class="relative max-w-xl mx-auto md:mx-0">
      <SearchIcon class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
      <input 
        type="text" 
        :placeholder="t('searchPlaceholder')" 
        v-model="searchQuery"
        class="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-surface-container-low/80 backdrop-blur-sm border-[0.5px] border-outline-variant/15 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/80 transition-all duration-300 text-[15px]"
      />
    </div>

    <!-- Filter Tags -->
    <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
      <button 
        v-for="filter in filters" 
        :key="filter.key"
        @click="activeFilter = filter.key"
        class="shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap"
        :class="activeFilter === filter.key 
          ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(135,78,88,0.25)]' 
          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'"
      >
        {{ t(filter.label) }}
      </button>
    </div>

    <!-- Timeline -->
    <div class="relative">
      <!-- Timeline Line (Desktop) -->
      <div class="hidden md:block absolute left-[27px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary/30 via-primary/15 to-transparent rounded-full"></div>

      <div class="space-y-5 md:space-y-8">
        <template v-for="(moment, index) in filteredMoments" :key="index">
          <div class="flex gap-5 md:gap-8 items-start group">
            <!-- Timeline Dot (Desktop) -->
            <div class="hidden md:flex flex-col items-center shrink-0">
              <div class="w-[14px] h-[14px] rounded-full border-[3px] border-primary bg-surface group-hover:bg-primary group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
            </div>

            <!-- Card -->
            <div class="flex-1 glass-panel rounded-[1.5rem] overflow-hidden hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group/card">
              <!-- Image -->
              <div v-if="moment.image" class="relative h-48 md:h-56 overflow-hidden">
                <img 
                  :src="moment.image" 
                  :alt="t(moment.titleKey)"
                  class="w-full h-full object-cover group-hover/card:scale-[1.03] transition-transform duration-[1.5s] ease-out"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <span class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border border-white/25 shadow-sm"
                  :class="getTagColor(moment.tagKey)">
                  {{ t(moment.tagKey) }}
                </span>
                <div class="absolute bottom-4 left-5 text-white">
                  <p class="text-xs font-medium opacity-80">{{ t(moment.dateKey) }}</p>
                </div>
              </div>

              <!-- Content -->
              <div class="p-5 md:p-6">
                <div class="flex items-start justify-between gap-4 mb-2">
                  <h3 class="text-lg md:text-xl font-semibold text-on-surface leading-snug">{{ t(moment.titleKey) }}</h3>
                  <span v-if="!moment.image" class="shrink-0 px-3 py-1 rounded-full text-xs font-semibold"
                    :class="getTagColorSolid(moment.tagKey)">
                    {{ t(moment.tagKey) }}
                  </span>
                </div>
                <p class="text-sm md:text-[15px] text-on-surface-variant leading-relaxed line-clamp-2">{{ t(moment.descKey) }}</p>
                <p v-if="!moment.image" class="text-xs text-on-surface-variant/60 mt-3 font-medium">{{ t(moment.dateKey) }}</p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { SearchIcon } from 'lucide-vue-next'
import { useI18n } from '../i18n'

const { t } = useI18n()

const searchQuery = ref('')
const activeFilter = ref('all')

const filters = [
  { key: 'all', label: 'filterAll' },
  { key: 'date', label: 'filterDate' },
  { key: 'travel', label: 'filterTravel' },
  { key: 'food', label: 'filterFood' },
  { key: 'movie', label: 'filterMovie' },
]

const moments = [
  {
    titleKey: 'moment1Title',
    descKey: 'moment1Desc',
    dateKey: 'moment1Date',
    tagKey: 'moment1Tag',
    filterKey: 'food',
    image: '/pictures/coffee.jpg',
  },
  {
    titleKey: 'moment2Title',
    descKey: 'moment2Desc',
    dateKey: 'moment2Date',
    tagKey: 'moment2Tag',
    filterKey: 'movie',
    image: '/pictures/电影.jpg',
  },
  {
    titleKey: 'moment3Title',
    descKey: 'moment3Desc',
    dateKey: 'moment3Date',
    tagKey: 'moment3Tag',
    filterKey: 'travel',
    image: null,
  },
  {
    titleKey: 'moment4Title',
    descKey: 'moment4Desc',
    dateKey: 'moment4Date',
    tagKey: 'moment4Tag',
    filterKey: 'food',
    image: null,
  },
  {
    titleKey: 'moment5Title',
    descKey: 'moment5Desc',
    dateKey: 'moment5Date',
    tagKey: 'moment5Tag',
    filterKey: 'travel',
    image: '/pictures/fujimountain.jpg',
  },
  {
    titleKey: 'moment6Title',
    descKey: 'moment6Desc',
    dateKey: 'moment6Date',
    tagKey: 'moment6Tag',
    filterKey: 'date',
    image: null,
  },
]

const filteredMoments = computed(() => {
  let result = moments
  if (activeFilter.value !== 'all') {
    result = result.filter(m => m.filterKey === activeFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(m => 
      t(m.titleKey).toLowerCase().includes(q) || 
      t(m.descKey).toLowerCase().includes(q)
    )
  }
  return result
})

function getTagColor(tagKey) {
  const tag = t(tagKey)
  const colors = {
    Food: 'bg-amber-500/20 text-amber-100',
    Travel: 'bg-emerald-500/20 text-emerald-100',
    Movie: 'bg-violet-500/20 text-violet-100',
    Date: 'bg-rose-500/20 text-rose-100',
    '美食': 'bg-amber-500/20 text-amber-100',
    '旅行': 'bg-emerald-500/20 text-emerald-100',
    '电影': 'bg-violet-500/20 text-violet-100',
    '约会': 'bg-rose-500/20 text-rose-100',
  }
  return colors[tag] || 'bg-white/20 text-white'
}

function getTagColorSolid(tagKey) {
  const tag = t(tagKey)
  const colors = {
    Food: 'bg-amber-100 text-amber-700',
    Travel: 'bg-emerald-100 text-emerald-700',
    Movie: 'bg-violet-100 text-violet-700',
    Date: 'bg-rose-100 text-rose-700',
    '美食': 'bg-amber-100 text-amber-700',
    '旅行': 'bg-emerald-100 text-emerald-700',
    '电影': 'bg-violet-100 text-violet-700',
    '约会': 'bg-rose-100 text-rose-700',
  }
  return colors[tag] || 'bg-surface-container text-on-surface-variant'
}
</script>
