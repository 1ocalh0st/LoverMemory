<template>
  <div class="pairing-page page">
    <section class="section-card pairing-hero">
      <span class="eyebrow">Two-person space</span>
      <h1 class="display-lg">{{ t('pairing.title') }}</h1>
      <p class="body-lg">{{ t('pairing.subtitle') }}</p>
    </section>

    <section class="pairing-grid">
      <article class="section-card pairing-card">
        <span class="field-label">{{ t('pairing.create') }}</span>
        <h2 class="headline-md">{{ t('pairing.create') }}</h2>
        <p class="helper-copy">Create a single-use code for your partner. It expires automatically in seven days.</p>
        <button class="button-primary" :disabled="creatingInvite" @click="createInvite">{{ t('pairing.create') }}</button>
        <div v-if="inviteCode" class="invite-code">
          <span>{{ inviteCode }}</span>
          <button class="button-secondary" @click="copyCode">Copy</button>
        </div>
        <div v-if="canEnterHome" class="pairing-entry">
          <p class="helper-copy">Your private space is ready. You can head to the home page without refreshing.</p>
          <button class="button-secondary pairing-entry-button" @click="enterHome">Enter Home</button>
        </div>
      </article>

      <article class="section-card pairing-card">
        <span class="field-label">{{ t('pairing.join') }}</span>
        <h2 class="headline-md">{{ t('pairing.join') }}</h2>
        <p class="helper-copy">Paste the invite your partner generated to link this device into the shared scrapbook.</p>
        <label class="field-block">
          <span class="field-label">{{ t('pairing.code') }}</span>
          <input v-model="joinCode" class="field" :placeholder="t('pairing.code')" />
        </label>
        <button class="button-primary" :disabled="joining" @click="joinSpace">{{ t('pairing.join') }}</button>
      </article>
    </section>

    <p v-if="message" class="pairing-message status-note">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api, ApiError } from '@/lib/api'
import { clearSessionCache } from '@/lib/session'

const { t } = useI18n()
const router = useRouter()
const joinCode = ref('')
const message = ref('')
const creatingInvite = ref(false)
const joining = ref(false)

const pairingQuery = useQuery({
  queryKey: ['pairing-status'],
  queryFn: () => api<any>('/pairing/status')
})

const inviteCode = computed(() => pairingQuery.data.value?.inviteCode ?? null)
const canEnterHome = computed(() => Boolean(pairingQuery.data.value?.coupleSpace))

async function createInvite() {
  creatingInvite.value = true
  message.value = ''
  try {
    const invite = await api<{ code: string }>('/pairing/invite', { method: 'POST' })
    clearSessionCache()
    await pairingQuery.refetch()
    message.value = `Invite ready: ${invite.code}`
  } catch (cause) {
    message.value = cause instanceof ApiError ? cause.message : 'Unable to create invite'
  } finally {
    creatingInvite.value = false
  }
}

async function joinSpace() {
  joining.value = true
  message.value = ''
  try {
    await api('/pairing/join', {
      method: 'POST',
      body: JSON.stringify({ code: joinCode.value })
    })
    clearSessionCache()
    await router.push({ name: 'home' })
  } catch (cause) {
    message.value = cause instanceof ApiError ? cause.message : 'Unable to join'
  } finally {
    joining.value = false
  }
}

async function copyCode() {
  if (!inviteCode.value) return
  await navigator.clipboard.writeText(inviteCode.value)
  message.value = 'Invite code copied'
}

async function enterHome() {
  clearSessionCache()
  await router.push({ name: 'home' })
}
</script>

<style scoped>
.pairing-page {
  min-height: 100vh;
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(0.8rem, 2vw, 1.4rem);
  align-content: start;
}

.pairing-hero,
.pairing-card {
  display: grid;
  gap: 0.9rem;
}

.pairing-hero h1,
.pairing-card h2,
.pairing-message {
  margin: 0;
}

.pairing-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.invite-code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  border-radius: 22px;
  padding: 0.95rem 1rem;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: inset 0 0 0 1px var(--outline);
}

.invite-code span {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2rem);
  letter-spacing: 0.14em;
}

.pairing-entry {
  display: grid;
  gap: 0.75rem;
}

.pairing-entry-button {
  width: fit-content;
}

@media (max-width: 800px) {
  .pairing-page {
    min-height: 100svh;
  }

  .pairing-grid {
    grid-template-columns: 1fr;
  }
}
</style>
