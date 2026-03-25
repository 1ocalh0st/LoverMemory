import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { router } from './router'
import { i18n } from './i18n'
import '@vuepic/vue-datepicker/dist/main.css'
import './styles.css'

const app = createApp(App)
const queryClient = new QueryClient()

registerSW({ immediate: true })

app.use(router)
app.use(i18n)
app.use(VueQueryPlugin, { queryClient })
app.mount('#app')
