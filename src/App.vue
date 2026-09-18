<template>
  <!-- 未登录时，直接全屏显示启动登录页 -->
  <StartLogin v-if="!isLoggedIn" @login-success="handleStartLoginSuccess" />

  <!-- 已登录后，显示原系统 -->
  <div v-else class="app-shell">
    <div class="container">
      <!-- 顶部 -->
      <header class="topbar">
        <div class="brand-area">
          <div class="brand-text">
            <h1 class="system-title">
              {{ normalizedAccess === 'user' ? '森林公众服务系统' : '森林灾害防控与公众服务系统' }}
            </h1>
            <p class="system-subtitle">
              {{
                normalizedAccess === 'user'
                  ? '面向公众的信息服务与互动平台'
                  : '面向业务人员的森林信息管理与灾害防控平台'
              }}
            </p>
          </div>

          <!-- 非普通用户显示告警服务开关 -->
          <template v-if="normalizedAccess !== 'user'">
            <button class="btn btn-service" @click="toggleService">
              {{ serviceOn ? '告警服务：已开启' : '告警服务：已关闭' }}
            </button>

            <div
              v-if="serviceOn"
              style="width: 1px; height: 1px; overflow: hidden; position: absolute; top: -9999px"
            >
              <SendMail />
            </div>
          </template>
        </div>

        <!-- 用户信息 -->
        <div class="user-info">
          <template v-if="normalizedAccess !== 'guest'">
            <div class="user-card">
              <div class="user-welcome">你好，{{ user.username }}</div>
              <div class="user-meta">
                <span class="role-badge" :class="`role-${normalizedAccess}`">
                  {{ getRoleText(normalizedAccess) }}
                </span>
              </div>
            </div>

            <div class="topbar-actions">
              <button
                v-if="normalizedAccess === 'admin'"
                class="btn btn-primary"
                @click="gotoUserAdmin"
              >
                用户管理
              </button>

              <button class="btn btn-secondary" @click="openLogin">切换登录</button>
              <button class="btn btn-danger" @click="logout">退出登录</button>
            </div>
          </template>

          <button v-else class="btn btn-primary" @click="openLogin">登录 / 注册</button>

          <!-- 系统内弹窗登录 -->
          <LoginMod v-if="showLogin" @close="closeLogin" @login-success="handleLoginSuccess" />
        </div>
      </header>

      <!-- 主体 -->
      <div class="main">
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-title">功能导航</div>
            <div class="sidebar-subtitle">
              {{ normalizedAccess === 'user' ? '公众端菜单' : '业务端菜单' }}
            </div>
          </div>

          <!-- 用户版导航 -->
          <ul v-if="normalizedAccess === 'user'" class="menu-list">
            <li><router-link to="/user-home">用户首页</router-link></li>
            <li><router-link to="/user-forest">森林科普信息</router-link></li>
            <li><router-link to="/visual">可视化模块</router-link></li>
            <li><router-link to="/mailbox">读者信箱</router-link></li>
            <li><router-link to="/QuestionNaire">科研问卷</router-link></li>
            <li><router-link to="/PointShop">积分商城</router-link></li>
            <li><router-link to="/disease">病虫害检测</router-link></li>
          </ul>

          <!-- 业务版导航 -->
          <ul v-else class="menu-list">
            <li><router-link to="/">系统首页</router-link></li>
            <li><router-link to="/info">基本森林信息</router-link></li>
            <li><router-link to="/mailbox">读者信箱</router-link></li>

            <li v-if="normalizedAccess === 'fireman' || normalizedAccess === 'admin'">
              <router-link to="/disease">病虫害检测</router-link>
            </li>

            <!-- 研究员组 / 管理员 -->
            <li v-if="normalizedAccess === 'researcher' || normalizedAccess === 'admin'">
              <router-link to="/visual">可视化模块</router-link>
            </li>
            <li v-if="normalizedAccess === 'researcher' || normalizedAccess === 'admin'">
              <router-link to="/UpdateInfo">信息更新</router-link>
            </li>
            <li v-if="normalizedAccess === 'researcher' || normalizedAccess === 'admin'">
              <router-link to="/QuestionNaire">科研问卷</router-link>
            </li>
            <li v-if="normalizedAccess === 'researcher' || normalizedAccess === 'admin'">
              <router-link to="/PointShop">积分商城</router-link>
            </li>

            <!-- 消防员组 / 管理员 -->
            <li v-if="normalizedAccess === 'fireman' || normalizedAccess === 'admin'">
              <router-link to="/monitor">监控告警</router-link>
            </li>
            <li v-if="normalizedAccess === 'fireman' || normalizedAccess === 'admin'">
              <router-link to="/Disaster-Simulation">灾害模拟</router-link>
            </li>
            <li v-if="normalizedAccess === 'fireman' || normalizedAccess === 'admin'">
              <router-link to="/PestProcess">害虫处理</router-link>
            </li>

            <!-- 仅管理员 -->
            <li v-if="normalizedAccess === 'admin'">
              <router-link to="/UserAdmin">用户管理</router-link>
            </li>
          </ul>
        </aside>

        <section class="content">
          <router-view />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import LoginMod from './components/LoginMod.vue'
