<template>
  <div class="questionnaire-page">
    <!-- 顶部说明 -->
    <section class="hero-panel">
      <div class="hero-left">
        <p class="badge">科研问卷中心</p>
        <h1>问卷作答与积分服务</h1>
        <p class="hero-desc">支持随机问卷、指定问卷、自动判分、积分累计与问卷管理入口跳转。</p>
      </div>

      <div class="user-summary">
        <div class="summary-card">
          <span>当前用户</span>
          <strong>{{ username || '未登录' }}</strong>
        </div>
        <div class="summary-card">
          <span>当前身份</span>
          <strong>{{ role || 'user' }}</strong>
        </div>
        <div class="summary-card">
          <span>当前积分</span>
          <strong>{{ point }}</strong>
        </div>
        <div class="summary-card">
          <span>今日状态</span>
          <strong>{{ todayStatusText }}</strong>
        </div>
      </div>
    </section>

    <!-- 工具栏 -->
    <section class="panel">
      <div class="toolbar">
        <button class="toolbar-btn primary" @click="loadRandom">🎲 随机问卷</button>

        <select v-model="selectedQid">
          <option value="">请选择问卷</option>
          <option v-for="q in questionnaireList" :key="q.id" :value="q.id">
            {{ q.title }}
          </option>
        </select>

        <button class="toolbar-btn" @click="loadSpecific">📋 加载问卷</button>

        <button
          v-if="role === 'admin' || role === 'teacher' || role === 'researcher'"
          class="toolbar-btn"
          @click="goToCreateQ"
        >
          ➕ 新建问卷
        </button>

        <button class="toolbar-btn shop-btn" @click="goToShop">🛍 积分商城</button>
      </div>
    </section>

    <!-- 标题与状态 -->
    <section class="panel">
      <div class="title-row">
        <div>
          <h2 class="page-title">{{ title || '请先选择或随机加载一份问卷' }}</h2>
          <p class="page-subtitle">
            {{
              questions.length
                ? `当前共 ${questions.length} 题，提交后将自动判分并累计积分。`
                : '加载问卷后即可开始作答。'
            }}
          </p>
        </div>

        <div class="status-tags">
          <span class="status-tag" :class="{ done: submitted }">
            {{ submitted ? '已提交' : '未提交' }}
          </span>
          <span class="status-tag">{{
            finalScore !== null ? `得分：${finalScore}` : '等待作答'
          }}</span>
        </div>
      </div>
    </section>

    <!-- 未加载问卷 -->
    <section v-if="questions.length === 0" class="panel empty-panel">
      <div class="empty-box">
        <h3>暂无问卷内容</h3>
        <p>你可以点击“随机问卷”开始作答，或从下拉框中选择指定问卷。</p>
      </div>
    </section>

    <!-- 题目列表 -->
    <section v-else class="questions-section">
      <div v-for="(q, index) in questions" :key="q.question_id" class="question-card">
        <div class="question-top">
          <div class="question-index">Q{{ index + 1 }}</div>
          <div class="question-type">
            {{ q.question_type === 1 ? '单选题' : q.question_type === 2 ? '多选题' : '题目' }}
          </div>
        </div>

        <p class="question-content">{{ q.question_content }}</p>

        <!-- 单选 -->
        <div v-if="q.question_type === 1" class="options">
          <label
            v-for="op in q.options"
            :key="q.question_id + '-radio-' + op.option_label"
            class="option-label"
            :class="{
              chosen: userAnswers[q.question_id] === op.option_label,
              disabled: submitted,
            }"
          >
            <input
              type="radio"
              :name="'q' + q.question_id"
              v-model="userAnswers[q.question_id]"
              :value="op.option_label"
              :disabled="submitted"
            />
            <span>{{ op.option_label }}. {{ op.option_content }}</span>
          </label>
        </div>

        <!-- 多选 -->
        <div v-if="q.question_type === 2" class="options">
          <label
            v-for="op in q.options"
            :key="q.question_id + '-checkbox-' + op.option_label"
            class="option-label"
            :class="{
              chosen:
                Array.isArray(userAnswers[q.question_id]) &&
                userAnswers[q.question_id].includes(op.option_label),
              disabled: submitted,
            }"
          >
            <input
              type="checkbox"
              :value="op.option_label"
              v-model="userAnswers[q.question_id]"
              :disabled="submitted"
            />
            <span>{{ op.option_label }}. {{ op.option_content }}</span>
          </label>
        </div>

        <!-- 判题结果 -->
        <div v-if="submitted" class="result-box">
          <p v-if="resultMap[q.question_id]?.correct" class="correct">✅ 回答正确</p>
          <div v-else class="wrong">
            <p>❌ 回答错误</p>
            <p>你的答案：{{ resultMap[q.question_id]?.user_answer || '未作答' }}</p>
            <p>
              正确答案：<b>{{ resultMap[q.question_id]?.correct_answer }}</b>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 提交区 -->
    <section v-if="questions.length" class="panel submit-panel">
      <button class="submit-btn" @click="submitAll" :disabled="submitted">
        {{ submitted ? '已提交本次问卷' : '📤 提交问卷' }}
      </button>

      <h3 v-if="finalScore !== null" class="final-score">🎉 本次得分：{{ finalScore }}</h3>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

