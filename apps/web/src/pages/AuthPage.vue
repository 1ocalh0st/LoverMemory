<template>
  <div class="auth-page">
    <section class="auth-poster">
      <div class="auth-poster-copy">
        <span class="auth-kicker">{{ t('brand') }}</span>
        <h1>{{ t('auth.title') }}</h1>
        <p>{{ t('auth.subtitle') }}</p>
      </div>
    </section>

    <section class="auth-card glass">
      <div class="page-header">
        <h1>{{ t('brand') }}</h1>
        <p>{{ t('auth.subtitle') }}</p>
      </div>

      <div class="auth-form-grid">
        <label>
          <span>{{ t('auth.name') }}</span>
          <input v-model="displayName" class="field" />
        </label>
        <label>
          <span>{{ t('auth.email') }}</span>
          <input v-model="email" type="email" class="field" />
        </label>
      </div>

      <div class="auth-actions">
        <button class="button-primary" :disabled="busy" @click="handleRegister">{{ t('auth.register') }}</button>
        <button class="button-secondary" :disabled="busy" @click="handleLogin">{{ t('auth.login') }}</button>
      </div>

      <details class="auth-recovery">
        <summary>{{ t('auth.recovery') }}</summary>
        <button class="button-secondary" :disabled="busy" @click="handleRecovery">Send Recovery Preview</button>
        <div v-if="recoveryPreview" class="auth-preview">Recovery token: {{ recoveryPreview }}</div>
      </details>

      <p v-if="error" class="auth-error">{{ error }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import { animate } from 'motion'
import { api, ApiError } from '@/lib/api'
import { clearSessionCache } from '@/lib/session'

const router = useRouter()
const { t, locale } = useI18n()

const email = ref('')
const displayName = ref('')
const busy = ref(false)
const error = ref('')
const recoveryPreview = ref('')

onMounted(() => {
  animate('.auth-card' as any, { opacity: [0, 1], y: [18, 0] } as any, { duration: 0.75 })
})

async function finishSuccess(result: { needsPairing?: boolean }) {
  clearSessionCache()
  await router.push(result.needsPairing ? { name: 'pairing' } : { name: 'home' })
}

async function handleRegister() {
  busy.value = true
  error.value = ''
  try {
    const start = await api<any>('/auth/passkeys/register/start', {
      method: 'POST',
      body: JSON.stringify({
        email: email.value,
        displayName: displayName.value,
        locale: locale.value,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    })
    const credential = await startRegistration({ optionsJSON: start })
    const result = await api<{ needsPairing?: boolean }>('/auth/passkeys/register/finish', {
      method: 'POST',
      body: JSON.stringify({
        email: email.value,
        credential
      })
    })
    await finishSuccess(result)
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Registration failed'
  } finally {
    busy.value = false
  }
}

async function handleLogin() {
  busy.value = true
  error.value = ''
  try {
    const start = await api<any>('/auth/passkeys/login/start', {
      method: 'POST',
      body: JSON.stringify({
        email: email.value
      })
    })
    const credential = await startAuthentication({ optionsJSON: start })
    const result = await api<{ needsPairing?: boolean }>('/auth/passkeys/login/finish', {
      method: 'POST',
      body: JSON.stringify({
        email: email.value,
        credential
      })
    })
    await finishSuccess(result)
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Login failed'
  } finally {
    busy.value = false
  }
}

async function handleRecovery() {
  busy.value = true
  error.value = ''
  recoveryPreview.value = ''
  try {
    const result = await api<{ previewToken?: string }>('/auth/recovery/request', {
      method: 'POST',
      body: JSON.stringify({ email: email.value })
    })
    recoveryPreview.value = result.previewToken ?? 'Request accepted'
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Recovery request failed'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.2fr minmax(340px, 560px);
  padding: 1.4rem;
  gap: 1.2rem;
}

.auth-poster,
.auth-card {
  border-radius: 38px;
}

.auth-poster {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 2.8rem);
  background:
    linear-gradient(150deg, rgba(9, 12, 18, 0.18), rgba(9, 12, 18, 0.58)),
    url('/pictures/fujimountain.jpg') center/cover;
  color: white;
  display: flex;
  align-items: flex-end;
  padding: clamp(2rem, 4vw, 4rem);
}

.auth-poster-copy {
  max-width: 34rem;
}

.auth-kicker {
  display: inline-flex;
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(16px);
}

.auth-poster h1 {
  font-size: clamp(3rem, 7vw, 5.6rem);
  line-height: 0.95;
  margin: 1.2rem 0 1rem;
  letter-spacing: -0.06em;
}

.auth-poster p {
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
}

.auth-card {
  padding: clamp(1.6rem, 3vw, 2.3rem);
  display: grid;
  gap: 1.4rem;
  align-content: center;
}

.auth-form-grid {
  display: grid;
  gap: 1rem;
}

.auth-form-grid label,
.auth-recovery {
  display: grid;
  gap: 0.55rem;
}

.auth-actions {
  display: grid;
  gap: 0.75rem;
}

.auth-error,
.auth-preview {
  color: var(--accent);
}

summary {
  cursor: pointer;
}

@media (max-width: 960px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-poster {
    min-height: 320px;
  }
}
</style>
