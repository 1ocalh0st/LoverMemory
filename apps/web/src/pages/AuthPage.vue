<template>
  <div class="auth-page">
    <section class="auth-shell glass">
      <div class="auth-hero">
        <span class="eyebrow">Private entry</span>
        <h1>{{ t('auth.title') }}</h1>
        <p>{{ t('auth.subtitle') }}</p>
        <div class="auth-hero-image">
          <img src="/pictures/fujimountain.jpg" alt="Quiet landscape" />
        </div>
      </div>

      <section class="auth-card">
        <div class="auth-card-head">
          <span class="field-label">{{ t('brand') }}</span>
          <h2 class="headline-md">Enter your scrapbook</h2>
          <p class="helper-copy">{{ t('auth.subtitle') }}</p>
        </div>

        <div class="auth-copy">
          <strong>{{ t('auth.deviceTitle') }}</strong>
          <p>{{ t('auth.deviceBody') }}</p>
          <p class="auth-muted">{{ t('auth.loginHint') }}</p>
        </div>

        <div class="auth-form-grid">
          <label class="field-block">
            <span class="field-label">{{ t('auth.name') }}</span>
            <input v-model="displayName" class="field" />
          </label>
          <label class="field-block">
            <span class="field-label">{{ t('auth.email') }}</span>
            <input v-model="email" type="email" class="field" />
          </label>
        </div>

        <div class="auth-actions">
          <button class="button-primary" :disabled="busy" @click="handleRegister">{{ t('auth.register') }}</button>
          <button class="button-secondary" :disabled="busy" @click="handleLogin">{{ t('auth.login') }}</button>
        </div>

        <p class="auth-muted auth-mode-hint">{{ modeHint }}</p>

        <details class="auth-recovery">
          <summary>{{ t('auth.recovery') }}</summary>
          <p>{{ t('auth.recoveryBody') }}</p>
          <p v-if="recoveryMode === 'disabled'" class="auth-muted">{{ t('auth.recoveryDisabled') }}</p>
          <p v-else class="auth-muted">{{ t('auth.recoveryPreview') }}</p>
          <button
            v-if="recoveryMode === 'preview'"
            class="button-secondary auth-recovery-action"
            :disabled="busy"
            @click="handleRecovery"
          >
            {{ t('auth.recoveryAction') }}
          </button>
          <div v-if="recoveryPreview" class="auth-preview">
            {{ t('auth.recoveryResult', { token: recoveryPreview }) }}
          </div>
        </details>

        <p v-if="error" class="auth-error">{{ error }}</p>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import { animate } from 'motion'
import { api, ApiError } from '@/lib/api'
import { clearSessionCache, loadSession, type SessionPayload } from '@/lib/session'

const router = useRouter()
const { t, locale } = useI18n()

const email = ref('')
const displayName = ref('')
const busy = ref(false)
const error = ref('')
const recoveryPreview = ref('')
const recoveryMode = ref<SessionPayload['recoveryMode']>('disabled')
const modeHint = computed(() => 'Registration requires both name and email. Sign-in accepts either one.')

onMounted(async () => {
  animate('.auth-shell' as any, { opacity: [0, 1], y: [18, 0] } as any, { duration: 0.75 })
  try {
    const session = await loadSession()
    recoveryMode.value = session.recoveryMode ?? 'disabled'
  } catch {
    recoveryMode.value = 'disabled'
  }
})

function isBrowserAbort(cause: unknown) {
  return cause instanceof Error && ['AbortError', 'NotAllowedError'].includes(cause.name)
}

async function finishSuccess(result: { needsPairing?: boolean }) {
  clearSessionCache()
  await router.push(result.needsPairing ? { name: 'pairing' } : { name: 'home' })
}

function normalizedDisplayName() {
  return displayName.value.trim()
}

function normalizedEmail() {
  return email.value.trim()
}

function loginIdentifier() {
  return normalizedEmail() || normalizedDisplayName()
}

