<template>
  <div class="page">
    <header class="editorial-header">
      <h1 class="display-lg">{{ t('settings.title') }}</h1>
      <p class="body-lg">Persist language, theme, time format, timezone, and push subscriptions to your private account.</p>
    </header>

    <section class="section-card settings-grid">
      <label>
        <span class="settings-label">{{ t('settings.locale') }}</span>
        <select v-model="form.locale" class="select ledger-style">
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </label>

      <label>
        <span class="settings-label">{{ t('settings.theme') }}</span>
        <select v-model="form.theme" class="select ledger-style">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>

      <label>
        <span class="settings-label">{{ t('settings.timeFormat') }}</span>
        <select v-model="form.timeFormat" class="select ledger-style">
          <option value="24h">24h</option>
          <option value="12h">12h</option>
        </select>
      </label>

      <label>
        <span class="settings-label">{{ t('settings.timezone') }}</span>
        <input v-model="form.timezone" class="field ledger-style" />
      </label>

      <div class="settings-actions">
        <button class="button-primary" :disabled="saving" @click="save">{{ t('actions.save') }}</button>
        <button class="button-secondary" :disabled="pushBusy" @click="togglePush">{{ pushLabel }}</button>
      </div>
    </section>

    <p v-if="message" class="feedback">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api, ApiError } from '@/lib/api'
import { clearSessionCache, loadSession } from '@/lib/session'

const { t, locale } = useI18n()
const saving = ref(false)
const pushBusy = ref(false)
const message = ref('')
const pushSubscribed = ref(false)

const sessionQuery = useQuery({
  queryKey: ['session'],
  queryFn: () => loadSession(true)
})

const form = ref({
  locale: 'en',
  theme: 'system',
  timeFormat: '24h',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
})

watchEffect(() => {
  const user = sessionQuery.data.value?.user
  if (!user) return
  form.value = {
    locale: user.locale,
    theme: user.theme,
    timeFormat: user.timeFormat,
    timezone: user.timezone
  }
  locale.value = user.locale
  document.documentElement.dataset.theme =
    user.theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : user.theme
})

onMounted(async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  const registration = await navigator.serviceWorker.ready
  pushSubscribed.value = Boolean(await registration.pushManager.getSubscription())
})

async function save() {
  saving.value = true
  message.value = ''
  try {
    await api('/settings/preferences', {
      method: 'PATCH',
      body: JSON.stringify(form.value)
    })
    clearSessionCache()
    await sessionQuery.refetch()
    locale.value = form.value.locale
    document.documentElement.dataset.theme =
      form.value.theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : form.value.theme
    message.value = 'Preferences saved'
  } catch (cause) {
    message.value = cause instanceof ApiError ? cause.message : 'Unable to save settings'
  } finally {
    saving.value = false
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

async function togglePush() {
  pushBusy.value = true
  message.value = ''
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push is not supported in this browser')
    }

    const session = await loadSession(true)
    const registration = await navigator.serviceWorker.ready
    const current = await registration.pushManager.getSubscription()

    if (current) {
      await api('/notifications/subscriptions', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: current.endpoint })
      })
      await current.unsubscribe()
      pushSubscribed.value = false
      message.value = 'Push notifications disabled'
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted')
    }

    if (!session.vapidPublicKey) {
      throw new Error('VAPID public key is not configured')
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(session.vapidPublicKey)
    })

    await api('/notifications/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription)
    })
    pushSubscribed.value = true
    message.value = 'Push notifications enabled'
  } catch (cause) {
    message.value = cause instanceof ApiError ? cause.message : (cause as Error).message
  } finally {
    pushBusy.value = false
  }
}

const pushLabel = computed(() => (pushSubscribed.value ? 'Disable Push' : 'Enable Push'))
</script>

<style scoped>
.settings-grid {
  display: grid;
  gap: 1rem;
}

.settings-grid label {
  display: grid;
  gap: 0.55rem;
}

.settings-actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.feedback {
  color: var(--text-soft);
}
</style>
