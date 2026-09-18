<template>
  <div class="message-page">
    <div class="page-card">
      <div class="page-head">
        <h1>留言处理</h1>
        <div class="head-actions">
          <button @click="goBack">返回列表</button>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <template v-else-if="message">
        <div class="info-grid">
          <div class="info-item">
            <span>标题</span>
            <strong>{{ message.title }}</strong>
          </div>
          <div class="info-item">
            <span>状态</span>
            <strong :class="message.status === '未处理' ? 'pending' : 'done'">
              {{ message.status }}
            </strong>
          </div>
          <div class="info-item">
            <span>提交用户</span>
            <strong>{{ message.username || '--' }}</strong>
          </div>
          <div class="info-item">
            <span>用户身份</span>
            <strong>{{ message.user_role || '--' }}</strong>
          </div>
          <div class="info-item">
            <span>联系方式</span>
            <strong>{{ message.contact || '未填写' }}</strong>
          </div>
          <div class="info-item">
            <span>提交时间</span>
            <strong>{{ formatDateTime(message.created_at) }}</strong>
          </div>
        </div>

        <div class="block">
          <h3>留言内容</h3>
          <div class="content-box">{{ message.content || '暂无内容' }}</div>
        </div>

        <div class="block">
          <h3>当前回复</h3>
          <div class="content-box">{{ message.answer || '暂未回复' }}</div>
        </div>

        <div class="block" v-if="canReply">
          <h3>{{ message.answer ? '修改回复' : '填写回复' }}</h3>
          <textarea v-model="replyText" placeholder="请输入回复内容" maxlength="500"></textarea>

          <div class="reply-footer">
            <span class="tip">回复内容最多 500 字</span>
            <button @click="submitReply" :disabled="replying">
              {{ replying ? '提交中...' : '提交回复' }}
            </button>
          </div>
        </div>

        <div v-else class="no-auth">当前身份无回复权限</div>
      </template>

      <div v-else class="loading">留言不存在或加载失败</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const replying = ref(false)
const message = ref(null)
const replyText = ref('')

const userRole = sessionStorage.getItem('access') || 'guest'
const canReply = computed(() => userRole === 'admin' || userRole === 'teacher')

const loadMessage = async () => {
  loading.value = true
  try {
    const res = await axios.get(`/api/mailbox/${route.params.id}`)
    message.value = res.data || null
    replyText.value = res.data?.answer || ''
  } catch (err) {
    console.error('获取留言详情失败', err.response?.data || err)
    message.value = null
  } finally {
    loading.value = false
  }
}

const submitReply = async () => {
  if (!canReply.value) {
    alert('当前身份无回复权限')
    return
  }

  if (!replyText.value.trim()) {
    alert('回复内容不能为空')
    return
  }

  replying.value = true
  try {
    await axios.post('/api/mailbox/reply', {
      id: route.params.id,
      reply: replyText.value.trim(),
      user_role: userRole,
    })

    alert('回复成功')
    loadMessage()
  } catch (err) {
    console.error('回复失败', err.response?.data || err)
    alert(err.response?.data?.message || '回复失败')
  } finally {
    replying.value = false
  }
}

const goBack = () => {
  router.push('/mailbox')
}

const formatDateTime = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

onMounted(() => {
  loadMessage()
})
</script>

<style scoped>
.message-page {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(180deg, #0f172a, #08101f);
  color: #e5e7eb;
  box-sizing: border-box;
}

.page-card {
  background: rgba(17, 25, 40, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  border-radius: 18px;
  padding: 24px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.page-head h1 {
  font-size: 30px;
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

.loading,
.no-auth {
  color: #94a3b8;
  text-align: center;
  padding: 20px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 18px;
}

.info-item,
.content-box {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 14px;
}

.info-item span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
}

.info-item strong {
  line-height: 1.6;
}

.pending {
  color: #fca5a5;
}

.done {
  color: #86efac;
}

.block {
  margin-bottom: 18px;
}

.block h3 {
  color: #38bdf8;
  margin-bottom: 12px;
}

.content-box {
  white-space: pre-wrap;
  line-height: 1.8;
}

textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 160px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  outline: none;
  resize: vertical;
}

.reply-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  gap: 12px;
}

.tip {
  color: #94a3b8;
  font-size: 12px;
}

@media (max-width: 800px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .reply-footer,
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
