<template>
  <div class="shell" :class="{ 'sidebar-collapsed': sidebarCollapsed, 'immersive-gallery': isGalleryImmersive }">
    <aside v-if="!isGalleryImmersive" class="shell-sidebar glass">
      <div class="shell-sidebar-top">
        <span class="eyebrow">{{ t('brand') }}</span>
        <div class="brand-lockup">
          <div class="brand-mark">{{ userInitials }}</div>
          <div class="brand-text">
            <div class="brand-title">{{ session?.user?.displayName || 'Scrapbook' }}</div>
            <div class="brand-subtitle">{{ session?.user?.email }}</div>
          </div>
        </div>
        <p class="shell-sidebar-copy">
          一个温柔的共享空间，保存我们的照片、时间线、纪念日以及未来共同的计划。
        </p>
      </div>

      <nav class="shell-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="shell-nav-item"
          :class="{ active: route.name === item.name }"
        >
          <span class="shell-nav-label">{{ item.label }}</span>
          <small>{{ item.caption }}</small>
        </RouterLink>
      </nav>

      <div class="shell-sidebar-footer">
        <button class="button-secondary" @click="goToSettings">{{ t('nav.settings') }}</button>
        <button class="button-primary" @click="openComposer">{{ t('actions.addMemory') }}</button>
      </div>
    </aside>

    <div class="shell-main" :class="{ 'immersive-gallery-main': isGalleryImmersive }">
      <header v-if="!isGalleryImmersive" class="shell-header glass">
        <div class="shell-header-copy">
          <span class="eyebrow">{{ t('brand') }}</span>
          <div class="shell-header-block">
            <h1 class="shell-header-title">{{ currentPage?.label ?? t('brand') }}</h1>
            <p class="shell-header-subtitle">{{ currentPage?.caption ?? '' }}</p>
          </div>
        </div>

        <div class="shell-header-actions desktop-actions">
          <button class="button-icon" title="切换侧边栏" @click="sidebarCollapsed = !sidebarCollapsed">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
          <button class="button-secondary" @click="goToSettings">{{ t('nav.settings') }}</button>
          <button class="button-ghost" @click="logout">{{ t('actions.logout') }}</button>
        </div>

        <div class="shell-header-actions mobile-actions">
          <button class="button-icon mobile-add-memory" :aria-label="t('actions.addMemory')" @click="openComposer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
          </button>
          <button class="button-secondary mobile-settings" @click="goToSettings">{{ t('nav.settings') }}</button>
        </div>
      </header>

      <main class="shell-content" :class="{ 'immersive-gallery-content': isGalleryImmersive }">
        <RouterView />
      </main>
    </div>

    <nav v-if="!isGalleryImmersive" class="shell-mobile-nav glass">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="shell-mobile-link"
        :class="{ active: route.name === item.name }"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { clearSessionCache, loadSession } from '@/lib/session'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const sidebarCollapsed = ref(false)

const sessionQuery = useQuery({
  queryKey: ['session'],
  queryFn: () => loadSession(true)
})

const session = computed(() => sessionQuery.data.value)

const userInitials = computed(() => {
  const name = session.value?.user?.displayName || session.value?.user?.email || 'LM'
  return name.substring(0, 2).toUpperCase()
})

watch(
  session,
  (value) => {
    if (!value?.user) {
      return
    }
    locale.value = value.user.locale
    const preferredTheme = value.user.theme
    const resolvedTheme =
      preferredTheme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : preferredTheme
    document.documentElement.dataset.theme = resolvedTheme
  },
  { immediate: true }
)

const navItems = computed(() => [
  { name: 'home', label: t('nav.home'), caption: '所有概览' },
  { name: 'timeline', label: t('nav.timeline'), caption: '故事与回忆' },
  { name: 'gallery', label: t('nav.gallery'), caption: '相片' },
  { name: 'anniversaries', label: t('nav.anniversaries'), caption: '重要日子' },
  { name: 'wishlist', label: t('nav.wishlist'), caption: '未来计划' }
])

const pageMeta = computed(() => [
  ...navItems.value,
  { name: 'settings', label: t('nav.settings'), caption: '偏好设置' }
])

const currentPage = computed(() => pageMeta.value.find((item) => item.name === route.name))
const isGalleryImmersive = computed(() => route.name === 'gallery')

function goToSettings() {
  router.push({ name: 'settings' })
}

function openComposer() {
  router.push({ name: 'timeline', query: { compose: '1' } })
}

async function logout() {
  await api('/auth/session', { method: 'DELETE' })
  clearSessionCache()
  router.push({ name: 'auth' })
}
</script>

<style scoped>
.shell {
  min-height: 100vh;
  max-width: 1560px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: clamp(1rem, 2vw, 1.8rem);
  padding: var(--page-gutter);
}

.shell.immersive-gallery {
  max-width: none;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  padding: 0;
}

.shell.sidebar-collapsed {
  grid-template-columns: 1fr;
}

.shell.sidebar-collapsed .shell-sidebar {
  display: none;
}

.shell-sidebar {
  position: sticky;
  top: var(--page-gutter);
  height: calc(100vh - (var(--page-gutter) * 2));
  padding: 1.55rem;
  border-radius: var(--radius-xl);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  gap: 1.8rem;
}

