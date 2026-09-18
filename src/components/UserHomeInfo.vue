<template>
  <div class="user-home-page">
    <!-- 顶部欢迎区 -->
    <section class="hero-section">
      <div class="hero-left">
        <p class="hero-badge">森林公众服务系统</p>
        <h1>欢迎来到森林生态公众服务平台</h1>
        <p class="hero-desc">
          面向公众用户提供森林科普信息浏览、读者留言互动、科研问卷参与与积分商城服务，
          共同促进森林生态保护意识提升与公众参与。
        </p>

        <div class="hero-user">
          <span>当前用户：{{ username || '未登录用户' }}</span>
          <span>身份：普通用户</span>
          <span>{{ currentTime }}</span>
        </div>
      </div>

      <div class="hero-right">
        <div class="quick-panel">
          <h3>快捷入口</h3>
          <div class="quick-grid">
            <button @click="router.push('/user-forest')">森林科普信息</button>
            <button @click="router.push('/mailbox')">读者信箱</button>
            <button @click="router.push('/QuestionNaire')">科研问卷</button>
            <button @click="router.push('/PointShop')">积分商城</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 统计卡片 -->
    <section class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">树种总数</span>
        <h2>{{ stats.totalSpecies }}</h2>
        <p>可供公众浏览的树种资源</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">问卷总数</span>
        <h2>{{ stats.totalQuestionnaires }}</h2>
        <p>可参与的科研问卷数量</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">我的可见留言数</span>
        <h2>{{ stats.totalMailbox }}</h2>
        <p>来自读者信箱模块</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">我的当前积分</span>
        <h2>{{ userInfo.point ?? 0 }}</h2>
        <p>参与问卷可累计积分</p>
      </div>
    </section>

    <!-- 中间区域 -->
    <section class="middle-grid">
      <!-- 最新环境摘要 -->
      <div class="panel">
        <div class="panel-title">
          <h3>最新环境摘要</h3>
          <span>{{ formatDateTime(monitorData?.created_at || monitorData?.record_time) }}</span>
        </div>

        <div v-if="monitorData" class="monitor-grid">
          <div class="monitor-item">
            <span>温度</span>
            <strong>{{ monitorData.temperature ?? '--' }} ℃</strong>
          </div>
          <div class="monitor-item">
            <span>湿度</span>
            <strong>{{ monitorData.humidity ?? '--' }} %</strong>
          </div>
          <div class="monitor-item">
            <span>风速</span>
            <strong>{{ monitorData.wind_speed ?? '--' }} m/s</strong>
          </div>
          <div class="monitor-item">
            <span>土壤湿度</span>
            <strong>{{ monitorData.soil_moisture ?? '--' }} %</strong>
          </div>
        </div>

        <div v-else class="empty-box">暂无环境监测数据</div>
      </div>

      <!-- 我的参与情况 -->
      <div class="panel">
        <div class="panel-title">
          <h3>我的参与情况</h3>
        </div>

        <div class="participation-list">
          <div class="participation-item">
            <span>用户名</span>
            <strong>{{ userInfo.username || username || '--' }}</strong>
          </div>
          <div class="participation-item">
            <span>联系方式</span>
            <strong>{{ userInfo.phone || userInfo.email || '未完善' }}</strong>
          </div>
          <div class="participation-item">
            <span>当前积分</span>
            <strong>{{ userInfo.point ?? 0 }}</strong>
          </div>
          <div class="participation-item">
            <span>账号状态</span>
            <strong>{{ userInfo.statu || '--' }}</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能引导 -->
    <section class="guide-grid">
      <div class="guide-card">
        <h3>森林科普信息</h3>
        <p>浏览系统中的树种基础资料，了解森林生态环境、分布区域、主要用途与相关科普信息。</p>
        <button @click="router.push('/user-forest')">立即查看</button>
      </div>

      <div class="guide-card">
        <h3>读者信箱</h3>
        <p>对森林保护、生态问题、系统内容有任何意见或建议，都可以通过读者信箱提交反馈。</p>
        <button @click="router.push('/mailbox')">去留言</button>
      </div>

      <div class="guide-card">
        <h3>科研问卷</h3>
        <p>参与问卷答题可帮助生态研究数据收集，同时还能获得积分奖励，提升公众参与度。</p>
        <button @click="router.push('/QuestionNaire')">去参与</button>
      </div>

      <div class="guide-card">
        <h3>积分商城</h3>
        <p>使用参与互动获得的积分兑换相应奖励内容，增强系统公众服务体验与持续参与意愿。</p>
        <button @click="router.push('/PointShop')">去兑换</button>
      </div>
    </section>

    <!-- 公益倡议 -->
    <section class="panel initiative-panel">
      <div class="panel-title">
        <h3>森林保护倡议</h3>
      </div>

      <div class="initiative-list">
        <div class="initiative-item">
          <h4>保护森林资源</h4>
          <p>从减少浪费、节约纸张、支持生态修复等日常行动做起，共同保护森林生态环境。</p>
        </div>

        <div class="initiative-item">
          <h4>增强防火意识</h4>
          <p>进入林区不携带火种，不违规野外用火，发现火情及时上报，共同维护森林安全。</p>
        </div>

        <div class="initiative-item">
          <h4>关注生态变化</h4>
          <p>通过阅读森林科普内容，了解树种知识与环境变化，提高公众生态保护意识。</p>
        </div>
      </div>
    </section>

    <footer class="footer">© 2026 Forest Public Service Platform | User Portal</footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const username = sessionStorage.getItem('username') || ''
