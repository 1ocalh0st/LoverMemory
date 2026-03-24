<template>
  <div class="page">
    <header class="page-header">
      <h1>{{ t('anniversaries.title') }}</h1>
      <p>Count up, count down, and schedule subtle reminders before each milestone lands.</p>
    </header>

    <section class="glass section-card anniversary-form">
      <input v-model="form.title" class="field" placeholder="Anniversary title" />
      <input v-model="form.targetDate" class="field" type="date" />
      <select v-model="form.type" class="select">
        <option value="countdown">Countdown</option>
        <option value="countup">Count up</option>
      </select>
      <input v-model="form.reminderDays" class="field" placeholder="Reminder days, e.g. 30,7,1" />
      <textarea v-model="form.note" class="textarea" rows="4" placeholder="Short note"></textarea>
      <button class="button-primary" :disabled="saving" @click="save">{{ t('actions.addAnniversary') }}</button>
    </section>

    <section v-if="anniversaryQuery.data.value?.items.length" class="anniversary-grid">
      <article v-for="item in anniversaryQuery.data.value?.items" :key="item.id" class="glass section-card anniversary-card">
        <div>
          <small>{{ item.type }}</small>
          <h2>{{ item.title }}</h2>
        </div>
        <strong>{{ daysLeft(item.targetDate) }}</strong>
        <p>{{ item.note }}</p>
        <span>{{ new Date(item.targetDate).toLocaleDateString() }}</span>
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
  gap: 1rem;
}

.anniversary-grid {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.anniversary-card h2,
.anniversary-card p {
  margin: 0.45rem 0;
}

.anniversary-card strong {
  font-size: 2.2rem;
  letter-spacing: -0.05em;
}

.anniversary-card small,
.anniversary-card span,
.feedback {
  color: var(--text-soft);
}
</style>
