<template>
  <div class="mailbox-page">
    <!-- 顶部说明 -->
    <section class="header-card">
      <div v-if="userRole === 'user'">
        <p class="page-badge">读者信箱</p>
        <h1>意见反馈与互动留言</h1>
        <p class="page-desc">
          欢迎提交你对森林科普内容、系统体验、生态保护建议等方面的意见。
          你可以查看自己的留言处理进度与回复内容。
        </p>
      </div>

      <div v-else>
        <p class="page-badge">留言管理</p>
        <h1>Mailbox Management Center</h1>
        <p class="page-desc">
          这里集中展示系统中的留言记录。管理员和教师可查看并处理全部留言，
          其他业务角色根据权限查看对应留言内容。
        </p>
      </div>
    </section>

    <!-- 统计卡片 -->
    <section v-if="userRole !== 'guest'" class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">
          {{ userRole === 'user' ? '我的留言' : '全部留言' }}
        </span>
        <h2>{{ totalCount }}</h2>
      </div>

      <div class="stat-card warning">
        <span class="stat-label">未处理</span>
        <h2>{{ pendingCount }}</h2>
      </div>

      <div class="stat-card success">
        <span class="stat-label">已回复</span>
        <h2>{{ repliedCount }}</h2>
      </div>
    </section>

    <section class="main-grid">
      <!-- 左侧：留言提交 -->
      <div class="panel submit-panel">
        <div class="panel-title">
          <h3>{{ userRole === 'user' ? '我要留言' : '提交新留言' }}</h3>
        </div>

        <div class="form-group">
          <label>留言标题</label>
          <input v-model="form.title" placeholder="请输入留言标题" maxlength="50" />
        </div>

        <div class="form-group">
          <label>留言内容</label>
          <textarea
            v-model="form.content"
            placeholder="请输入留言内容，建议不少于 5 个字"
            maxlength="500"
          ></textarea>
        </div>

        <div class="form-group">
          <label>联系方式（可选）</label>
          <input v-model="form.contact" placeholder="请输入手机号或邮箱" maxlength="100" />
        </div>

        <div class="form-footer">
          <span class="form-tip">标题最多 50 字，内容最多 500 字</span>
          <button @click="submit" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交留言' }}
          </button>
        </div>
      </div>

      <!-- 右侧：留言列表 -->
      <div class="panel list-panel">
        <div class="panel-title">
          <h3>{{ userRole === 'user' ? '我的留言列表' : '留言列表' }}</h3>
          <span v-if="userRole !== 'guest'" class="role-tip">当前身份：{{ userRole }}</span>
        </div>

        <template v-if="userRole !== 'guest'">
          <div class="toolbar">
            <input
              v-model="searchKeyword"
              class="toolbar-input"
              :placeholder="userRole === 'user' ? '按标题搜索我的留言' : '按标题搜索留言'"
            />

            <select v-model="statusFilter" class="toolbar-select">
              <option value="">全部状态</option>
              <option value="未处理">未处理</option>
              <option value="已回复">已回复</option>
            </select>

            <button class="refresh-btn" @click="loadMessages">刷新</button>
          </div>

          <div v-if="filteredMessages.length > 0" class="message-list">
            <div
              v-for="item in filteredMessages"
              :key="item.id"
              class="message-item"
              @click="goDetail(item.id)"
            >
              <div class="row">
                <strong>{{ item.title }}</strong>
                <span :class="['status-badge', item.status === '未处理' ? 'pending' : 'done']">
                  {{ item.status }}
                </span>
              </div>

              <div class="time">{{ formatDateTime(item.created_at) }}</div>
            </div>
          </div>

          <div v-else class="empty">
            {{ userRole === 'user' ? '你还没有留言记录' : '暂无符合条件的留言' }}
          </div>
        </template>

        <div v-else class="empty">游客无法查看留言列表，请先登录</div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const form = ref({
  title: '',
  content: '',
  contact: '',
})

const messages = ref([])
const submitting = ref(false)

const userRole = ref('guest')
const username = ref('guest')

const searchKeyword = ref('')
const statusFilter = ref('')

