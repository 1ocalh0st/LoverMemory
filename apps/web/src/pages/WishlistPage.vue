<template>
  <div class="page wishlist-page">
    <section class="section-card wishlist-hero">
      <span class="eyebrow">未来计划</span>
      <h1 class="display-lg">{{ t('wishlist.title') }}</h1>
      <p class="body-lg">把想去的地方、想一起度过的仪式感和对未来的承诺，收纳在这个精致的清单里，而不是随意记在草稿箱中。</p>
    </section>

    <section class="section-card wishlist-form-card">
      <div class="wishlist-form-grid">
        <label class="field-block">
          <span class="field-label">标题</span>
          <input v-model="form.title" class="field" placeholder="海边周末、陶艺课、安静的晚餐..." />
        </label>

        <div class="field-block">
          <span class="field-label">状态</span>
          <div class="pill-row">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              class="pill-button"
              :class="{ active: form.status === option.value }"
              @click="form.status = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="field-block">
          <span class="field-label">优先级</span>
          <div class="pill-row">
            <button
              v-for="option in priorityOptions"
              :key="option.value"
              class="pill-button"
              :class="{ active: form.priority === option.value }"
              @click="form.priority = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <label class="field-block">
          <span class="field-label">备注</span>
          <textarea v-model="form.note" class="textarea" rows="2" placeholder="为什么想去，要带什么，你在憧憬什么..."></textarea>
        </label>
      </div>

      <div class="wishlist-actions">
        <button class="button-primary" :disabled="saving" @click="save">
          {{ editing ? '保存修改' : t('actions.addWishlist') }}
        </button>
        <button v-if="editing" class="button-ghost" @click="cancelEdit">取消</button>
      </div>
    </section>

    <!-- Filter tabs -->
    <div v-if="wishlistQuery.data.value?.items.length" class="wishlist-filters">
      <button
        v-for="tab in filterTabs"
        :key="tab.value"
        class="pill-button pill-button--filter"
        :class="{ active: activeFilter === tab.value }"
        @click="activeFilter = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="filter-count">{{ tab.count }}</span>
      </button>
    </div>

    <section v-if="filteredItems.length" class="wishlist-grid">
      <article
        v-for="item in filteredItems"
        :key="item.id"
        class="section-card wishlist-card"
        :class="[
          `wishlist-card--${item.status}`,
          { 'card-editing': editing === item.id }
        ]"
      >
        <div class="wishlist-card-top">
          <span class="eyebrow wishlist-status" :class="`status-${item.status}`">{{ statusLabel(item.status) }}</span>
          <span class="wishlist-priority">P{{ item.priority }}</span>
        </div>
        <h2 class="headline-md">{{ item.title }}</h2>
        <p class="body-lg">{{ item.note || '还在等待细节，但值得珍藏。' }}</p>
        <div class="wishlist-card-bottom">
          <div class="wishlist-card-quick-ops">
            <button
              v-if="item.status !== 'completed'"
              class="button-complete"
              title="标记为已完成"
              @click="markComplete(item)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              已完成
            </button>
            <button
              v-else
              class="button-reopen"
              title="重新打开"
              @click="reopen(item)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              重新打开
            </button>
          </div>
          <div class="wishlist-card-ops">
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
    <div v-else-if="!wishlistQuery.data.value?.items.length" class="empty-state">{{ t('wishlist.empty') }}</div>
    <div v-else class="empty-state">当前筛选条件下没有愿望</div>

    <p v-if="error" class="feedback status-note">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api, ApiError } from '@/lib/api'

const { t } = useI18n()
const queryClient = useQueryClient()
const saving = ref(false)
const error = ref('')
const editing = ref<string | null>(null)
const activeFilter = ref('all')

const statusOptions = [
  { value: 'dreaming', label: '构思中' },
  { value: 'planning', label: '计划中' },
  { value: 'completed', label: '已完成' }
]

const priorityOptions = [
  { value: 1, label: '高优先级 (P1)' },
  { value: 2, label: '中优先级 (P2)' },
  { value: 3, label: '低优先级 (P3)' }
]

const form = ref(createWishlistForm())

const wishlistQuery = useQuery({
  queryKey: ['wishlist'],
  queryFn: () => api<any>('/wishlist')
})