const token = sessionStorage.getItem('atoken') || ''
const username = ref(sessionStorage.getItem('username') || '')
const role = ref(sessionStorage.getItem('access') || 'user')

const questionnaireList = ref([])
const selectedQid = ref('')
const title = ref('')
const questions = ref([])
const userAnswers = ref({})
const point = ref(0)
const finalScore = ref(null)
const submitted = ref(false)
const resultMap = ref({})
const todayDone = ref(false)
const isAdminToday = ref(false)

const goToCreateQ = () => router.push('/CreateQuest')
const goToShop = () => router.push('/PointShop')

const todayStatusText = computed(() => {
  if (isAdminToday.value) return '管理员/特殊身份'
  return todayDone.value ? '今日已完成' : '今日可作答'
})

// 获取用户信息
const loadUserInfo = async () => {
  if (!username.value) return

  try {
    const res = await axios.get(`/api/user/info/${username.value}`, {
      headers: {
        Authorization: token,
      },
    })

    point.value = res.data.point || 0
    if (res.data.role) {
      role.value = res.data.role
    }
  } catch (err) {
    console.error(err.response?.data || err)
  }
}

// 获取今日作答状态
const loadTodayStatus = async () => {
  if (!username.value) return

  try {
    const check = await axios.get('/api/questionnaire/checkToday')

    todayDone.value = !!check.data.done
    isAdminToday.value = !!check.data.admin
  } catch (err) {
    console.error(err.response?.data || err)
  }
}

// 获取问卷列表
const loadQuestionnaireList = async () => {
  try {
    const res = await axios.get('/api/questionnaire/list')
    questionnaireList.value = res.data || []
  } catch (err) {
    console.error(err.response?.data || err)
  }
}

// 初始化答案
const resetAnswers = () => {
  submitted.value = false
  finalScore.value = null
  resultMap.value = {}
  userAnswers.value = {}

  questions.value.forEach((q) => {
    userAnswers.value[q.question_id] = q.question_type === 2 ? [] : ''
  })
}

// 加载指定问卷
const loadSpecific = async () => {
  if (!selectedQid.value) {
    alert('请先选择问卷')
    return
  }

  try {
    const check = await axios.get('/api/questionnaire/checkToday', {
      params: { username: username.value },
    })

    todayDone.value = !!check.data.done
    isAdminToday.value = !!check.data.admin

    if (!check.data.admin && check.data.done) {
      alert('你今天已经做过问卷了')
      return
    }

    const res = await axios.get(`/api/questionnaire/${selectedQid.value}/questions`)
    title.value = res.data.title || '指定问卷'
    questions.value = res.data.questions || []
    resetAnswers()
  } catch (err) {
    console.error(err.response?.data || err)
    alert('加载问卷失败，请检查控制台')
  }
}

// 随机问卷
const loadRandom = async () => {
  try {
    const check = await axios.get('/api/questionnaire/checkToday')

    todayDone.value = !!check.data.done
    isAdminToday.value = !!check.data.admin

    if (!check.data.admin && check.data.done) {
      alert('你今天已经做过问卷了')
      return
    }

    const res = await axios.get('/api/question/random?count=5')
    title.value = '随机问卷'
    questions.value = res.data || []
    selectedQid.value = ''
    resetAnswers()
  } catch (err) {
    console.error(err.response?.data || err)
    alert('加载随机问卷失败，请检查控制台')
  }
}

