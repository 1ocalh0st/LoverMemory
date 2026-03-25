<template>
  <div class="page settings-page">
    <section class="section-card settings-hero">
      <span class="eyebrow">个人偏好</span>
      <h1 class="display-lg">{{ t('settings.title') }}</h1>
      <p class="body-lg">
        设置语言、主题、时间格式并管理通知，打造属于你的独家剪贴簿。
      </p>
    </section>

    <section class="settings-layout">
      <article class="section-card settings-panel">
        <div class="settings-stack">
          <div class="field-block">
            <span class="field-label">{{ t('settings.locale') }}</span>
            <div class="pill-row">
              <button
                v-for="option in localeOptions"
                :key="option.value"
                class="pill-button"
                :class="{ active: form.locale === option.value }"
                @click="form.locale = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="field-block">
            <span class="field-label">{{ t('settings.theme') }}</span>
            <div class="pill-row">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                class="pill-button"
                :class="{ active: form.theme === option.value }"
                @click="form.theme = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="field-block">
            <span class="field-label">{{ t('settings.timeFormat') }}</span>
            <div class="pill-row">
              <button
                v-for="option in timeFormatOptions"
                :key="option.value"
                class="pill-button"
                :class="{ active: form.timeFormat === option.value }"
                @click="form.timeFormat = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <label class="field-block">
            <span class="field-label">{{ t('settings.timezone') }}</span>
            <input v-model="form.timezone" class="field" placeholder="Asia/Shanghai" />
          </label>

          <label class="field-block">
            <span class="field-label">{{ t('settings.displayName') || 'Display Name' }}</span>
            <input v-model="form.displayName" class="field" placeholder="Your Name" />
          </label>
        </div>

        <div class="settings-actions">
          <button class="button-primary" :disabled="saving" @click="save">{{ t('actions.save') }}</button>
        </div>
      </article>

      <article class="section-card settings-panel">
        <div class="settings-stack">
          <div class="field-block">
            <span class="field-label">{{ t('settings.push') }}</span>
            <p class="helper-copy">只在需要接收通知的设备上开启共享提醒。</p>
            <button class="button-secondary settings-full-width" :disabled="pushBusy" @click="togglePush">
              {{ pushLabel }}
            </button>
            <div class="status-note">
              {{ pushSubscribed ? '此设备已开启推送。' : '此设备推送已关闭。' }}
            </div>
          </div>

          <div class="field-block">
            <span class="field-label">账号</span>
            <p class="helper-copy">如果不想让此设备自动打开共享空间，请退出登录。</p>
            <button class="button-ghost settings-full-width" @click="logout">{{ t('actions.logout') }}</button>
          </div>
        </div>
      </article>
    </section>

    <p v-if="message" class="feedback status-note">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api, ApiError } from '@/lib/api'
import { clearSessionCache, loadSession } from '@/lib/session'

const { t, locale } = useI18n()
const router = useRouter()
const saving = ref(false)
const pushBusy = ref(false)
const message = ref('')
const pushSubscribed = ref(false)

const localeOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' }
]

const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

const timeFormatOptions = [
  { value: '24h', label: '24h' },
  { value: '12h', label: '12h' }
]

const sessionQuery = useQuery({
  queryKey: ['session'],
  queryFn: () => loadSession(true)
})

const form = ref({
  locale: 'en',
  theme: 'system',
  timeFormat: '24h',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  displayName: ''
})

watchEffect(() => {
  const user = sessionQuery.data.value?.user
  if (!user) return
  form.value = {
    locale: user.locale,
    theme: user.theme,
    timeFormat: user.timeFormat,
    timezone: user.timezone,
    displayName: user.displayName || ''
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
    message.value = '偏好已保存'
  } catch (cause) {
    message.value = cause instanceof ApiError ? cause.message : '无法保存设置'
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
      message.value = '已禁用推送提醒'
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
    message.value = '已开启推送提醒'
  } catch (cause) {
    message.value = cause instanceof ApiError ? cause.message : (cause as Error).message
  } finally {
    pushBusy.value = false
  }
}

async function logout() {
  await api('/auth/session', { method: 'DELETE' })
  clearSessionCache()
  await router.push({ name: 'auth' })
}

const pushLabel = computed(() => (pushSubscribed.value ? '关闭推送' : '开启推送'))
</script>

<style scoped>
.settings-page {
  gap: 1.4rem;
}

.settings-hero {
  display: grid;
  gap: 0.9rem;
}

.settings-hero h1,
.feedback {
  margin: 0;
}

.settings-layout {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.9fr);
}

.settings-panel,
.settings-stack {
  display: grid;
  gap: 1.1rem;
}

.settings-actions {
  display: flex;
  justify-content: flex-start;
}

.settings-full-width {
  width: 100%;
}

.feedback {
  width: fit-content;
}

@media (max-width: 980px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .settings-hero {
    display: none;
  }
}
</style>
