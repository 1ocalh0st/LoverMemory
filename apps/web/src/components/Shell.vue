<template>
  <div class="shell">
    <aside class="shell-sidebar glass">
      <div class="brand-lockup">
        <div class="brand-badge">LM</div>
        <div>
          <div class="brand-title">{{ t('brand') }}</div>
          <div class="brand-subtitle">{{ session?.user?.displayName || session?.user?.email }}</div>
        </div>
      </div>

      <nav class="shell-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="shell-nav-item"
          :class="{ active: route.name === item.name }"
        >
          <span>{{ item.label }}</span>
          <small>{{ item.caption }}</small>
        </RouterLink>
      </nav>

      <div class="shell-sidebar-footer">
        <button class="button-secondary" @click="router.push({ name: 'settings' })">{{ t('nav.settings') }}</button>
        <button class="button-primary" @click="router.push({ name: 'timeline', query: { compose: '1' } })">
          {{ t('actions.addMemory') }}
        </button>
      </div>
    </aside>

    <div class="shell-main">
      <header class="shell-header glass">
        <div>
          <div class="shell-header-title">{{ t('brand') }}</div>
          <div class="shell-header-subtitle">{{ currentCaption }}</div>
        </div>
        <div class="shell-header-actions">
          <button class="button-secondary small" @click="router.push({ name: 'settings' })">{{ t('nav.settings') }}</button>
          <button class="button-secondary small" @click="logout">{{ t('actions.logout') }}</button>
        </div>
      </header>

      <main class="shell-content">
        <RouterView />
      </main>
    </div>

    <nav class="shell-mobile-nav glass">
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
import { computed, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { clearSessionCache, loadSession } from '@/lib/session'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const sessionQuery = useQuery({
  queryKey: ['session'],
  queryFn: () => loadSession(true)
})

const session = computed(() => sessionQuery.data.value)

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
  { name: 'home', label: t('nav.home'), caption: 'Overview' },
  { name: 'timeline', label: t('nav.timeline'), caption: 'Stories' },
  { name: 'gallery', label: t('nav.gallery'), caption: 'Photos' },
  { name: 'anniversaries', label: t('nav.anniversaries'), caption: 'Days' },
  { name: 'wishlist', label: t('nav.wishlist'), caption: 'Plans' }
])

const currentCaption = computed(() => navItems.value.find((item) => item.name === route.name)?.caption ?? '')

async function logout() {
  await api('/auth/session', { method: 'DELETE' })
  clearSessionCache()
  router.push({ name: 'auth' })
}
</script>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 310px minmax(0, 1fr);
  gap: 3rem;
  padding: 2rem;
  max-width: 1800px;
  margin: 0 auto;
}

.shell-sidebar {
  padding: 2rem;
  border-radius: var(--radius-xl);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 2.5rem;
  position: sticky;
  top: 2rem;
  height: calc(100vh - 4rem);
  background: var(--surface-container-low);
  box-shadow: none; /* No lines or hard shadows */
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.brand-badge {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-xl);
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary-fixed), var(--primary-container));
  color: var(--on-primary-container);
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
}

.brand-subtitle {
  color: var(--text-soft);
  font-size: 0.92rem;
  margin-top: 0.2rem;
}

.shell-nav {
  display: grid;
  gap: 0.8rem;
  align-content: start;
}

.shell-nav-item {
  padding: 1rem 1.4rem;
  border-radius: var(--radius-lg);
  color: var(--text-soft);
  display: grid;
  gap: 0.2rem;
  transition: all 0.2s ease;
  font-size: 1.1rem;
}

.shell-nav-item.active,
.shell-nav-item:hover {
  background: var(--surface-container-highest);
  color: var(--text);
  transform: translateX(4px);
}

.shell-nav-item small {
  opacity: 0.6;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.shell-sidebar-footer {
  display: grid;
  gap: 1rem;
}

.shell-main {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 2.5rem;
  padding-bottom: 3rem;
}

.shell-header {
  border-radius: var(--radius-xl);
  padding: 1.2rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-container-low);
}

.shell-header-title {
  font-size: 1.6rem;
  font-family: var(--font-display);
}

.shell-header-subtitle {
  color: var(--text-soft);
  margin-top: 0.2rem;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.shell-header-actions {
  display: flex;
  gap: 1rem;
}

.small {
  padding: 0.7rem 1.2rem;
  font-size: 0.95rem;
}

.shell-mobile-nav {
  display: none;
}

@media (max-width: 980px) {
  .shell {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1.5rem;
  }

  .shell-sidebar {
    display: none;
  }

  .shell-header {
    position: sticky;
    top: 1rem;
    z-index: 5;
    background: var(--bg-elevated);
    backdrop-filter: blur(12px);
  }

  .shell-mobile-nav {
    position: fixed;
    bottom: 1.5rem;
    left: 1.5rem;
    right: 1.5rem;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: var(--radius-xl);
    background: var(--bg-elevated);
    backdrop-filter: blur(12px);
    z-index: 30;
    box-shadow: var(--shadow-float);
  }

  .shell-mobile-link {
    text-align: center;
    padding: 0.75rem 0.2rem;
    font-size: 0.75rem;
    color: var(--text-soft);
    border-radius: var(--radius-lg);
    font-weight: 600;
  }

  .shell-mobile-link.active {
    background: var(--surface-container-highest);
    color: var(--text);
  }
}
</style>
