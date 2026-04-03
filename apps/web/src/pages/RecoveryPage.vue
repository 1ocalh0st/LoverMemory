<template>
  <div class="auth-page">
    <section class="auth-shell glass">
      <div class="auth-hero">
        <span class="eyebrow">Recovery access</span>
        <h1>{{ t('recovery.title') }}</h1>
        <p>{{ t('auth.subtitle') }}</p>
        <div class="auth-hero-image">
          <img src="/pictures/fujimountain.jpg" alt="Quiet landscape" />
        </div>
      </div>

      <section class="auth-card">
        <div class="auth-card-head">
          <span class="field-label">{{ t('brand') }}</span>
          <h2 class="headline-md">{{ t('recovery.title') }}</h2>
          <p class="helper-copy">{{ t('recovery.subtitle') }}</p>
        </div>

        <div v-if="verifying" class="auth-copy">
          <p>{{ t('recovery.verify') }}</p>
        </div>

        <div v-else-if="invalid" class="auth-copy">
          <p class="auth-error">{{ t('recovery.invalid') }}</p>
          <div class="auth-actions" style="margin-top: 1rem">
             <button class="button-secondary" @click="router.push({ name: 'auth' })">Back to Login</button>
          </div>
        </div>

        <div v-else class="auth-actions" style="margin-top: 1rem">
          <button class="button-primary" :disabled="busy" @click="handleRegister">{{ t('recovery.register') }}</button>
        </div>

        <p v-if="error" class="auth-error">{{ error }}</p>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { startRegistration } from '@simplewebauthn/browser'
import { animate } from 'motion'
import { api, ApiError } from '@/lib/api'
import { clearSessionCache } from '@/lib/session'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const token = route.query.token as string

const verifying = ref(true)
const invalid = ref(false)
const busy = ref(false)
const error = ref('')

onMounted(async () => {
  animate('.auth-shell' as any, { opacity: [0, 1], y: [18, 0] } as any, { duration: 0.75 })
  
  if (!token) {
    verifying.value = false
    invalid.value = true
    return
  }

  try {
    await api('/auth/recovery/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
    verifying.value = false
  } catch (cause) {
    verifying.value = false
    invalid.value = true
  }
})

function isBrowserAbort(cause: unknown) {
  return cause instanceof Error && ['AbortError', 'NotAllowedError'].includes(cause.name)
}

async function handleRegister() {
  busy.value = true
  error.value = ''
  try {
    const start = await api<any>('/auth/recovery/register/start', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
    const credential = await startRegistration({ optionsJSON: start })
    const result = await api<{ needsPairing?: boolean }>('/auth/recovery/register/finish', {
      method: 'POST',
      body: JSON.stringify({ token, credential })
    })
    clearSessionCache()
    await router.push(result.needsPairing ? { name: 'pairing' } : { name: 'home' })
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : isBrowserAbort(cause) ? t('auth.cancelled') : t('auth.registerFailed')
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
.auth-actions {
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
.auth-copy p {
  margin: 0;
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
