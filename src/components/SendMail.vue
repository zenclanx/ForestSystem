<template>
  <div class="send-mail-page">
    <!-- 顶部说明 -->
    <section class="hero-panel">
      <div class="hero-left">
        <p class="badge">告警邮件中心</p>
        <h1>环境告警通知与联系人管理</h1>
        <p class="hero-desc">
          支持手动发送邮件、自动风险告警、联系人维护、告警参数调整与日志查看。
        </p>
      </div>

      <div class="hero-actions">
        <button class="action-btn" @click="goBack">返回监控中心</button>
      </div>
    </section>

    <div class="main-grid">
      <!-- 左侧 -->
      <div class="panel">
        <div class="panel-title">
          <h2>手动邮件发送</h2>
        </div>

        <div class="form-group">
          <label>邮件主题</label>
          <input v-model="subject" placeholder="请输入邮件主题" />
        </div>

        <div class="form-group">
          <label>邮件内容</label>
          <textarea v-model="text" placeholder="请输入邮件内容"></textarea>
        </div>

        <div class="button-row">
          <button class="primary-btn" @click="send">发送邮件</button>
          <button class="secondary-btn" @click="sendTestAlert">发送测试告警</button>
        </div>

        <p class="message" :class="messageType">{{ message }}</p>

        <div class="divider"></div>

        <div class="panel-title">
          <h2>联系人管理</h2>
          <span class="panel-tip">当前 {{ contacts.length }} 人</span>
        </div>

        <div class="contact-form">
          <input v-model="newContact.name" placeholder="联系人姓名" />
          <input v-model="newContact.mail" placeholder="联系人邮箱" />
          <button class="primary-btn" @click="addContact">添加联系人</button>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>邮箱</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="contacts.length === 0">
                <td colspan="3" class="empty-cell">暂无联系人，请先添加联系人</td>
              </tr>
              <tr v-for="contact in contacts" :key="contact.mail">
                <td>{{ contact.name }}</td>
                <td>{{ contact.mail }}</td>
                <td>
                  <button class="danger-btn small-btn" @click="removeContact(contact.mail)">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 右侧 -->
      <div class="panel">
        <div class="panel-title">
          <h2>最新监测数据</h2>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <span>温度</span>
            <strong>{{ latestData?.temperature ?? '--' }} ℃</strong>
          </div>
          <div class="summary-card">
            <span>湿度</span>
            <strong>{{ latestData?.humidity ?? '--' }} %</strong>
          </div>
          <div class="summary-card">
            <span>降水</span>
            <strong>{{ latestData?.precipitation ?? '--' }} mm</strong>
          </div>
          <div class="summary-card">
            <span>风速</span>
            <strong>{{ latestData?.wind_speed ?? '--' }} m/s</strong>
          </div>
          <div class="summary-card">
            <span>风向</span>
            <strong>{{ latestData?.wind_direction || '--' }}</strong>
          </div>
          <div class="summary-card">
            <span>土壤湿度</span>
            <strong>{{ latestData?.soil_moisture ?? '--' }} %</strong>
          </div>
        </div>

        <div class="risk-card" :class="riskInfo.className">
          <span>当前风险等级</span>
          <strong>{{ riskInfo.label }}</strong>
          <p>{{ riskInfo.desc }}</p>
          <p class="data-time">数据时间：{{ formatDate(latestData?.record_time) }}</p>
        </div>

        <div class="divider"></div>

        <div class="panel-title">
          <h2>告警状态</h2>
        </div>

        <div class="status-list">
          <div class="status-item">
            <span>自动告警状态</span>
            <strong>{{ isPaused ? '已暂停' : '运行中' }}</strong>
          </div>
          <div class="status-item">
            <span>上次告警发送时间</span>
            <strong>{{ lastAlertTime ? lastAlertTime.toLocaleTimeString() : '未发送' }}</strong>
          </div>
          <div class="status-item">
            <span>下次检测倒计时</span>
            <strong>{{ nextCheckCountdown }} 秒</strong>
          </div>
          <div class="status-item">
            <span>联系人数量</span>
            <strong>{{ contacts.length }} 人</strong>
          </div>
        </div>

        <div class="button-row">
          <button class="warning-btn" @click="togglePause">
            {{ isPaused ? '继续告警' : '暂停告警' }}
          </button>
        </div>

        <div class="divider"></div>

        <div class="panel-title">
          <h2>告警参数调整</h2>
          <span class="panel-tip">修改后下个周期生效</span>
        </div>

        <div class="form-group">
          <label>告警检测间隔（秒）</label>
          <input type="number" v-model.number="nextAlertIntervalSeconds" min="5" />
        </div>

        <div class="form-group">
          <label>告警最小间隔（分钟）</label>
          <input type="number" v-model.number="nextMinAlertMinutes" min="0.1" step="0.1" />
        </div>

        <div class="divider"></div>

        <div class="panel-title">
          <h2>告警日志</h2>
          <span class="panel-tip">最多保留 50 条</span>
        </div>

        <div class="log-list">
          <div v-if="alertLogs.length === 0" class="empty-log">暂无日志</div>

          <div v-for="(log, index) in alertLogs" :key="index" class="log-item" :class="log.type">
            {{ log.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const goBack = () => {
  router.push('/monitor')
}

const subject = ref('')
const text = ref('')
const message = ref('')
const messageType = ref('')

const contacts = ref([])
const newContact = ref({ name: '', mail: '' })

const latestData = ref(null)
const lastAlertTime = ref(null)
const alertLogs = ref([])

const isPaused = ref(false)
const riskHigh = ref(false)

const minAlertMinutes = ref(5)
const alertIntervalSeconds = ref(30)
const nextCheckCountdown = ref(alertIntervalSeconds.value)

const nextAlertIntervalSeconds = ref(alertIntervalSeconds.value)
const nextMinAlertMinutes = ref(minAlertMinutes.value)

const lastSentTimePerEmail = ref({})

let alertTimer = null
let countdownTimer = null

const formatDate = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const pushLog = (text, type = 'info') => {
  alertLogs.value.unshift({ text, type })
  if (alertLogs.value.length > 50) {
    alertLogs.value = alertLogs.value.slice(0, 50)
  }
}

const setMessage = (text, type = 'info') => {
  message.value = text
  messageType.value = type
}

const riskInfo = computed(() => {
  const data = latestData.value
  if (!data) {
    return {
      label: '暂无数据',
      desc: '暂未获取到最新监测数据。',
      className: 'safe',
    }
  }

  let score = 0

  if (Number(data.temperature) > 35) score += 2
  else if (Number(data.temperature) > 30) score += 1

  if (Number(data.humidity) < 20) score += 2
  else if (Number(data.humidity) < 35) score += 1

  if (Number(data.precipitation) > 50) score += 2
  else if (Number(data.precipitation) > 30) score += 1

  if (Number(data.wind_speed) > 20) score += 2
  else if (Number(data.wind_speed) > 12) score += 1

  if (Number(data.soil_moisture) < 10) score += 1

  if (score >= 5) {
    return {
      label: '高风险',
      desc: '环境波动较大，建议及时关注并发送风险告警。',
      className: 'danger',
    }
  }

  if (score >= 2) {
    return {
      label: '关注',
      desc: '存在一定异常趋势，建议保持持续监测。',
      className: 'warning',
    }
  }

  return {
    label: '低风险',
    desc: '当前环境整体较平稳，可维持常规监测。',
    className: 'safe',
  }
})

const fetchContacts = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/othermail/list')
    contacts.value = res.data || []
  } catch (e) {
    console.error('获取联系人失败', e.response?.data || e)
    pushLog(`[${new Date().toLocaleTimeString()}] 获取联系人失败`, 'error')
  }
}

