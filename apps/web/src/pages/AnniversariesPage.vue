<template>
  <div class="page anniversaries-page">
    <section class="section-card anniversaries-hero">
      <span class="eyebrow">里程碑</span>
      <h1 class="display-lg">{{ t('anniversaries.title') }}</h1>
      <p class="body-lg">无论是期待未来的某一天，还是回望改变一切的那个瞬间，都在这里安静地倒数或计时。</p>
    </section>

    <section class="section-card anniversary-form-card">
      <div class="anniversary-form-grid">
        <label class="field-block">
          <span class="field-label">标题</span>
          <input v-model="form.title" class="field" placeholder="第一次旅行、公寓钥匙、午夜通话..." />
        </label>

        <label class="field-block">
          <span class="field-label">日期</span>
          <VueDatePicker
            v-model="form.targetDate"
            :locale="datepickerLocale"
            format="yyyy-MM-dd, HH:mm"
            :enable-time-picker="true"
            auto-apply
            :clearable="false"
            input-class-name="custom-dp-input"
            hide-input-icon
          />
        </label>

        <div class="field-block">
          <span class="field-label">计时方式</span>
          <div class="pill-row">
            <button
              v-for="option in typeOptions"
              :key="option.value"
              class="pill-button"
              :class="{ active: form.type === option.value }"
              @click="form.type = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <label class="field-block">
          <span class="field-label">提醒机制（提前天数）</span>
          <input v-model="form.reminderDays" class="field" placeholder="例如：30, 7, 1" />
        </label>

        <label class="field-block" style="grid-column: 1 / -1;">
          <span class="field-label">备注</span>
          <textarea v-model="form.note" class="textarea" rows="2" placeholder="一段简短的留言，写下为什么这一天如此重要。"></textarea>
        </label>
      </div>

      <div class="anniversary-actions">
        <button class="button-primary" :disabled="saving" @click="save">
          {{ editing ? '保存修改' : t('actions.addAnniversary') }}
        </button>
        <button v-if="editing" class="button-ghost" @click="cancelEdit">取消</button>
      </div>
    </section>

    <section v-if="anniversaryQuery.data.value?.items.length" class="anniversary-grid">
      <article
        v-for="item in anniversaryQuery.data.value?.items"
        :key="item.id"
        class="section-card anniversary-card"
        :class="{ 'card-editing': editing === item.id }"
      >
        <div class="anniversary-card-top">
          <span class="eyebrow anniversary-type">{{ item.type === 'countdown' ? '倒数' : '正数' }}</span>
          <strong class="display-lg anniversary-days">{{ computeDays(item) }}</strong>
        </div>
        <h2 class="headline-md">{{ item.title }}</h2>
        <p class="body-lg">{{ item.note || '还没有留言，只有日期和与之相伴的记忆。' }}</p>
        <div class="anniversary-card-bottom">
          <span class="anniversary-date">{{ formatAnniversaryDate(item.targetDate) }}</span>
          <div class="anniversary-card-ops">
            <button class="button-icon-sm" title="编辑" @click="startEdit(item)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
            <button class="button-icon-sm danger" title="删除" @click="remove(item.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </article>
    </section>
    <div v-else class="empty-state">{{ t('anniversaries.empty') }}</div>

    <p v-if="error" class="feedback status-note">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { enUS, zhCN } from 'date-fns/locale'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { api, ApiError } from '@/lib/api'
import { formatDateInAppTimeZone, getDatePartsInAppTimeZone } from '@/lib/datetime'

const { t, locale } = useI18n()
const queryClient = useQueryClient()
const saving = ref(false)
const error = ref('')
const editing = ref<string | null>(null)
const datepickerLocale = computed(() => (locale.value === 'zh' ? zhCN : enUS))

const typeOptions = [
  { value: 'countdown', label: '倒数' },
  { value: 'countup', label: '正数' }
]

const form = ref(createAnniversaryForm())

// High-timeliness sync: update default date every minute if form is untouched
let refreshTimer: any = null
import { onMounted, onUnmounted } from 'vue'

function refreshDefaultDate() {
  if (!editing.value && !form.value.title.trim() && !form.value.note.trim()) {
    form.value.targetDate = new Date()
  }
}