.shell-sidebar-top {
  display: grid;
  gap: 1rem;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-mark {
  width: 64px;
  height: 64px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: #fff8f4;
  background:
    radial-gradient(circle at top right, rgba(255, 232, 223, 0.45), transparent 34%),
    linear-gradient(140deg, #a7656c 0%, #d59793 100%);
  box-shadow: var(--shadow-glow);
}

.brand-text {
  min-width: 0;
  display: grid;
  gap: 0.15rem;
}

.brand-title {
  font-size: clamp(1.6rem, 2.5vw, 2.1rem);
  line-height: 0.96;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-subtitle,
.shell-sidebar-copy {
  color: var(--text-soft);
}

.brand-subtitle {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shell-sidebar-copy {
  margin: 0;
  max-width: 17rem;
}

.shell-nav {
  display: grid;
  align-content: start;
  gap: 0.8rem;
  overflow-y: auto;
  min-height: 0;
  padding-right: 0.4rem;
  margin-right: -0.4rem;
}
.shell-nav::-webkit-scrollbar {
  width: 4px;
}
.shell-nav::-webkit-scrollbar-thumb {
  background: var(--outline-strong);
  border-radius: 4px;
}

.shell-nav-item {
  display: grid;
  gap: 0.22rem;
  padding: 1rem 1.15rem;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.42);
  box-shadow: inset 0 0 0 1px transparent;
  color: var(--text-soft);
  transition:
    transform 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
}

.shell-nav-item:hover,
.shell-nav-item.active {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 0 0 1px var(--outline);
  color: var(--text);
  transform: translateX(4px);
}

.shell-nav-label {
  font-weight: 800;
}

.shell-nav-item small {
  color: inherit;
  opacity: 0.72;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.shell-sidebar-footer {
  display: grid;
  gap: 0.85rem;
}

.shell-main {
  min-width: 0;
  display: grid;
  gap: 1.25rem;
  align-content: start;
  padding-bottom: 2rem;
}

.shell-main.immersive-gallery-main {
  gap: 0;
  min-height: 100vh;
  padding-bottom: 0;
}

.shell-header {
  position: sticky;
  top: var(--page-gutter);
  z-index: 20;
  padding: 1.15rem 1.3rem;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.shell-header-copy {
  min-width: 0;
  display: grid;
  gap: 0.8rem;
}

.shell-header-block {
  display: grid;
  gap: 0.35rem;
}

.shell-header-title {
  margin: 0;
  font-size: clamp(2rem, 3.4vw, 3.1rem);
  line-height: 0.92;
}

.shell-header-subtitle {
  margin: 0;
  color: var(--text-soft);
  max-width: 32rem;
}

.shell-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mobile-actions,
.shell-mobile-nav {
  display: none;
}

.shell-content {
  min-width: 0;
}

.shell-content.immersive-gallery-content {
  min-height: 100vh;
}

@media (max-width: 980px) {
  .shell {
    min-height: 100svh;
    grid-template-columns: 1fr;
    padding: clamp(0.75rem, 3vw, 1rem);
  }

  .shell.immersive-gallery {
    padding: 0;
  }

  .shell-sidebar {
    display: none;
  }

  .shell-main {
    padding-bottom: calc(var(--safe-bottom) + 7.8rem);
  }

  .shell-header {
    position: static;
    top: auto;
    padding: 1rem;
    align-items: flex-start;
  }

  .shell-header-title {
    font-size: clamp(2.1rem, 10vw, 2.9rem);
  }

  .desktop-actions {
    display: none;
  }

  .mobile-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .mobile-settings {
    min-height: 2.75rem;
    padding-inline: 1rem;
    font-size: 0.84rem;
  }

  .mobile-add-memory {
    width: 2.85rem;
    min-width: 2.85rem;
    min-height: 2.85rem;
    padding: 0;
    border-radius: 999px;
  }

  .shell-mobile-nav {
    position: fixed;
    left: 0.75rem;
    right: 0.75rem;
    bottom: 0.75rem;
    z-index: 40;
    padding: 0.5rem;
    border-radius: 28px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.4rem;
    transform: translateZ(0);
  }

  .shell-mobile-link {
    display: grid;
    place-items: center;
    min-height: 3.1rem;
    padding: 0.65rem 0.3rem;
    border-radius: 20px;
    color: var(--text-soft);
    font-size: 0.74rem;
    font-weight: 800;
    text-align: center;
    line-height: 1.2;
  }

  .shell-mobile-link.active {
    color: #fff8f4;
    background:
      radial-gradient(circle at top right, rgba(255, 225, 214, 0.54), transparent 35%),
      linear-gradient(135deg, #d39195 0%, #edb8aa 100%);
    box-shadow: var(--shadow-glow);
  }

}

@media (max-width: 640px) {
  .shell {
    gap: 0.9rem;
  }

  .shell-header {
    border-radius: 26px;
  }

  .shell-mobile-nav {
    left: 0.5rem;
    right: 0.5rem;
    bottom: 0.5rem;
  }
}
</style>