const addContact = async () => {
  if (!newContact.value.name || !newContact.value.mail) {
    setMessage('请填写联系人姓名和邮箱', 'warning')
    return
  }

  if (!isValidEmail(newContact.value.mail)) {
    setMessage('邮箱格式不正确', 'error')
    return
  }

  try {
    await axios.post('http://localhost:3000/api/othermail/add', newContact.value)
    newContact.value = { name: '', mail: '' }
    setMessage('联系人添加成功', 'success')
    pushLog(`[${new Date().toLocaleTimeString()}] 已新增联系人`, 'success')
    await fetchContacts()
  } catch (e) {
    console.error('添加联系人失败', e.response?.data || e)
    setMessage('添加联系人失败，请检查控制台', 'error')
    pushLog(`[${new Date().toLocaleTimeString()}] 添加联系人失败`, 'error')
  }
}

const removeContact = async (mail) => {
  if (!confirm('确定删除该联系人吗？')) return

  try {
    await axios.delete(`http://localhost:3000/api/othermail/delete/${mail}`)
    setMessage('联系人删除成功', 'success')
    pushLog(`[${new Date().toLocaleTimeString()}] 已删除联系人：${mail}`, 'warning')
    await fetchContacts()
  } catch (e) {
    console.error('删除联系人失败', e.response?.data || e)
    setMessage('删除联系人失败，请检查控制台', 'error')
    pushLog(`[${new Date().toLocaleTimeString()}] 删除联系人失败：${mail}`, 'error')
  }
}

