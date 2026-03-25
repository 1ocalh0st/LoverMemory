import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './lib/session'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      meta: { requiresAuth: false, requiresPairing: false },
      component: () => import('./pages/AuthPage.vue')
    },
    {
      path: '/pairing',
      name: 'pairing',
      meta: { requiresAuth: true, requiresPairing: false },
      component: () => import('./pages/PairingPage.vue')
    },
    {
      path: '/invite',
      name: 'invite',
      meta: { requiresAuth: true, requiresPairing: false },
      component: () => import('./pages/InvitePage.vue')
    },
    {
      path: '/',
      component: () => import('./components/Shell.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('./pages/HomePage.vue')
        },
        {
          path: 'timeline',
          name: 'timeline',
          component: () => import('./pages/TimelinePage.vue')
        },
        {
          path: 'gallery',
          name: 'gallery',
          component: () => import('./pages/GalleryPage.vue')
        },
        {
          path: 'anniversaries',
          name: 'anniversaries',
          component: () => import('./pages/AnniversariesPage.vue')
        },
        {
          path: 'wishlist',
          name: 'wishlist',
          component: () => import('./pages/WishlistPage.vue')
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('./pages/SettingsPage.vue')
        }
      ]
    }
  ]
})

router.beforeEach(authGuard)
