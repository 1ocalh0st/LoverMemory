<template>
  <div class="page">
    <header class="page-header">
      <h1>{{ t('wishlist.title') }}</h1>
      <p>Track places to go, rituals to try, and promises you want to keep together.</p>
    </header>

    <section class="glass section-card wishlist-form">
      <input v-model="form.title" class="field" placeholder="Wishlist title" />
      <select v-model="form.status" class="select">
        <option value="dreaming">Dreaming</option>
        <option value="planning">Planning</option>
        <option value="completed">Completed</option>
      </select>
      <select v-model.number="form.priority" class="select">
        <option :value="1">High priority</option>
        <option :value="2">Medium priority</option>
        <option :value="3">Low priority</option>
      </select>
      <textarea v-model="form.note" class="textarea" rows="4" placeholder="Notes"></textarea>
      <button class="button-primary" :disabled="saving" @click="save">{{ t('actions.addWishlist') }}</button>
    </section>

    <section v-if="wishlistQuery.data.value?.items.length" class="wishlist-columns">
      <article v-for="item in wishlistQuery.data.value?.items" :key="item.id" class="glass section-card wishlist-card">
        <small>{{ item.status }}</small>
        <h2>{{ item.title }}</h2>
        <p>{{ item.note }}</p>
        <span>Priority {{ item.priority }}</span>
      </article>
    </section>
    <div v-else class="empty-state">{{ t('wishlist.empty') }}</div>

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
  status: 'dreaming',
  priority: 2,
  note: ''
})

const wishlistQuery = useQuery({
  queryKey: ['wishlist'],
  queryFn: () => api<any>('/wishlist')
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await api('/wishlist', {
      method: 'POST',
      body: JSON.stringify(form.value)
    })
    form.value = {
      title: '',
      status: 'dreaming',
      priority: 2,
      note: ''
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] })
    ])
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Unable to save wishlist item'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.wishlist-form,
.wishlist-columns {
  display: grid;
  gap: 1rem;
}

.wishlist-columns {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.wishlist-card h2,
.wishlist-card p {
  margin: 0.4rem 0;
}

.wishlist-card small,
.wishlist-card span,
.feedback {
  color: var(--text-soft);
}
</style>