const send = async () => {
  if (!subject.value || !text.value) {
    setMessage('请填写邮件主题和内容', 'warning')
    return
  }

  if (contacts.value.length === 0) {
    setMessage('联系人列表为空，无法发送', 'warning')
    return
  }

  const emails = contacts.value.map((c) => c.mail).join(',')

  try {
    const res = await axios.post('http://localhost:3000/sendMail', {
      to: emails,
      subject: subject.value,
      text: text.value,
    })

    if (res.data.success) {
      setMessage(`邮件已发送给 ${contacts.value.length} 个联系人`, 'success')
      pushLog(`[${new Date().toLocaleTimeString()}] 手动邮件发送成功`, 'success')
    } else {
      setMessage('邮件发送失败', 'error')
      pushLog(`[${new Date().toLocaleTimeString()}] 手动邮件发送失败`, 'error')
    }
  } catch (err) {
    console.error('发送邮件失败', err.response?.data || err)
    setMessage('发送异常：' + (err.response?.data?.message || err.message), 'error')
    pushLog(`[${new Date().toLocaleTimeString()}] 手动邮件发送异常`, 'error')
  }
}

const sendTestAlert = async () => {
  if (contacts.value.length === 0) {
    setMessage('联系人列表为空，无法发送测试告警', 'warning')
    return
  }

  const emails = contacts.value.map((c) => c.mail).join(',')

  try {
    await axios.post('http://localhost:3000/sendMail', {
      to: emails,
      subject: '森林风险测试告警 ⚠️',
      text: '这是一封测试告警邮件，用于验证邮件通知功能是否正常。',
    })

    setMessage('测试告警发送成功', 'success')
    pushLog(`[${new Date().toLocaleTimeString()}] 已发送测试告警`, 'success')
  } catch (err) {
    console.error('测试告警发送失败', err.response?.data || err)
    setMessage('测试告警发送失败', 'error')
    pushLog(`[${new Date().toLocaleTimeString()}] 测试告警发送失败`, 'error')
  }
}

