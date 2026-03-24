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
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 1.25rem;
  padding: 1.25rem;
}

.shell-sidebar {
  padding: 1.2rem;
  border-radius: 34px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1.5rem;
  position: sticky;
  top: 1.25rem;
  height: calc(100vh - 2.5rem);
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.brand-badge {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(242, 109, 79, 0.28), rgba(82, 121, 255, 0.22));
  font-weight: 700;
  letter-spacing: -0.04em;
}

.brand-title {
  font-size: 1.15rem;
  font-weight: 700;
}

.brand-subtitle {
  color: var(--text-soft);
  font-size: 0.92rem;
  margin-top: 0.2rem;
}

.shell-nav {
  display: grid;
  gap: 0.5rem;
  align-content: start;
}

.shell-nav-item {
  padding: 0.9rem 1rem;
  border-radius: 20px;
  color: var(--text-soft);
  display: grid;
  gap: 0.15rem;
  transition: transform 180ms ease, background 180ms ease, color 180ms ease;
}

.shell-nav-item.active,
.shell-nav-item:hover {
  background: rgba(255, 255, 255, 0.28);
  color: var(--text);
  transform: translateY(-1px);
}

.shell-nav-item small {
  opacity: 0.7;
}

.shell-sidebar-footer {
  display: grid;
  gap: 0.75rem;
}

.shell-main {
  min-width: 0;
  display: grid;
  gap: 1rem;
}

.shell-header {
  border-radius: 30px;
  padding: 1rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shell-header-title {
  font-size: 1.2rem;
  font-weight: 700;
}

.shell-header-subtitle {
  color: var(--text-soft);
  margin-top: 0.2rem;
}

.shell-header-actions {
  display: flex;
  gap: 0.75rem;
}

.shell-content {
  min-width: 0;
  padding-bottom: 5rem;
}

.small {
  padding: 0.7rem 1rem;
}

.shell-mobile-nav {
  display: none;
}

@media (max-width: 980px) {
  .shell {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .shell-sidebar {
    display: none;
  }

  .shell-header {
    position: sticky;
    top: 1rem;
    z-index: 5;
  }

  .shell-mobile-nav {
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.4rem;
    padding: 0.5rem;
    border-radius: 999px;
    z-index: 30;
  }

  .shell-mobile-link {
    text-align: center;
    padding: 0.75rem 0.4rem;
    font-size: 0.78rem;
    color: var(--text-soft);
    border-radius: 999px;
  }

  .shell-mobile-link.active {
    background: rgba(255, 255, 255, 0.22);
    color: var(--text);
  }
}

@media (max-width: 720px) {
  .shell-header {
    align-items: flex-start;
    gap: 0.8rem;
    flex-direction: column;
  }
}
</style>