const token = sessionStorage.getItem('atoken') || ''

const currentTime = ref('')
const monitorData = ref(null)
const questionnaireList = ref([])
const mailboxList = ref([])
const treeList = ref([])

const userInfo = reactive({
  username: '',
  point: 0,
  phone: '',
  email: '',
  statu: '',
})

const stats = reactive({
  totalSpecies: 0,
  totalQuestionnaires: 0,
  totalMailbox: 0,
})

let timer = null

const updateTime = () => {
  currentTime.value = new Date().toLocaleString()
}

const formatDateTime = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

const loadUserHomeData = async () => {
  try {
    const requests = [
      axios.get('/api/tree-species'),
      axios.get('/api/questionnaire/list'),
      axios.get('/api/mailbox', {
        params: {
          user_role: 'user',
          username,
        },
      }),
      axios.get('/api/monitor/latest'),
    ]

    if (username && token) {
      requests.push(
        axios.get(`/api/user/info/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      )
    }

    const results = await Promise.all(requests)

    const [treeRes, questionnaireRes, mailboxRes, monitorRes, userRes] = results

    treeList.value = treeRes.data || []
    stats.totalSpecies = treeList.value.length

    questionnaireList.value = questionnaireRes.data || []
    stats.totalQuestionnaires = questionnaireList.value.length

    mailboxList.value = mailboxRes.data || []
    stats.totalMailbox = mailboxList.value.length

    monitorData.value = monitorRes.data || null

    if (userRes?.data) {
      userInfo.username = userRes.data.username || ''
      userInfo.point = userRes.data.point ?? 0
      userInfo.phone = userRes.data.phone || ''
      userInfo.email = userRes.data.email || ''
      userInfo.statu = userRes.data.statu || ''
    }
  } catch (err) {
    console.error('用户首页数据加载失败', err.response?.data || err)
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  loadUserHomeData()
  window.scrollTo(0, 0)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.user-home-page {
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  color: #e5e7eb;
  background: linear-gradient(180deg, #0f172a, #08101f);
  font-family: 'Segoe UI', sans-serif;
}

.hero-section,
.panel,
.stat-card,
.guide-card {
  background: rgba(17, 25, 40, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  border-radius: 18px;
}

.hero-section {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
  padding: 24px;
  margin-bottom: 18px;
}

.hero-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.14);
  color: #67e8f9;
  font-size: 13px;
  margin-bottom: 14px;
}

.hero-left h1 {
  font-size: 34px;
  margin-bottom: 12px;
  line-height: 1.35;
}

.hero-desc {
  color: #cbd5e1;
  line-height: 1.8;
  font-size: 15px;
  margin-bottom: 18px;
}

.hero-user {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-user span {
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 13px;
}

.hero-right {
  display: flex;
  align-items: center;
}

.quick-panel {
  width: 100%;
}

.quick-panel h3 {
  margin-bottom: 16px;
}

.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.quick-grid button,
.guide-card button {
  border: none;
  border-radius: 12px;
  padding: 12px 14px;
  font-weight: bold;
  cursor: pointer;
  background: linear-gradient(135deg, #22d3ee, #34d399);
  color: #04111d;
  transition: opacity 0.2s ease;
}

.quick-grid button:hover,
.guide-card button:hover {
  opacity: 0.92;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}

.stat-card {
  padding: 22px 18px;
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
  margin-bottom: 8px;
  color: #fff;
}

.stat-card p {
  color: #94a3b8;
  font-size: 13px;
}

.middle-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 18px;
  margin-bottom: 18px;
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

.monitor-grid,
.participation-list {
  display: grid;
  gap: 12px;
}

.monitor-grid {
  grid-template-columns: 1fr 1fr;
}

.monitor-item,
.participation-item,
.initiative-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 14px;
}

.monitor-item span,
.participation-item span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
}

.monitor-item strong,
.participation-item strong {
  font-size: 15px;
  color: #fff;
}

.guide-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}

.guide-card {
  padding: 20px;
}

.guide-card h3 {
  margin-bottom: 12px;
  color: #e2e8f0;
}

.guide-card p {
  color: #94a3b8;
  line-height: 1.8;
  margin-bottom: 16px;
  font-size: 14px;
}

.initiative-panel {
  margin-bottom: 18px;
}

.initiative-list {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
}

.initiative-item h4 {
  margin-bottom: 10px;
  color: #e2e8f0;
}

.initiative-item p {
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.8;
}

.empty-box {
  color: #94a3b8;
  text-align: center;
  padding: 24px 0;
}

.footer {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 1100px) {
  .hero-section,
  .middle-grid,
  .initiative-list {
    grid-template-columns: 1fr;
  }

  .stats-grid,
  .guide-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 700px) {
  .stats-grid,
  .guide-grid,
  .monitor-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