const fetchLatestData = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/monitor/latest')
    if (!res.data) return

    latestData.value = res.data
    riskHigh.value = riskInfo.value.label === '高风险'

    const now = new Date()
    const dataTime = new Date(res.data.record_time)
    const diffMinutes = (now - dataTime) / 1000 / 60

    if (riskHigh.value && diffMinutes <= 60 && !isPaused.value) {
      const emails = contacts.value.map((c) => c.mail)
      const timeLabel = now.toLocaleTimeString()

      for (const email of emails) {
        const lastSent = lastSentTimePerEmail.value[email]
        const minIntervalMs = minAlertMinutes.value * 60 * 1000

        if (!lastSent || now - lastSent > minIntervalMs) {
          lastSentTimePerEmail.value[email] = now

          const alertText = `告警：检测到高风险环境数据！
温度：${res.data.temperature}℃
湿度：${res.data.humidity}%
降水：${res.data.precipitation}mm
风速：${res.data.wind_speed}m/s
土壤湿度：${res.data.soil_moisture}%
时间：${res.data.record_time}`

          try {
            await axios.post('http://localhost:3000/sendMail', {
              to: email,
              subject: '森林风险告警 ⚠️',
              text: alertText,
            })
            pushLog(`[${timeLabel}] 告警邮件已发送给：${email}`, 'success')
          } catch (err) {
            console.error('右键处理失败', err.response?.data || err)
            pushLog(`[${timeLabel}] 邮件发送失败：${email}`, 'error')
          }
        } else {
          const waitSeconds = Math.ceil((minIntervalMs - (now - lastSent)) / 1000)
          pushLog(`[${timeLabel}] ${email} 距离下次告警还需 ${waitSeconds} 秒`, 'warning')
        }
      }

      lastAlertTime.value = now
    }
  } catch (err) {
    console.error('告警处理失败', err.response?.data || err)
    pushLog(`[${new Date().toLocaleTimeString()}] 自动告警处理失败`, 'error')
  }
}

const togglePause = () => {
  isPaused.value = !isPaused.value
  pushLog(`[${new Date().toLocaleTimeString()}] 告警已${isPaused.value ? '暂停' : '恢复'}`, 'info')
}

const startAlertTimer = () => {
  if (alertTimer) clearTimeout(alertTimer)
  if (countdownTimer) clearInterval(countdownTimer)

  nextCheckCountdown.value = alertIntervalSeconds.value

  const cycle = async () => {
    await fetchLatestData()

    alertIntervalSeconds.value = Math.max(nextAlertIntervalSeconds.value, 5)
    minAlertMinutes.value = Math.max(nextMinAlertMinutes.value, 0.1)

    nextCheckCountdown.value = alertIntervalSeconds.value
    alertTimer = setTimeout(cycle, alertIntervalSeconds.value * 1000)
  }

  alertTimer = setTimeout(cycle, alertIntervalSeconds.value * 1000)

  countdownTimer = setInterval(() => {
    if (nextCheckCountdown.value > 0) {
      nextCheckCountdown.value--
    }
  }, 1000)
}

onMounted(async () => {
  await fetchContacts()
  await fetchLatestData()
  startAlertTimer()
})