// 提交问卷
const submitAll = async () => {
  if (submitted.value) return
  if (!questions.value.length) {
    alert('当前没有问卷内容')
    return
  }

  try {
    const answers = questions.value.map((q) => ({
      questionnaire_id: q.questionnaire_id, // 带上所属问卷 ID
      question_id: q.question_id,
      answer: Array.isArray(userAnswers.value[q.question_id])
        ? userAnswers.value[q.question_id].join('')
        : userAnswers.value[q.question_id],
    }))

    const res = await axios.post('/api/questionnaire/submitAll', {
      questionnaire_id: selectedQid.value || 0,
      answers,
    })

    finalScore.value = res.data.score
    point.value += res.data.score
    submitted.value = true
    todayDone.value = true

    resultMap.value = {}
    ;(res.data.detail || []).forEach((d) => {
      resultMap.value[d.question_id] = d
    })
  } catch (err) {
    console.error(err.response?.data || err)
    alert('提交失败，请检查控制台')
  }
}

onMounted(() => {
  loadUserInfo()
  loadTodayStatus()
  loadQuestionnaireList()
})
</script>

<style scoped>
.questionnaire-page {
  min-height: 100vh;
  padding: 20px;
  background: radial-gradient(circle at top, #0f172a, #05070f);
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
}

.hero-panel,
.panel,
.question-card {
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
  gap: 18px;
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
  font-size: 30px;
  margin: 0 0 10px;
  color: #f8fafc;
}

.hero-desc {
  color: #cbd5e1;
  line-height: 1.8;
  margin: 0;
  max-width: 760px;
}

.user-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  min-width: 320px;
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
  font-size: 16px;
  color: #e2e8f0;
  word-break: break-word;
}

.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.toolbar select {
  min-width: 220px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
  outline: none;
}

.toolbar-btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: 0.2s;
  background: #334155;
  color: #e2e8f0;
}

.toolbar-btn.primary {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
}

.toolbar-btn.shop-btn {
  background: linear-gradient(135deg, #0f766e, #059669);
  color: white;
}

.toolbar-btn:hover,
.submit-btn:hover {
  transform: translateY(-1px);
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-title {
  margin: 0 0 10px;
  font-size: 28px;
  color: #f8fafc;
}

.page-subtitle {
  margin: 0;
  color: #94a3b8;
  line-height: 1.7;
}

.status-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  font-size: 12px;
}

.status-tag.done {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.25);
  color: #86efac;
}

.empty-panel {
  text-align: center;
}

.empty-box {
  color: #94a3b8;
  padding: 20px 0;
}

.empty-box h3 {
  color: #e2e8f0;
  margin-bottom: 10px;
}

.questions-section {
  display: grid;
  gap: 16px;
}

.question-card {
  padding: 18px;
}

.question-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.question-index {
  font-weight: 700;
  color: #38bdf8;
  font-size: 18px;
}

.question-type {
  font-size: 12px;
  color: #cbd5e1;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.16);
  padding: 4px 10px;
  border-radius: 999px;
}

.question-content {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 14px;
  color: #f8fafc;
  line-height: 1.8;
}

.options {
  display: grid;
  gap: 10px;
}

.option-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(56, 189, 248, 0.05);
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: 0.2s;
}

.option-label:hover {
  border-color: rgba(56, 189, 248, 0.3);
}

.option-label.chosen {
  border-color: rgba(56, 189, 248, 0.45);
  background: rgba(56, 189, 248, 0.1);
}

.option-label.disabled {
  cursor: default;
  opacity: 0.95;
}

.option-label input {
  margin-top: 3px;
  cursor: pointer;
}

.result-box {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid #1e293b;
}

.correct {
  color: #86efac;
  font-weight: 700;
  margin: 0;
}

.wrong {
  color: #fca5a5;
  font-weight: 700;
  line-height: 1.8;
}

.wrong p {
  margin: 4px 0;
}

.submit-panel {
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: 0.2s;
  font-size: 16px;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.final-score {
  margin-top: 16px;
  font-size: 24px;
  color: #facc15;
}

@media (max-width: 980px) {
  .hero-panel,
  .title-row {
    flex-direction: column;
  }

  .user-summary {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .user-summary {
    grid-template-columns: 1fr;
  }

  .hero-left h1,
  .page-title {
    font-size: 24px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar select,
  .toolbar-btn {
    width: 100%;
  }

  .question-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
