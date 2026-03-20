<template>
  <div class="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
    <!-- Ambient Background Gradients -->
    <div class="fixed top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
    <div class="fixed bottom-[-10%] right-[10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[100px] pointer-events-none"></div>
    
    <div class="glass-card max-w-2xl w-full p-12 rounded-[2rem] relative z-10">
      <h1 class="text-4xl font-serif text-on-surface mb-4">Desktop View</h1>
      <p class="text-lg text-on-surface-variant mb-8">Experience the expansive curation of our memories.</p>
      
      <div class="grid grid-cols-2 gap-6 text-left">
        <div class="glass-panel p-6 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer">
           <h3 class="font-serif text-xl mb-2 text-on-surface">Timeline</h3>
           <p class="text-sm text-on-surface-variant">View all moments arranged chronologically.</p>
        </div>
        <div class="glass-panel p-6 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer">
           <h3 class="font-serif text-xl mb-2 text-on-surface">Gallery</h3>
           <p class="text-sm text-on-surface-variant">A visual spread of our favorite photos.</p>
        </div>
      </div>
      
      <div class="mt-12 pt-8 border-t border-outline-variant/30 text-on-surface-variant text-sm">
        Currently building Desktop Layout... (Resize browser to < 768px for mobile view)
      </div>
    </div>
  </div>
</template>

<script setup>
// Desktop specific logic
</script>
