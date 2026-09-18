import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

const app = createApp(App)

// 全局 axios
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('atoken')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

app.use(router).mount('#app')