import StartLogin from './components/StartLogin.vue'
import SendMail from './components/SendMail.vue'
import axios from 'axios'

const router = useRouter()

// 告警服务开关
const serviceOn = ref(false)
const toggleService = () => {
  serviceOn.value = !serviceOn.value
}

// 弹窗登录控制
const showLogin = ref(false)
const openLogin = () => {
  showLogin.value = true
}
const closeLogin = () => {
  showLogin.value = false
}

// 当前用户信息
const user = ref({
  username: '',
  access: 'guest',
  token: '',
  role: '',
})

// 权限归并
const normalizedAccess = computed(() => {
  const accessMap = {
    admin: 'admin',
    researcher: 'researcher',
    teacher: 'researcher',
    fireman: 'fireman',
    forestguard: 'fireman',
    user: 'user',
    guest: 'guest',
  }

  return accessMap[user.value.access] || 'guest'
})

// 是否已登录
const isLoggedIn = computed(() => {
  return !!(user.value.username && normalizedAccess.value !== 'guest' && user.value.token)
})

// 心跳定时器
let heartbeatTimer = null

const getRoleText = (access) => {
  const roleMap = {
    admin: '管理员',
    researcher: '研究员',
    fireman: '消防员',
    user: '普通用户',
    guest: '游客',
  }
  return roleMap[access] || access
}

// 初始化用户信息
const initUserFromSession = () => {
  const token = sessionStorage.getItem('atoken')
  const username = sessionStorage.getItem('username')
  const access = sessionStorage.getItem('access')
  const role = sessionStorage.getItem('role')

  if (token && username && access) {
    user.value = {
      username,
      access,
      token,
      role: role || '',
    }
  } else {
    user.value = {
      username: '',
      access: 'guest',
      token: '',
      role: '',
    }
  }
}

// 心跳
const startHeartbeat = () => {
  if (!user.value.username || !user.value.token) return

  if (heartbeatTimer) clearInterval(heartbeatTimer)

  heartbeatTimer = setInterval(() => {
    console.log('发送心跳', new Date().toLocaleTimeString())
    axios
      .post(
        '/api/user/heartbeat',
        { username: user.value.username },
        { headers: { Authorization: `Bearer ${user.value.token}` } },
      )
      .then((res) => console.log('心跳返回', res.data))
      .catch((err) => console.warn('心跳发送失败', err.response?.data || err))
  }, 30000)
}

// 登录成功后的默认跳转
const goToRoleHome = (access) => {
  const accessMap = {
    admin: 'admin',
    researcher: 'researcher',
    teacher: 'researcher',
    fireman: 'fireman',
    forestguard: 'fireman',
    user: 'user',
    guest: 'guest',
  }

  const finalAccess = accessMap[access] || 'guest'

  if (finalAccess === 'user') {
    router.replace('/user-home')
  } else if (finalAccess === 'guest') {
    router.replace('/')
  } else {
    router.replace('/')
  }
}

const applyLoginData = (loginData, needClose = false) => {
  user.value.username = loginData.username
  user.value.access = loginData.access
  user.value.token = loginData.token
  user.value.role = loginData.role || ''

  sessionStorage.setItem('username', loginData.username)
  sessionStorage.setItem('access', loginData.access)
  sessionStorage.setItem('atoken', loginData.token)
  sessionStorage.setItem('role', loginData.role || '')

  if (needClose) closeLogin()

  startHeartbeat()
  goToRoleHome(loginData.access)
}

// 启动页登录成功
const handleStartLoginSuccess = (loginData) => {
  applyLoginData(loginData, false)
}

// 弹窗登录成功
const handleLoginSuccess = (loginData) => {
  applyLoginData(loginData, true)
}

