<template>
  <div class="min-h-screen pb-20 relative overflow-hidden bg-surface">
    <!-- Ambient Background Gradients -->
    <div class="fixed top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[100px] pointer-events-none"></div>

    <!-- Header -->
    <header class="pt-16 pb-6 px-6 relative z-10 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-serif text-on-surface mb-1">Our Keepsake</h1>
        <p class="text-sm text-on-surface-variant font-medium tracking-wide">March 19th, 2026</p>
      </div>
      <div class="w-12 h-12 rounded-full overflow-hidden border border-white/40 shadow-sm">
        <img src="https://images.unsplash.com/photo-1518550697282-3e2b26002f26?w=150&h=150&fit=crop" alt="Profile" class="w-full h-full object-cover">
      </div>
    </header>

    <main class="px-6 space-y-8 relative z-10">
      
      <!-- Highlight Card (Hero) -->
      <section>
        <div class="glass-card rounded-[2rem] p-6 flex flex-col justify-end h-72 relative overflow-hidden group">
          <img src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&h=800&fit=crop" class="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-multiply brightness-110" alt="Memory">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
          
          <div class="relative z-10 text-white">
            <span class="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3 border border-white/30 text-white shadow-sm">Featured</span>
            <h2 class="text-2xl font-serif mb-2 leading-tight">Weekend in Kyoto</h2>
            <p class="text-sm text-white/90">A beautiful spring escape</p>
          </div>
        </div>
      </section>

      <!-- Quick Actions / Stats -->
      <section class="grid grid-cols-2 gap-4">
        <div class="glass-card rounded-2xl p-5 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
          <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <HeartIcon class="w-5 h-5"/>
          </div>
          <p class="text-xs text-on-surface-variant font-medium mb-1">Days Together</p>
          <p class="text-2xl font-serif text-on-surface">1,245</p>
        </div>
        <div class="glass-card rounded-2xl p-5 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
          <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <ImagePointerIcon class="w-5 h-5"/>
          </div>
          <p class="text-xs text-on-surface-variant font-medium mb-1">Memories captured</p>
          <p class="text-2xl font-serif text-on-surface">342</p>
        </div>
      </section>

      <!-- Recent Entries / Timeline Sneak Peek -->
      <section>
        <div class="flex justify-between items-end mb-4 px-1">
          <h3 class="text-xl font-serif text-on-surface">Recent Moments</h3>
          <button class="text-sm text-primary font-medium flex items-center gap-1 active:opacity-60 transition-opacity">
            View all <ChevronRightIcon class="w-4 h-4"/>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Item 1 -->
          <div class="glass-panel rounded-2xl p-4 flex gap-4 items-center">
             <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-outline-variant/20">
              <img src="https://images.unsplash.com/photo-1549468057-5abcfbe317bc?w=150&h=150&fit=crop" class="w-full h-full object-cover">
             </div>
             <div class="flex-1 min-w-0">
               <h4 class="text-base text-on-surface font-medium truncate mb-1">Coffee Date</h4>
               <p class="text-sm text-on-surface-variant line-clamp-2">Found a new quiet spot downtown today.</p>
             </div>
             <div class="text-xs text-on-surface-variant/70 shrink-0 font-medium whitespace-nowrap self-start mt-1">
               2 days ago
             </div>
          </div>
           <!-- Item 2 -->
           <div class="glass-panel rounded-2xl p-4 flex gap-4 items-center">
             <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-outline-variant/20">
              <img src="https://images.unsplash.com/photo-1520121401995-928cb5c4119c?w=150&h=150&fit=crop" class="w-full h-full object-cover">
             </div>
             <div class="flex-1 min-w-0">
               <h4 class="text-base text-on-surface font-medium truncate mb-1">Movie Night</h4>
               <p class="text-sm text-on-surface-variant line-clamp-2">Rewatched our favorite classic film.</p>
             </div>
             <div class="text-xs text-on-surface-variant/70 shrink-0 font-medium whitespace-nowrap self-start mt-1">
               1 week ago
             </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Floating Action Button -->
    <div class="fixed bottom-24 right-6 z-40">
      <button class="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dim text-white shadow-[0_8px_20px_rgba(135,78,88,0.3)] flex items-center justify-center transition-transform active:scale-95 border border-white/20" @click="createNew">
        <PlusIcon class="w-6 h-6"/>
      </button>
    </div>

    <!-- Bottom Navigation Bar -->
    <nav class="fixed bottom-0 w-full glass-nav pb-safe pt-2 px-6 z-30">
      <ul class="flex justify-between items-center h-16">
        <li class="flex-1 flex justify-center">
          <button class="flex flex-col items-center gap-1 p-2 text-primary" @click="$router.push('/')">
            <HomeIcon class="w-6 h-6" stroke-width="2"/>
            <span class="text-[10px] font-medium tracking-wide">Home</span>
          </button>
        </li>
        <li class="flex-1 flex justify-center">
          <button class="flex flex-col items-center gap-1 p-2 text-on-surface-variant hover:text-primary transition-colors delay-75" @click="$router.push('/records')">
            <BookOpenIcon class="w-6 h-6" stroke-width="2"/>
            <span class="text-[10px] font-medium tracking-wide">Records</span>
          </button>
        </li>
        <li class="flex-1 flex justify-center">
          <button class="flex flex-col items-center gap-1 p-2 text-on-surface-variant hover:text-primary transition-colors delay-75" @click="$router.push('/anniversaries')">
            <CalendarHeartIcon class="w-6 h-6" stroke-width="2"/>
            <span class="text-[10px] font-medium tracking-wide">Days</span>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { 
  HeartIcon, 
  ImageIcon as ImagePointerIcon, 
  ChevronRightIcon, 
  PlusIcon,
  HomeIcon,
  BookOpenIcon,
  CalendarHeartIcon
} from 'lucide-vue-next'

const createNew = () => {
  // Mock action
  alert('Open new record modal')
}
</script>
