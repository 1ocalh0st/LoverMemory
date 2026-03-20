<template>
  <div class="min-h-screen bg-surface flex flex-col md:flex-row relative overflow-hidden">
    <!-- Ambient Background Gradients for the whole app -->
    <div class="fixed top-[-20%] left-[-10%] md:left-[20%] w-[80%] md:w-[60%] h-[80%] md:h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0"></div>
    <div class="fixed bottom-[-10%] right-[-10%] md:right-[10%] w-[60%] md:w-[50%] h-[60%] md:h-[50%] rounded-full bg-secondary/5 blur-[100px] pointer-events-none z-0"></div>

    <!-- Desktop Sidebar Area -->
    <aside class="hidden md:flex flex-col w-72 lg:w-80 p-8 lg:p-10 shrink-0 border-r border-outline-variant/20 bg-surface/50 backdrop-blur-md relative z-10 sticky top-0 h-screen">
      <div class="flex flex-col items-center gap-4 mb-12">
          <div class="w-20 h-20 rounded-full overflow-hidden shadow-md ring-2 ring-primary/20 ring-offset-2 ring-offset-surface">
            <img src="/pictures/profile.jpg" alt="Profile" class="w-full h-full object-cover">
          </div>
          <div class="text-center">
            <h1 class="text-2xl font-serif text-on-surface">{{ t('appTitle') }}</h1>
            <p class="text-sm text-on-surface-variant font-medium tracking-wide">{{ t('appSubtitle') }}</p>
          </div>
      </div>

      <nav class="flex-1 flex flex-col gap-3 w-full">
        <router-link to="/" class="flex flex-col gap-1 px-4 py-3 rounded-2xl transition-all" :class="$route.path === '/' ? 'bg-primary/10 text-primary shadow-sm' : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'">
          <div class="flex items-center gap-3 font-medium text-[15px]">
            <HomeIcon class="w-5 h-5"/> {{ t('navOverview') }}
          </div>
        </router-link>
        <router-link to="/records" class="flex flex-col gap-1 px-4 py-3 rounded-2xl transition-all" :class="$route.path.startsWith('/records') ? 'bg-primary/10 text-primary shadow-sm' : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'">
          <div class="flex items-center gap-3 font-medium text-[15px]">
            <BookOpenIcon class="w-5 h-5"/> {{ t('navMoments') }}
          </div>
        </router-link>
        <router-link to="/anniversaries" class="flex flex-col gap-1 px-4 py-3 rounded-2xl transition-all" :class="$route.path.startsWith('/anniversaries') ? 'bg-primary/10 text-primary shadow-sm' : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'">
          <div class="flex items-center gap-3 font-medium text-[15px]">
            <CalendarHeartIcon class="w-5 h-5"/> {{ t('navAnniversaries') }}
          </div>
        </router-link>
      </nav>

      <!-- Language Toggle -->
      <button 
        @click="toggleLocale"
        class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-sm font-medium text-on-surface-variant mb-4 w-full"
      >
        <GlobeIcon class="w-4 h-4" />
        {{ t('langSwitch') }}
      </button>
      
      <div class="w-full">
        <button @click="$router.push('/new-memory')" class="btn-primary w-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
          <PlusIcon class="w-5 h-5"/> {{ t('newMemory') }}
        </button>
      </div>
    </aside>

    <!-- Main Router View Content -->
    <main class="flex-1 w-full min-h-screen relative z-10 pb-24 md:pb-0 overflow-x-hidden">
      <!-- Dynamic View Injection -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Mobile Navigation Bar -->
    <nav class="fixed bottom-0 w-full glass-nav pb-safe pt-2 px-6 z-40 md:hidden bg-surface/80 backdrop-blur-xl border-t border-outline-variant/30 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
      <ul class="flex justify-between items-center h-16 max-w-sm mx-auto">
        <li class="flex-1 flex justify-center">
          <router-link to="/" class="flex flex-col items-center gap-1 p-2 transition-colors nav-link" :class="$route.path === '/' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'">
            <HomeIcon class="w-6 h-6" :stroke-width="$route.path === '/' ? 2.5 : 2"/>
            <span class="text-[10px] font-medium tracking-wide">{{ t('navHome') }}</span>
          </router-link>
        </li>
        <li class="flex-1 flex justify-center">
          <router-link to="/records" class="flex flex-col items-center gap-1 p-2 transition-colors nav-link" :class="$route.path.startsWith('/records') ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'">
            <BookOpenIcon class="w-6 h-6" :stroke-width="$route.path.startsWith('/records') ? 2.5 : 2"/>
            <span class="text-[10px] font-medium tracking-wide">{{ t('navRecords') }}</span>
          </router-link>
        </li>
        <li class="flex-1 flex justify-center">
          <router-link to="/anniversaries" class="flex flex-col items-center gap-1 p-2 transition-colors nav-link" :class="$route.path.startsWith('/anniversaries') ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'">
            <CalendarHeartIcon class="w-6 h-6" :stroke-width="$route.path.startsWith('/anniversaries') ? 2.5 : 2"/>
            <span class="text-[10px] font-medium tracking-wide">{{ t('navDays') }}</span>
          </router-link>
        </li>
        <li class="flex-1 flex justify-center">
          <button @click="toggleLocale" class="flex flex-col items-center gap-1 p-2 transition-colors text-on-surface-variant hover:text-on-surface">
            <GlobeIcon class="w-6 h-6" :stroke-width="2"/>
            <span class="text-[10px] font-medium tracking-wide">{{ t('langSwitch') }}</span>
          </button>
        </li>
      </ul>
    </nav>
    
    <!-- Mobile Global FAB -->
    <div class="fixed bottom-24 right-6 z-40 md:hidden">
      <button @click="$router.push('/new-memory')" class="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-primary to-primary-dim text-white shadow-[0_8px_20px_rgba(135,78,88,0.3)] flex items-center justify-center transition-transform active:scale-95 border border-white/20">
        <PlusIcon class="w-7 h-7"/>
      </button>
    </div>
  </div>
</template>

<script setup>
import { 
  HomeIcon,
  BookOpenIcon,
  CalendarHeartIcon,
  PlusIcon,
  GlobeIcon
} from 'lucide-vue-next'
import { useI18n } from '../i18n'

const { t, toggleLocale } = useI18n()
</script>