const filterTabs = computed(() => {
  const items = wishlistQuery.data.value?.items ?? []
  return [
    { value: 'all', label: '全部', count: items.length },
    { value: 'dreaming', label: '构思中', count: items.filter((i: any) => i.status === 'dreaming').length },
    { value: 'planning', label: '计划中', count: items.filter((i: any) => i.status === 'planning').length },
    { value: 'completed', label: '已完成', count: items.filter((i: any) => i.status === 'completed').length }
  ]
})

const filteredItems = computed(() => {
  const items = wishlistQuery.data.value?.items ?? []
  if (activeFilter.value === 'all') return items
  return items.filter((i: any) => i.status === activeFilter.value)
})

function statusLabel(status: string) {
  const map: Record<string, string> = {
    dreaming: '构思中',
    planning: '计划中',
    completed: '已完成'
  }
  return map[status] ?? status
}

function createWishlistForm() {
  return {
    title: '',
    status: 'dreaming',
    priority: 2,
    note: ''
  }
}

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
      status: form.value.status,
      priority: form.value.priority,
      note: form.value.note.trim() || undefined
    }

    if (editing.value) {
      await api(`/wishlist/${editing.value}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })
    } else {
      await api('/wishlist', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    }

    form.value = createWishlistForm()
    editing.value = null
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] })
    ])
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '保存失败，请重试'
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!confirm('确定要删除这个愿望吗？')) return
  error.value = ''
  try {
    await api(`/wishlist/${id}`, { method: 'DELETE' })
    if (editing.value === id) cancelEdit()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] })
    ])
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '删除失败，请重试'
  }
}

async function markComplete(item: any) {
  try {
    await api(`/wishlist/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' })
    })
    await queryClient.invalidateQueries({ queryKey: ['wishlist'] })
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '操作失败'
  }
}

async function reopen(item: any) {
  try {
    await api(`/wishlist/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'planning' })
    })
    await queryClient.invalidateQueries({ queryKey: ['wishlist'] })
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '操作失败'
  }
}

function startEdit(item: any) {
  editing.value = item.id
  form.value = {
    title: item.title,
    status: item.status,
    priority: item.priority,
    note: item.note ?? ''
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editing.value = null
  form.value = createWishlistForm()
}
</script>

<style scoped>
.wishlist-page {
  gap: 1.4rem;
}

.wishlist-hero,
.wishlist-form-card,
.wishlist-card {
  display: grid;
  gap: 1.25rem;
}

.wishlist-form-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.wishlist-hero h1,
.wishlist-card h2,
.feedback {
  margin: 0;
}

.wishlist-actions {
  display: flex;
  justify-content: flex-start;
  gap: 0.8rem;
  margin-top: 0.5rem;
}

.wishlist-filters {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.pill-button--filter {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.35rem;
  border-radius: var(--radius-sm);
  background: var(--outline);
  font-size: 0.72rem;
  font-weight: 800;
}

.pill-button--filter.active .filter-count {
  background: rgba(255, 255, 255, 0.28);
}

.wishlist-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.wishlist-card {
  transition: box-shadow 220ms ease, opacity 220ms ease;
}

.wishlist-card.card-editing {
  box-shadow:
    0 0 0 2px var(--accent-strong),
    var(--shadow-soft);
}

.wishlist-card--completed {
  opacity: 0.7;
}

.wishlist-card--completed .headline-md {
  text-decoration: line-through;
  text-decoration-thickness: 2px;
  text-decoration-color: var(--accent);
}

.wishlist-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.wishlist-status {
  text-transform: none;
  letter-spacing: 0.02em;
}

.status-dreaming {
  background: rgba(255, 210, 170, 0.35);
  color: #b07040;
}

.status-planning {
  background: rgba(170, 210, 255, 0.35);
  color: #4070b0;
}

.status-completed {
  background: rgba(170, 230, 180, 0.35);
  color: #3a8045;
}

.wishlist-priority {
  color: var(--accent-strong);
  font-weight: 800;
}

.wishlist-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding-top: 0.3rem;
  border-top: 1px solid var(--outline);
}

.wishlist-card-quick-ops {
  display: flex;
  gap: 0.5rem;
}

.button-complete,
.button-reopen {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 0;
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease;
}

.button-complete {
  background: rgba(170, 230, 180, 0.25);
  color: #3a8045;
}

.button-complete:hover {
  background: rgba(170, 230, 180, 0.5);
}

.button-reopen {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.button-reopen:hover {
  background: var(--accent-soft-strong);
}

.wishlist-card-ops {
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
  .wishlist-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