async function handleRegister() {
  if (!normalizedDisplayName() || !normalizedEmail()) {
    error.value = 'Name and email are both required to register.'
    return
  }

  busy.value = true
  error.value = ''
  try {
    const start = await api<any>('/auth/passkeys/register/start', {
      method: 'POST',
      body: JSON.stringify({
        email: normalizedEmail(),
        displayName: normalizedDisplayName(),
        locale: locale.value,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    })
    const credential = await startRegistration({ optionsJSON: start })
    const result = await api<{ needsPairing?: boolean }>('/auth/passkeys/register/finish', {
      method: 'POST',
      body: JSON.stringify({
        email: normalizedEmail(),
        credential
      })
    })
    await finishSuccess(result)
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : isBrowserAbort(cause) ? t('auth.cancelled') : t('auth.registerFailed')
  } finally {
    busy.value = false
  }
}

async function handleLogin() {
  if (!loginIdentifier()) {
    error.value = 'Enter your name or email to sign in.'
    return
  }

  busy.value = true
  error.value = ''
  try {
    const start = await api<any>('/auth/passkeys/login/start', {
      method: 'POST',
      body: JSON.stringify({
        identifier: loginIdentifier()
      })
    })
    const credential = await startAuthentication({ optionsJSON: start })
    const result = await api<{ needsPairing?: boolean }>('/auth/passkeys/login/finish', {
      method: 'POST',
      body: JSON.stringify({
        identifier: loginIdentifier(),
        credential
      })
    })
    await finishSuccess(result)
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : isBrowserAbort(cause) ? t('auth.cancelled') : t('auth.loginFailed')
  } finally {
    busy.value = false
  }
}

async function handleRecovery() {
  if (!normalizedEmail()) {
    error.value = 'Email is required for recovery.'
    return
  }

  busy.value = true
  error.value = ''
  recoveryPreview.value = ''
  try {
    const result = await api<{ previewToken?: string }>('/auth/recovery/request', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail() })
    })
    recoveryPreview.value = result.previewToken ?? ''
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
  padding: clamp(0.8rem, 2vw, 1.2rem);
  display: grid;
  place-items: center;
}

.auth-shell {
  width: min(1180px, 100%);
  padding: 1rem;
  border-radius: 34px;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.95fr);
  gap: 1rem;
}

.auth-hero,
.auth-card,
.auth-copy,
.auth-form-grid,
.auth-recovery {
  display: grid;
  gap: 1rem;
}

.auth-hero {
  padding: clamp(1rem, 2vw, 1.6rem);
  align-content: start;
}

.auth-hero h1,
.auth-card h2,
.auth-error {
  margin: 0;
}

.auth-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(3rem, 6.5vw, 5.2rem);
  line-height: 0.92;
}

.auth-hero p {
  margin: 0;
  color: var(--text-soft);
  max-width: 34rem;
}

.auth-hero-image {
  overflow: hidden;
  border-radius: 28px;
  aspect-ratio: 4 / 3;
  margin-top: 0.5rem;
}

.auth-hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-card {
  padding: clamp(1rem, 2vw, 1.6rem);
  border-radius: 28px;
  background: rgba(255, 252, 248, 0.68);
  box-shadow: inset 0 0 0 1px var(--outline);
}

.auth-card-head {
  display: grid;
  gap: 0.6rem;
}

.auth-copy {
  padding: 1rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 0 0 1px var(--outline);
}

.auth-copy strong,
.auth-copy p,
.auth-recovery p {
  margin: 0;
}

.auth-actions {
  display: grid;
  gap: 0.75rem;
}

.auth-muted {
  color: var(--text-soft);
}

.auth-mode-hint {
  margin: 0;
}

.auth-recovery {
  padding: 1rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.44);
  box-shadow: inset 0 0 0 1px var(--outline);
}

.auth-recovery summary {
  cursor: pointer;
  font-weight: 800;
}

.auth-recovery-action {
  width: fit-content;
}

.auth-preview {
  padding: 0.85rem 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: inset 0 0 0 1px var(--outline);
  color: var(--accent-strong);
  font-weight: 700;
}

.auth-error {
  color: #8b3141;
  font-weight: 700;
}

@media (max-width: 960px) {
  .auth-page {
    min-height: 100svh;
  }

  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-hero-image {
    aspect-ratio: 16 / 9;
  }
}
</style>
