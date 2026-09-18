<template>
  <div class="login">
    <!-- 已登录 -->
    <template v-if="currentUserRole !== 'guest'">
      <span>
        你好，{{ currentUsername }} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 身份：{{ currentUserRole }}
      </span>
      <button v-if="currentUserRole == 'admin'" @click="gotoUserAdmin">用户管理</button>
      <button @click="logout">退出</button>
    </template>

    <!-- 未登录 -->
    <button v-else @click="openLogin">登录 / 注册</button>

    <!-- 登录弹窗 -->
    <LoginModal v-if="showLogin" @close="closeLogin" @login-success="handleLoginSuccess" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import LoginModal from './LoginMod.vue'

const emit = defineEmits(['login-success'])
const showLogin = ref(false)
const router = useRouter()

// 当前登录用户role和username
const currentUserRole = ref('guest')
const currentUsername = ref('')

// Fireman 最新监测数据
const latestMonitorData = ref(null)

const gotoUserAdmin = () => {
  router.push('/UserAdmin')
}

// 页面加载时读取 sessionStorage
onMounted(async () => {
  const access = sessionStorage.getItem('access')
  currentUserRole.value = access ? access : 'guest'
  currentUsername.value = sessionStorage.getItem('username') || ''

  if (currentUserRole.value === 'fireman') {
    await fetchLatestMonitorData()
  }
  if (currentUserRole.value === 'forestguard') {
    await fetchPendingPestCount()
  }
})

// 打开登录弹窗
const openLogin = () => {
  showLogin.value = true
}

// 关闭弹窗
const closeLogin = () => {
  showLogin.value = false
}

// 登录成功回调
const handleLoginSuccess = async (user) => {
  currentUserRole.value = user.access
  currentUsername.value = user.username

  // 保存到 sessionStorage
  sessionStorage.setItem('access', user.access)
  sessionStorage.setItem('username', user.username)
  if (user.token) sessionStorage.setItem('atoken', user.token)

  emit('login-success', user)
  closeLogin()

  if (user.access === 'fireman') {
    await fetchLatestMonitorData()
    if (latestMonitorData.value) {
      alert(
        `🌲 最新森林监测数据：
        温度: ${latestMonitorData.value.temperature}℃
        湿度: ${latestMonitorData.value.humidity}%
        降水: ${latestMonitorData.value.precipitation}mm
        风速: ${latestMonitorData.value.wind_speed}m/s
        土壤湿度: ${latestMonitorData.value.soil_moisture}%`,
      )
    }
  }

  if (user.access === 'forestguard') {
    await fetchPendingPestCount()
  }
}

// Fireman 最新监测数据
const fetchLatestMonitorData = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/monitor/latest')
    latestMonitorData.value = res.data || null
  } catch (err) {
    console.error('获取最新监测数据失败', err)
    latestMonitorData.value = null
  }
}

// Forestguard 未处理害虫数量
const fetchPendingPestCount = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/pestfind/pending-count')
    const count = res.data.count

    if (count > 0) {
      alert(`🐞 当前还有 ${count} 条害虫检测记录未处理，请及时处置！`)
    } else {
      alert('🐞 当前没有未处理害虫任务 👍')
    }
  } catch (err) {
    console.error('获取害虫任务失败', err)
  }
}

// 退出登录
const logout = () => {
  sessionStorage.removeItem('access')
  sessionStorage.removeItem('username')
  sessionStorage.removeItem('atoken')

  currentUserRole.value = 'guest'
  currentUsername.value = ''
  latestMonitorData.value = null

  emit('login-success', { access: 'guest', username: '' })
  router.replace('/')
}
</script>

<style scoped>
button {
  margin: 0 10px;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: linear-gradient(135deg, #00d4ff, #00ffa6);
  font-weight: bold;
  color: #000;
  cursor: pointer;
}
span {
  margin-right: 10px;
  font-weight: bold;
}
</style>
