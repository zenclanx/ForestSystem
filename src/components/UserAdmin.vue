<template>
  <div class="user-admin-page">
    <div class="page-header">
      <h1>用户管理 🧑‍💻</h1>
      <p class="page-desc">集中管理用户信息、权限、状态与积分</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <input
            v-model.trim="searchKeyword"
            type="text"
            placeholder="搜索用户名 / 邮箱 / 手机号"
          />
        </div>

        <select v-model="accessFilter">
          <option value="">全部权限</option>
          <option value="admin">admin</option>
          <option value="researcher">researcher</option>
          <option value="teacher">teacher</option>
          <option value="fireman">fireman</option>
          <option value="forestguard">forestguard</option>
          <option value="user">user</option>
        </select>

        <select v-model="statusFilter">
          <option value="">全部状态</option>
          <option value="在线中">在线中</option>
          <option value="离线">离线</option>
        </select>
      </div>

      <div class="toolbar-right">
        <button class="refresh-btn" @click="fetchUsers" :disabled="loading">
          {{ loading ? '刷新中...' : '刷新列表' }}
        </button>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="summary-cards">
      <div class="summary-card">
        <span class="label">用户总数</span>
        <span class="value">{{ userList.length }}</span>
      </div>
      <div class="summary-card">
        <span class="label">在线用户</span>
        <span class="value online-text">{{ onlineCount }}</span>
      </div>
      <div class="summary-card">
        <span class="label">当前页</span>
        <span class="value">{{ currentPage }}/{{ totalPages }}</span>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <table v-if="paginatedUsers.length > 0">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>手机号</th>
            <th>邮箱</th>
            <th>积分</th>
            <th>权限</th>
            <th>状态</th>
            <th>最近登录</th>
            <th>保存状态</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="user in paginatedUsers" :key="user.id">
            <td class="id-cell">{{ user.id }}</td>

            <td class="username-cell">
              <div class="username-main">{{ user.username }}</div>
            </td>

            <td>
              <input v-model.trim="user.phone" type="text" placeholder="手机号" />
            </td>

            <td>
              <input v-model.trim="user.email" type="text" placeholder="邮箱" />
            </td>

            <td>
              <input v-model.number="user.point" type="number" min="0" placeholder="积分" />
            </td>

            <td>
              <select v-model="user.access">
                <option value="admin">admin</option>
                <option value="researcher">researcher</option>
                <option value="teacher">teacher</option>
                <option value="fireman">fireman</option>
                <option value="forestguard">forestguard</option>
                <option value="user">user</option>
              </select>
            </td>

            <td>
              <span :class="['status-badge', user.status === '在线中' ? 'online' : 'offline']">
                {{ user.status }}
              </span>
            </td>

            <td class="time-cell">
              {{ formatTime(user.last_active) }}
            </td>

            <td>
              <span v-if="user.saving" class="save-state saving">保存中...</span>
              <span v-else-if="user.saveSuccess" class="save-state success">已保存</span>
              <span v-else-if="hasUserChanged(user)" class="save-state changed">待保存</span>
              <span v-else class="save-state idle">未修改</span>
            </td>

            <td>
              <div class="action-buttons">
                <button
                  class="save-btn"
                  @click="updateUser(user)"
                  :disabled="user.saving || !hasUserChanged(user)"
                >
                  {{ user.saving ? '保存中' : '保存' }}
                </button>

                <button
                  class="delete-btn"
                  @click="deleteUser(user)"
                  :disabled="user.access === 'admin'"
                  :title="user.access === 'admin' ? '管理员账号不建议直接删除' : ''"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="!loading" class="empty-state">
        <div class="empty-title">暂无符合条件的用户</div>
        <div class="empty-desc">可以尝试修改搜索条件或筛选项</div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="filteredUsers.length > 0" class="pagination">
      <div class="page-size-box">
        <span>每页显示</span>
        <select v-model.number="pageSize">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="20">20</option>
        </select>
        <span>条</span>
      </div>

      <div class="page-controls">
        <button @click="goToPrevPage" :disabled="currentPage === 1">上一页</button>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button @click="goToNextPage" :disabled="currentPage === totalPages">下一页</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

const userList = ref([])
const loading = ref(false)

const searchKeyword = ref('')
const accessFilter = ref('')
const statusFilter = ref('')

const currentPage = ref(1)
const pageSize = ref(10)

const getToken = () => sessionStorage.getItem('atoken')

