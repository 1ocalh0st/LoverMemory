import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Anniversaries from './views/Anniversaries.vue'
import Records from './views/Records.vue'
import NewMemory from './views/NewMemory.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/anniversaries',
    name: 'Anniversaries',
    component: Anniversaries
  },
  {
    path: '/records',
    name: 'Records',
    component: Records
  },
  {
    path: '/new-memory',
    name: 'NewMemory',
    component: NewMemory
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