onBeforeUnmount(() => {
  if (alertTimer) clearTimeout(alertTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.send-mail-page {
  min-height: 100vh;
  padding: 20px;
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #0f172a, #05070f);
}

.hero-panel,
.panel {
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid #1e293b;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 18px;
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.25);
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  margin-bottom: 12px;
  font-size: 13px;
}

.hero-left h1 {
  margin: 0 0 10px;
  font-size: 30px;
  color: #f8fafc;
}

.hero-desc {
  color: #cbd5e1;
  line-height: 1.8;
  margin: 0;
  max-width: 760px;
}

.action-btn,
.primary-btn,
.secondary-btn,
.warning-btn,
.danger-btn {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.action-btn,
.primary-btn,
.secondary-btn,
.warning-btn {
  padding: 11px 16px;
  color: white;
}

.action-btn {
  background: linear-gradient(135deg, #0f766e, #0ea5e9);
}

.primary-btn {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.secondary-btn {
  background: linear-gradient(135deg, #475569, #334155);
}

.warning-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.danger-btn {
  background: #b91c1c;
  color: #fff1f2;
}

.small-btn {
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 8px;
}

.action-btn:hover,
.primary-btn:hover,
.secondary-btn:hover,
.warning-btn:hover,
.danger-btn:hover {
  transform: translateY(-2px);
  opacity: 0.96;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-title h2 {
  margin: 0;
  font-size: 18px;
  color: #38bdf8;
}

.panel-tip {
  font-size: 12px;
  color: #94a3b8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.16);
  padding: 4px 10px;
  border-radius: 999px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 6px;
  color: #cbd5e1;
}

input,
textarea {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
  font-size: 14px;
  outline: none;
}

input:focus,
textarea:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
}

textarea {
  min-height: 120px;
  resize: vertical;
}

.button-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.message {
  min-height: 22px;
  margin: 8px 0 0;
  font-size: 14px;
}

.message.success {
  color: #86efac;
}

.message.error {
  color: #fca5a5;
}

.message.warning {
  color: #fcd34d;
}

.message.info {
  color: #93c5fd;
}

.divider {
  height: 1px;
  background: rgba(148, 163, 184, 0.14);
  margin: 20px 0;
}

.contact-form {
  display: grid;
  grid-template-columns: 1fr 1.2fr auto;
  gap: 10px;
  margin-bottom: 16px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 420px;
}

th,
td {
  border-bottom: 1px solid #1e293b;
  padding: 12px 10px;
  text-align: center;
}

th {
  background: #0f172a;
  color: #93c5fd;
}

tbody tr {
  background: rgba(2, 6, 23, 0.55);
}

tbody tr:hover {
  background: rgba(30, 41, 59, 0.7);
}

.empty-cell {
  color: #94a3b8;
  padding: 20px 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.summary-card {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 14px;
}

.summary-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.summary-card strong {
  color: #e2e8f0;
  font-size: 18px;
}

.risk-card {
  margin-top: 16px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #1e293b;
  background: linear-gradient(135deg, #020617, #111827);
}

.risk-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.risk-card strong {
  display: block;
  font-size: 26px;
  margin-bottom: 8px;
}

.risk-card p {
  margin: 0;
  line-height: 1.7;
  color: #cbd5e1;
}

.risk-card.safe {
  border-color: rgba(34, 197, 94, 0.35);
}

.risk-card.warning {
  border-color: rgba(245, 158, 11, 0.35);
}

.risk-card.danger {
  border-color: rgba(239, 68, 68, 0.35);
}

.data-time {
  margin-top: 8px !important;
  font-size: 13px;
  color: #94a3b8 !important;
}

.status-list {
  display: grid;
  gap: 12px;
}

.status-item {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 14px;
}

.status-item span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
}

.status-item strong {
  color: #e2e8f0;
  font-size: 15px;
}

.log-list {
  max-height: 360px;
  overflow-y: auto;
  display: grid;
  gap: 10px;
}

.empty-log {
  color: #94a3b8;
  text-align: center;
  padding: 20px 0;
}

.log-item {
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid #1e293b;
  background: linear-gradient(135deg, #020617, #111827);
  font-size: 13px;
  line-height: 1.7;
}

.log-item.success {
  border-color: rgba(34, 197, 94, 0.3);
  color: #bbf7d0;
}

.log-item.error {
  border-color: rgba(239, 68, 68, 0.3);
  color: #fecaca;
}

.log-item.warning {
  border-color: rgba(245, 158, 11, 0.3);
  color: #fde68a;
}

.log-item.info {
  border-color: rgba(56, 189, 248, 0.3);
  color: #bae6fd;
}

@media (max-width: 1100px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hero-panel {
    flex-direction: column;
  }
}

@media (max-width: 700px) {
  .summary-grid,
  .contact-form {
    grid-template-columns: 1fr;
  }

  .hero-left h1 {
    font-size: 24px;
  }

  .panel-title {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