const isValidPhone = (phone) => {
  if (!phone) return true
  return /^1\d{10}$|^\d{8,15}$/.test(String(phone).trim())
}

const isValidEmail = (email) => {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
}

const formatTime = (time) => {
  if (!time) return '从未登录'

  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '时间异常'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const normalizeUser = (u) => {
  const status = u.status || u.statu || '离线'

  return {
    ...u,
    status,
    phone: u.phone || '',
    email: u.email || '',
    point: Number(u.point || 0),
    access: u.access || 'user',
    last_active: u.last_active || null,

    saving: false,
    saveSuccess: false,

    originalData: {
      phone: u.phone || '',
      email: u.email || '',
      point: Number(u.point || 0),
      access: u.access || 'user',
    },
  }
}

const fetchUsers = async () => {
  const token = getToken()
  if (!token) {
    alert('请先登录')
    return
  }

  loading.value = true
  try {
    const res = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })

    userList.value = (res.data || []).map((u) => normalizeUser(u))

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value || 1
    }
  } catch (err) {
    console.error(err.response?.data || err)
    alert('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const hasUserChanged = (user) => {
  return (
    String(user.phone || '') !== String(user.originalData.phone || '') ||
    String(user.email || '') !== String(user.originalData.email || '') ||
    Number(user.point || 0) !== Number(user.originalData.point || 0) ||
    String(user.access || '') !== String(user.originalData.access || '')
  )
}

const validateUser = (user) => {
  if (!isValidPhone(user.phone)) {
    alert(`用户 ${user.username} 的手机号格式不正确`)
    return false
  }

  if (!isValidEmail(user.email)) {
    alert(`用户 ${user.username} 的邮箱格式不正确`)
    return false
  }

  if (user.point === '' || user.point === null || Number.isNaN(Number(user.point))) {
    alert(`用户 ${user.username} 的积分不能为空`)
    return false
  }

  if (Number(user.point) < 0) {
    alert(`用户 ${user.username} 的积分不能小于 0`)
    return false
  }

  if (!user.access) {
    alert(`用户 ${user.username} 的权限不能为空`)
    return false
  }

  return true
}

const updateUser = async (user) => {
  if (!hasUserChanged(user)) {
    alert(`用户 ${user.username} 没有修改内容`)
    return
  }

  if (!validateUser(user)) return

  try {
    const token = getToken()
    if (!token) {
      alert('请先登录')
      return
    }

    user.saving = true
    user.saveSuccess = false

    await axios.put(
      `/api/users/${user.id}`,
      {
        phone: user.phone,
        email: user.email,
        point: Number(user.point),
        access: user.access,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    user.originalData = {
      phone: user.phone || '',
      email: user.email || '',
      point: Number(user.point || 0),
      access: user.access || 'user',
    }

    user.saveSuccess = true
    setTimeout(() => {
      user.saveSuccess = false
    }, 1800)
  } catch (err) {
    console.error(err.response?.data || err)
    alert(`更新用户 ${user.username} 失败`)
  } finally {
    user.saving = false
  }
}

const deleteUser = async (user) => {
  if (user.access === 'admin') {
    alert('管理员账号不建议直接删除')
    return
  }

  const confirmed = confirm(`确定要删除用户 “${user.username}” 吗？此操作不可恢复。`)
  if (!confirmed) return

  try {
    const token = getToken()
    if (!token) {
      alert('请先登录')
      return
    }

    await axios.delete(`/api/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    userList.value = userList.value.filter((u) => u.id !== user.id)

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value || 1
    }

    alert('删除成功')
  } catch (err) {
    console.error(err.response?.data || err)
    alert('删除失败')
  }
}

const filteredUsers = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  return userList.value.filter((user) => {
    const matchKeyword =
      !keyword ||
      String(user.username || '')
        .toLowerCase()
        .includes(keyword) ||
      String(user.email || '')
        .toLowerCase()
        .includes(keyword) ||
      String(user.phone || '')
        .toLowerCase()
        .includes(keyword)

    const matchAccess = !accessFilter.value || user.access === accessFilter.value
    const matchStatus = !statusFilter.value || user.status === statusFilter.value

    return matchKeyword && matchAccess && matchStatus
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value))
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

const onlineCount = computed(() => {
  return userList.value.filter((u) => u.status === '在线中').length
})

const goToPrevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

watch([searchKeyword, accessFilter, statusFilter, pageSize], () => {
  currentPage.value = 1
})

onMounted(() => {
  window.scrollTo(0, 0)
  fetchUsers()
})
</script>

<style scoped>
.user-admin-page {
  min-height: 100vh;
  padding: 30px;
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
  background:
    radial-gradient(circle at top, rgba(0, 212, 255, 0.12), transparent 25%),
    linear-gradient(180deg, #08111f 0%, #05070f 100%);
  box-sizing: border-box;
}

.page-header {
  text-align: center;
  margin-bottom: 28px;
}

.page-header h1 {
  margin: 0 0 10px;
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #00d4ff, #00ffa6);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-desc {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  width: 280px;
  max-width: 100%;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.7));
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
}

.summary-card .label {
  display: block;
  color: #94a3b8;
  font-size: 13px;
  margin-bottom: 8px;
}

.summary-card .value {
  display: block;
  font-size: 28px;
  font-weight: 800;
  color: #f8fafc;
}

.online-text {
  color: #22c55e !important;
}

.table-container {
  overflow-x: auto;
  border-radius: 18px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
}

table {
  width: 100%;
  min-width: 1300px;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 12px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  vertical-align: middle;
}

th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: rgba(2, 6, 23, 0.95);
  color: #cbd5e1;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

tbody tr {
  transition: all 0.22s ease;
}

tbody tr:hover {
  background: rgba(0, 212, 255, 0.08);
}

.id-cell {
  color: #7dd3fc;
  font-weight: 700;
}

.username-cell {
  font-weight: 700;
}

.username-main {
  color: #f8fafc;
}

.time-cell {
  color: #cbd5e1;
  font-size: 13px;
  white-space: nowrap;
}

input,
select {
  width: 100%;
  min-width: 110px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  color: #f8fafc;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

input::placeholder {
  color: #94a3b8;
}

input:focus,
select:focus {
  border-color: #22d3ee;
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.15);
  background: rgba(34, 211, 238, 0.06);
}

select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 34px;
  background-image: url("data:image/svg+xml,%3Csvg fill='white' height='12' viewBox='0 0 24 24' width='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
  cursor: pointer;
}

select option {
  background: #0f172a;
  color: #f8fafc;
}

.status-badge {
  display: inline-block;
  min-width: 72px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.status-badge.online {
  background: rgba(34, 197, 94, 0.18);
  border: 1px solid rgba(34, 197, 94, 0.45);
  color: #4ade80;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.16);
}

.status-badge.offline {
  background: rgba(239, 68, 68, 0.16);
  border: 1px solid rgba(239, 68, 68, 0.45);
  color: #f87171;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.14);
}

.save-state {
  display: inline-block;
  min-width: 60px;
  font-size: 13px;
  font-weight: 700;
}

.save-state.saving {
  color: #38bdf8;
}

.save-state.success {
  color: #22c55e;
}

.save-state.changed {
  color: #f59e0b;
}

.save-state.idle {
  color: #94a3b8;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

button {
  border: none;
  border-radius: 10px;
  padding: 9px 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none !important;
}

.save-btn {
  background: linear-gradient(135deg, #06b6d4, #22d3ee);
  color: #082f49;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(34, 211, 238, 0.28);
}

.delete-btn {
  background: linear-gradient(135deg, #ef4444, #f87171);
  color: #fff;
}

.delete-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(248, 113, 113, 0.22);
}

.refresh-btn {
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(129, 140, 248, 0.24);
}

.pagination {
  margin-top: 20px;
  padding: 16px 18px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.14);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.page-size-box,
.page-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-size-box select {
  width: 90px;
  min-width: unset;
}

.page-info {
  color: #cbd5e1;
  font-weight: 700;
}

.loading {
  margin-top: 18px;
  text-align: center;
  color: #38bdf8;
  font-weight: 700;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.45);
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-title {
  font-size: 22px;
  font-weight: 800;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.empty-desc {
  color: #94a3b8;
  font-size: 14px;
}

.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-container::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #22d3ee, #10b981);
  border-radius: 999px;
}

.table-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.06);
}

@media (max-width: 992px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .toolbar,
  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right,
  .page-size-box,
  .page-controls {
    width: 100%;
    justify-content: flex-start;
  }

  .search-box {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .user-admin-page {
    padding: 18px;
  }

  .page-header h1 {
    font-size: 28px;
  }

  th,
  td {
    padding: 12px 10px;
  }

  button {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