onMounted(() => {
  userRole.value = sessionStorage.getItem('access') || 'guest'
  username.value = sessionStorage.getItem('username') || 'guest'
  loadMessages()
})

const totalCount = computed(() => messages.value.length)
const pendingCount = computed(
  () => messages.value.filter((item) => item.status === '未处理').length,
)
const repliedCount = computed(
  () => messages.value.filter((item) => item.status === '已回复').length,
)

const filteredMessages = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  return messages.value.filter((item) => {
    const matchKeyword = !keyword || (item.title || '').toLowerCase().includes(keyword)
    const matchStatus = !statusFilter.value || item.status === statusFilter.value
    return matchKeyword && matchStatus
  })
})

const loadMessages = async () => {
  if (userRole.value === 'guest') {
    messages.value = []
    return
  }

  try {
    const res = await axios.get('/api/mailbox')
    messages.value = res.data || []
  } catch (err) {
    console.error('获取留言失败', err.response?.data || err)
  }
}

const goDetail = (id) => {
  if (
    userRole.value === 'admin' ||
    userRole.value === 'researcher' ||
    userRole.value === 'teacher'
  ) {
    router.push(`/message/${id}`)
  } else {
    router.push(`/message-watch/${id}`)
  }
}

const isValidContact = (value) => {
  if (!value) return true
  const phonePattern = /^1[3-9]\d{9}$/
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return phonePattern.test(value) || emailPattern.test(value)
}

const submit = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    alert('标题和内容不能为空')
    return
  }

  if (form.value.title.trim().length > 50) {
    alert('标题不能超过 50 个字')
    return
  }

  if (form.value.content.trim().length < 5) {
    alert('留言内容至少输入 5 个字')
    return
  }

  if (!isValidContact(form.value.contact.trim())) {
    alert('联系方式格式不正确，请输入手机号或邮箱')
    return
  }

  submitting.value = true

  try {
    await axios.post('/api/mailbox', {
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      contact: form.value.contact.trim(),
    })

    alert('提交成功')
    form.value.title = ''
    form.value.content = ''
    form.value.contact = ''
    loadMessages()
  } catch (err) {
    console.error('提交失败', err.response?.data || err)
    alert('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const formatDateTime = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}
</script>

<style scoped>
.mailbox-page {
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #0f172a, #08101f);
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
}

.header-card,
.panel,
.stat-card {
  background: rgba(17, 25, 40, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  border-radius: 18px;
}

.header-card {
  padding: 24px;
  margin-bottom: 18px;
}

.page-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.14);
  color: #67e8f9;
  font-size: 13px;
  margin-bottom: 14px;
}

.header-card h1 {
  font-size: 32px;
  margin-bottom: 12px;
}

.page-desc {
  color: #cbd5e1;
  line-height: 1.8;
  font-size: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}

.stat-card {
  padding: 20px;
  text-align: center;
}

.stat-label {
  display: block;
  color: #67e8f9;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-card h2 {
  font-size: 30px;
  color: #fff;
}

.stat-card.warning h2 {
  color: #fbbf24;
}

.stat-card.success h2 {
  color: #34d399;
}

.main-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 18px;
}

.panel {
  padding: 20px;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-title h3 {
  color: #38bdf8;
}

.role-tip {
  color: #94a3b8;
  font-size: 13px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #cbd5e1;
  font-size: 14px;
}

input,
textarea,
select {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  outline: none;
}

textarea {
  min-height: 140px;
  resize: vertical;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.form-tip {
  color: #94a3b8;
  font-size: 12px;
}

button {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: bold;
  cursor: pointer;
  background: linear-gradient(135deg, #22d3ee, #34d399);
  color: #04111d;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toolbar {
  display: grid;
  grid-template-columns: 1fr 180px 100px;
  gap: 12px;
  margin-bottom: 16px;
}

.message-list {
  display: grid;
  gap: 12px;
}

.message-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.message-item:hover {
  background: rgba(34, 211, 238, 0.08);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.pending {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}

.status-badge.done {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

.time {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 8px;
}

.empty {
  color: #94a3b8;
  text-align: center;
  padding: 30px 0;
}

@media (max-width: 900px) {
  .main-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }

  .form-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