onMounted(() => {
  refreshTimer = setInterval(refreshDefaultDate, 60000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

const anniversaryQuery = useQuery({
  queryKey: ['anniversaries'],
  queryFn: () => api<any>('/anniversaries')
})

async function save() {
  if (!form.value.title.trim()) {
    error.value = '请输入标题'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const payload = {
      title: form.value.title.trim(),
      targetDate: form.value.targetDate instanceof Date ? form.value.targetDate.toISOString() : new Date(form.value.targetDate).toISOString(),
      type: form.value.type,
      note: form.value.note.trim() || undefined,
      reminderDays: form.value.reminderDays
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((item) => !Number.isNaN(item) && item > 0)
    }

    if (editing.value) {
      await api(`/anniversaries/${editing.value}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })
    } else {
      await api('/anniversaries', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    }

    form.value = createAnniversaryForm()
    editing.value = null
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['anniversaries'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] })
    ])
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '保存失败，请重试'
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!confirm('确定要删除这个纪念日吗？')) return
  error.value = ''
  try {
    await api(`/anniversaries/${id}`, { method: 'DELETE' })
    if (editing.value === id) cancelEdit()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['anniversaries'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] })
    ])
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '删除失败，请重试'
  }
}

function startEdit(item: any) {
  editing.value = item.id
  form.value = {
    title: item.title,
    targetDate: new Date(item.targetDate),
    type: item.type,
    reminderDays: (item.reminderDays ?? []).join(', '),
    note: item.note ?? ''
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editing.value = null
  form.value = createAnniversaryForm()
}

function computeDays(item: any) {
  const target = getDatePartsInAppTimeZone(item.targetDate)
  const today = getDatePartsInAppTimeZone(new Date())
  if (!target || !today) return '0 天'

  if (item.type === 'countup') {
    const diff = Date.UTC(today.year, today.month - 1, today.day) - Date.UTC(target.year, target.month - 1, target.day)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return days >= 0 ? `${days} 天` : `还有 ${Math.abs(days)} 天`
  }

  // countdown: find next occurrence
  let nextYear = today.year
  if (target.month < today.month || (target.month === today.month && target.day < today.day)) {
    nextYear += 1
  }
  const diff = Date.UTC(nextYear, target.month - 1, target.day) - Date.UTC(today.year, today.month - 1, today.day)
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days === 0 ? '就是今天 🎉' : `${days} 天`
}

function createAnniversaryForm() {
  return {
    title: '',
    targetDate: new Date(),
    type: 'countdown',
    reminderDays: '30,7,1',
    note: ''
  }
}

function formatAnniversaryDate(value: string) {
  return formatDateInAppTimeZone(value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.anniversaries-page {
  gap: 1.4rem;
}

.anniversaries-hero,
.anniversary-form-card {
  display: grid;
  gap: 1rem;
}

.anniversaries-hero h1,
.anniversary-card h2,
.feedback {
  margin: 0;
}

.anniversary-form-grid,
.anniversary-grid {
  display: grid;
  gap: 1.5rem;
}

.anniversary-form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.anniversary-actions {
  display: flex;
  justify-content: flex-start;
  gap: 0.8rem;
  margin-top: 0.5rem;
}

.anniversary-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.anniversary-card {
  display: grid;
  gap: 0.9rem;
  transition: box-shadow 220ms ease;
}

.anniversary-card.card-editing {
  box-shadow:
    0 0 0 2px var(--accent-strong),
    var(--shadow-soft);
}

.anniversary-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.anniversary-type {
  text-transform: capitalize;
}

.anniversary-days {
  color: var(--accent-strong);
  font-size: clamp(1.6rem, 5vw, 2.4rem);
  line-height: 1;
}

.anniversary-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding-top: 0.2rem;
  border-top: 1px solid var(--outline);
}

.anniversary-date {
  color: var(--text-soft);
  font-weight: 700;
  font-size: 0.88rem;
}

.anniversary-card-ops {
  display: flex;
  gap: 0.4rem;
}

.button-icon-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  padding: 0;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-faint);
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease;
}

.button-icon-sm:hover {
  background: var(--accent-soft);
  color: var(--text);
}

.button-icon-sm.danger:hover {
  background: rgba(220, 80, 60, 0.12);
  color: #c0392b;
}

@media (max-width: 720px) {
  .anniversary-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
