<template>
  <div class="pairing-page page">
    <header class="page-header">
      <h1>{{ t('pairing.title') }}</h1>
      <p>{{ t('pairing.subtitle') }}</p>
    </header>

    <section class="pairing-grid">
      <article class="glass section-card pairing-card">
        <h2>{{ t('pairing.create') }}</h2>
        <p>Create a one-time code for your partner. It expires automatically in 7 days.</p>
        <button class="button-primary" :disabled="creatingInvite" @click="createInvite">{{ t('pairing.create') }}</button>
        <div v-if="inviteCode" class="invite-code">
          <span>{{ inviteCode }}</span>
          <button class="button-secondary" @click="copyCode">Copy</button>
        </div>
      </article>

      <article class="glass section-card pairing-card">
        <h2>{{ t('pairing.join') }}</h2>
        <p>Paste the invite code your partner generated and lock this account into the shared space.</p>
        <input v-model="joinCode" class="field" :placeholder="t('pairing.code')" />
        <button class="button-primary" :disabled="joining" @click="joinSpace">{{ t('pairing.join') }}</button>
      </article>
    </section>

    <p v-if="message" class="pairing-message">{{ message }}</p>
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

async function createInvite() {
  creatingInvite.value = true
  message.value = ''
  try {
    const invite = await api<{ code: string }>('/pairing/invite', { method: 'POST' })
    pairingQuery.refetch()
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
</script>

<style scoped>
.pairing-page {
  min-height: 100vh;
  max-width: 1120px;
  margin: 0 auto;
  padding: 2rem 1rem 5rem;
}

.pairing-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.pairing-card {
  display: grid;
  gap: 1rem;
}

.pairing-card h2 {
  margin: 0;
}

.pairing-card p {
  margin: 0;
  color: var(--text-soft);
}

.invite-code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 22px;
  padding: 1rem;
  background: var(--accent-soft);
}

.invite-code span {
  font-size: 1.6rem;
  letter-spacing: 0.18em;
  font-weight: 700;
}

.pairing-message {
  color: var(--accent);
}

@media (max-width: 800px) {
  .pairing-grid {
    grid-template-columns: 1fr;
  }
}
</style>
