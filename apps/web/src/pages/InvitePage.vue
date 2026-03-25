<template>
  <div class="invite-page page">
    <section class="section-card invite-card">
      <span class="eyebrow">Invite</span>
      <h1 class="display-lg">{{ t('pairing.code') }}</h1>
      <p class="body-lg">View the current invite for this space, copy it, or generate a replacement.</p>

      <p v-if="pairingQuery.isLoading.value" class="status-note">{{ t('common.loading') }}</p>

      <template v-else>
        <div v-if="inviteCode" class="invite-code">
          <span>{{ inviteCode }}</span>
          <button class="button-secondary" @click="copyCode">Copy</button>
        </div>
        <p v-else class="helper-copy">No active invite code is available right now.</p>

        <p v-if="inviteExpiresAt" class="helper-copy">Expires at: {{ inviteExpiresAt }}</p>

        <button class="button-primary" :disabled="creatingInvite" @click="createInvite">
          {{ t('pairing.create') }}
        </button>
      </template>

      <p v-if="message" class="status-note">{{ message }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api, ApiError } from '@/lib/api'

const { t, locale } = useI18n()
const message = ref('')
const creatingInvite = ref(false)

const pairingQuery = useQuery({
  queryKey: ['invite-status'],
  queryFn: () => api<any>('/pairing/status')
})

const inviteCode = computed(() => pairingQuery.data.value?.inviteCode ?? null)
const inviteExpiresAt = computed(() => {
  const value = pairingQuery.data.value?.inviteExpiresAt
  if (!value) return null
  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(new Date(value))
})

async function createInvite() {
  creatingInvite.value = true
  message.value = ''
  try {
    const invite = await api<{ code: string }>('/pairing/invite', { method: 'POST' })
    await pairingQuery.refetch()
    message.value = `Invite ready: ${invite.code}`
  } catch (cause) {
    message.value = cause instanceof ApiError ? cause.message : 'Unable to create invite'
  } finally {
    creatingInvite.value = false
  }
}

async function copyCode() {
  if (!inviteCode.value) return
  await navigator.clipboard.writeText(inviteCode.value)
  message.value = 'Invite code copied'
}
</script>

<style scoped>
.invite-page {
  min-height: 100vh;
  max-width: 820px;
  margin: 0 auto;
  padding: clamp(0.8rem, 2vw, 1.4rem);
}

.invite-card {
  display: grid;
  gap: 1rem;
}

.invite-card h1,
.invite-card p {
  margin: 0;
}

.invite-code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  padding: 0.9rem 1rem;
}

.invite-code span {
  font-size: clamp(1.15rem, 2vw, 1.6rem);
  font-weight: 700;
  letter-spacing: 0.16em;
}
</style>