// 退出登录
const logout = () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = null

  if (user.value.username && user.value.token) {
    axios
      .post(
        '/api/user/offline',
        { username: user.value.username },
        { headers: { Authorization: `Bearer ${user.value.token}` } },
      )
      .catch((err) => {
        console.error(err.response?.data || err)
      })
  }

  sessionStorage.removeItem('atoken')
  sessionStorage.removeItem('username')
  sessionStorage.removeItem('access')
  sessionStorage.removeItem('role')

  user.value = {
    username: '',
    access: 'guest',
    token: '',
    role: '',
  }

  router.replace('/')
}

// 管理员跳转
const gotoUserAdmin = () => {
  router.push('/UserAdmin')
}

onMounted(() => {
  initUserFromSession()
  if (isLoggedIn.value) {
    startHeartbeat()
  }
})

onUnmounted(() => {
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = null
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app-shell {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(0, 212, 255, 0.12), transparent 26%),
    linear-gradient(180deg, #eaf2f8 0%, #dce8f2 100%);
}

.container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(4px);
}

/* 顶部栏 */
.topbar {
  min-height: 86px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  color: #fff;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #0f3b57 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.system-title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #ffffff, #c7f9ff, #9ef5d0);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.system-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #cbd5e1;
  letter-spacing: 0.3px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.user-welcome {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  border: 1px solid transparent;
  white-space: nowrap;
}

.role-admin {
  background: rgba(239, 68, 68, 0.16);
  color: #fda4af;
  border-color: rgba(239, 68, 68, 0.35);
}

.role-researcher {
  background: rgba(59, 130, 246, 0.16);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.35);
}

.role-fireman {
  background: rgba(249, 115, 22, 0.16);
  color: #fdba74;
  border-color: rgba(249, 115, 22, 0.35);
}

.role-user {
  background: rgba(6, 182, 212, 0.16);
  color: #67e8f9;
  border-color: rgba(6, 182, 212, 0.35);
}

.role-guest {
  background: rgba(148, 163, 184, 0.16);
  color: #cbd5e1;
  border-color: rgba(148, 163, 184, 0.35);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 按钮 */
.btn {
  border: none;
  border-radius: 12px;
  padding: 9px 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.22s ease;
  white-space: nowrap;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #06b6d4, #22d3ee);
  color: #082f49;
  box-shadow: 0 8px 18px rgba(34, 211, 238, 0.22);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.16);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #f87171);
  color: #fff;
  box-shadow: 0 8px 18px rgba(248, 113, 113, 0.2);
}

.btn-service {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: #052e2b;
  box-shadow: 0 8px 18px rgba(52, 211, 153, 0.22);
}

/* 主体布局 */
.main {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 240px;
  padding: 18px 14px;
  background: linear-gradient(180deg, #0f172a 0%, #162236 100%);
  color: #fff;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.03);
}

.sidebar-header {
  padding: 10px 10px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 14px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 900;
  color: #f8fafc;
}

.sidebar-subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.menu-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu-list li {
  margin-bottom: 8px;
}

.sidebar :deep(a) {
  position: relative;
  display: block;
  width: 100%;
  padding: 12px 14px 12px 16px;
  border-radius: 12px;
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.2s ease;
  background: transparent;
}

.sidebar :deep(a:hover) {
  background: rgba(34, 211, 238, 0.08);
  color: #ffffff;
  transform: translateX(2px);
}

.sidebar :deep(a.router-link-active) {
  color: #ffffff;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.24), rgba(34, 211, 238, 0.14));
  border: 1px solid rgba(34, 211, 238, 0.28);
  box-shadow: 0 8px 20px rgba(34, 211, 238, 0.08);
}

.sidebar :deep(a.router-link-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(180deg, #22d3ee, #10b981);
}

/* 内容区 */
.content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 0;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 22%),
    linear-gradient(180deg, #f3f7fb 0%, #eaf1f7 100%);
}

.content::-webkit-scrollbar,
.sidebar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.content::-webkit-scrollbar-thumb,
.sidebar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #22d3ee, #10b981);
  border-radius: 999px;
}

.content::-webkit-scrollbar-track,
.sidebar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
}

/* 响应式 */
@media (max-width: 1100px) {
  .topbar {
    padding: 16px 18px;
    align-items: flex-start;
    flex-direction: column;
  }

  .user-info {
    width: 100%;
    justify-content: space-between;
  }

  .user-card {
    align-items: flex-start;
  }
}

@media (max-width: 900px) {
  .sidebar {
    width: 210px;
  }

  .system-title {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .main {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .system-title {
    font-size: 22px;
  }

  .topbar-actions {
    width: 100%;
  }

  .btn {
    flex: 1;
    text-align: center;
  }
}
</style>
