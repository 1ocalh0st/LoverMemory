<template>
  <div class="page">
    <header class="editorial-header">
      <h1 class="display-lg">{{ t('anniversaries.title') }}</h1>
      <p class="body-lg">Count up, count down, and schedule subtle reminders before each milestone lands.</p>
    </header>

    <section class="section-card anniversary-form">
      <input v-model="form.title" class="field ledger-style" placeholder="Anniversary title" />
      <input v-model="form.targetDate" class="field ledger-style" type="date" />
      <select v-model="form.type" class="select ledger-style">
        <option value="countdown">Countdown</option>
        <option value="countup">Count up</option>
      </select>
      <input v-model="form.reminderDays" class="field ledger-style" placeholder="Reminder days, e.g. 30,7,1" />
      <textarea v-model="form.note" class="textarea ledger-style" rows="4" placeholder="Short note"></textarea>
      <button class="button-primary" :disabled="saving" @click="save">{{ t('actions.addAnniversary') }}</button>
    </section>

    <section v-if="anniversaryQuery.data.value?.items.length" class="anniversary-grid">
      <article v-for="item in anniversaryQuery.data.value?.items" :key="item.id" class="section-card anniversary-card">
        <div>
          <small class="meta-label">{{ item.type }}</small>
          <h2 class="headline-md">{{ item.title }}</h2>
        </div>
        <strong class="display-lg text-primary">{{ daysLeft(item.targetDate) }}</strong>
        <p class="body-lg">{{ item.note }}</p>
        <span class="meta-date">{{ new Date(item.targetDate).toLocaleDateString() }}</span>
      </article>
    </section>
    <div v-else class="empty-state">{{ t('anniversaries.empty') }}</div>

    <p v-if="error" class="feedback">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api, ApiError } from '@/lib/api'

const { t } = useI18n()
const queryClient = useQueryClient()
const saving = ref(false)
const error = ref('')

const form = ref({
  title: '',
  targetDate: new Date().toISOString().slice(0, 10),
  type: 'countdown',
  reminderDays: '30,7,1',
  note: ''
})

const anniversaryQuery = useQuery({
  queryKey: ['anniversaries'],
  queryFn: () => api<any>('/anniversaries')
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await api('/anniversaries', {
      method: 'POST',
      body: JSON.stringify({
        title: form.value.title,
        targetDate: new Date(form.value.targetDate).toISOString(),
        type: form.value.type,
        note: form.value.note,
        reminderDays: form.value.reminderDays
          .split(',')
          .map((item) => Number(item.trim()))
          .filter((item) => !Number.isNaN(item))
      })
    })
    form.value = {
      title: '',
      targetDate: new Date().toISOString().slice(0, 10),
      type: 'countdown',
      reminderDays: '30,7,1',
      note: ''
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['anniversaries'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] })
    ])
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Unable to save anniversary'
  } finally {
    saving.value = false
  }
}

function daysLeft(targetDate: string) {
  const next = new Date(targetDate)
  const now = new Date()
  next.setFullYear(now.getFullYear())
  if (next.getTime() < now.getTime()) {
    next.setFullYear(now.getFullYear() + 1)
  }
  const diff = next.getTime() - now.getTime()
  return `${Math.ceil(diff / (1000 * 60 * 60 * 24))}d`
}
</script>

<style scoped>
.anniversary-form,
.anniversary-grid {
  display: grid;
  gap: 2rem;
}

.anniversary-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.anniversary-card {
  display:flex;
  flex-direction: column;
  gap: 1rem;
}

.anniversary-card h2 {
  margin: 0;
  color: var(--primary);
}

.anniversary-card p {
  margin: 0;
}

.text-primary {
  color: var(--primary);
  line-height: 1;
}

.meta-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: var(--text-soft);
  font-size: 0.8rem;
}

.meta-date,
.feedback {
  color: var(--text-soft);
}
</style>
