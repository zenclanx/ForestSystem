<template>
  <div class="home-dashboard">
    <!-- 顶部欢迎区 -->
    <header class="dashboard-header">
      <div class="header-left">
        <p class="badge">森林灾害防控与公众服务系统</p>
        <h1>{{ roleConfig.title }}</h1>
        <p class="subtitle">{{ roleConfig.enTitle }}</p>
        <p class="intro">{{ roleConfig.intro }}</p>

        <div class="role-tags">
          <span class="role-tag">{{ roleConfig.roleName }}</span>
          <span class="role-tag soft">个性化业务首页</span>
        </div>
      </div>

      <div class="header-right">
        <div class="status-card">
          <span>系统状态</span>
          <strong class="online">运行中</strong>
        </div>
        <div class="status-card">
          <span>当前时间</span>
          <strong>{{ currentTime }}</strong>
        </div>
        <div class="status-card">
          <span>当前用户</span>
          <strong>{{ username || '未登录' }}</strong>
        </div>
        <div class="status-card">
          <span>身份</span>
          <strong>{{ access || 'guest' }}</strong>
        </div>
      </div>
    </header>

    <!-- 消防员优先：实时监测 -->
    <section v-if="isFirefighter" class="panel panel-priority">
      <div class="panel-title">
        <h2>实时环境监测总览</h2>
        <span class="panel-tip">消防员首页重点信息</span>
      </div>

      <div v-if="monitorData" class="monitor-grid priority-monitor-grid">
        <div class="monitor-item important">
          <span>温度</span>
          <strong>{{ monitorData.temperature ?? '--' }} ℃</strong>
        </div>
        <div class="monitor-item important">
          <span>湿度</span>
          <strong>{{ monitorData.humidity ?? '--' }} %</strong>
        </div>
        <div class="monitor-item">
          <span>降水</span>
          <strong>{{ monitorData.precipitation ?? '--' }} mm</strong>
        </div>
        <div class="monitor-item">
          <span>风速</span>
          <strong>{{ monitorData.wind_speed ?? '--' }} m/s</strong>
        </div>
        <div class="monitor-item">
          <span>风向</span>
          <strong>{{ monitorData.wind_direction || '--' }}</strong>
        </div>
        <div class="monitor-item">
          <span>土壤湿度</span>
          <strong>{{ monitorData.soil_moisture ?? '--' }} %</strong>
        </div>
        <div class="monitor-item full">
          <span>记录时间</span>
          <strong>{{ formatDateTime(monitorData.record_time || monitorData.created_at) }}</strong>
        </div>
      </div>

      <div v-else class="empty-box">暂无监测数据</div>
    </section>

    <!-- 研究员优先：科研资源概览 -->
    <section v-if="isResearcher" class="panel panel-priority">
      <div class="panel-title">
        <h2>科研资源优先视图</h2>
        <span class="panel-tip">研究员首页重点信息</span>
      </div>

      <div class="stats-grid stats-grid-research">
        <div class="stat-card">
          <h3>{{ stats.totalSpecies }}</h3>
          <p>树种总数</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.totalModels }}</h3>
          <p>树种模型数</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.speciesWithImage }}</h3>
          <p>带图树种记录</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.plantTypeCount }}</h3>
          <p>树种类别数</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.familyCount }}</h3>
          <p>科数量</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.genusCount }}</h3>
          <p>属数量</p>
        </div>
      </div>
    </section>

    <!-- 核心统计 -->
    <section class="panel">
      <div class="panel-title">
        <h2>
          {{ isAdmin ? '平台核心统计' : isFirefighter ? '任务与资源统计' : '数据与资源统计' }}
        </h2>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>{{ stats.totalSpecies }}</h3>
          <p>树种总数</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.totalModels }}</h3>
          <p>树种模型数</p>
        </div>
        <div class="stat-card warning">
          <h3>{{ stats.pendingPests }}</h3>
          <p>待处理害虫任务</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.totalQuestionnaires }}</h3>
          <p>问卷总数</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.totalMailbox }}</h3>
          <p>当前可见留言数</p>
        </div>
        <div class="stat-card" v-if="access === 'admin'">
          <h3>{{ stats.onlineUsers }} / {{ stats.totalUsers }}</h3>
          <p>在线用户 / 用户总数</p>
        </div>
      </div>
    </section>

    <!-- 角色专属摘要区 -->
    <section class="role-summary-grid">
      <!-- 管理员 -->
      <div v-if="isAdmin" class="panel">
        <div class="panel-title">
          <h2>管理工作摘要</h2>
        </div>

        <div class="dynamic-list">
          <div class="dynamic-item">
            <span>系统在线情况</span>
            <strong>{{ stats.onlineUsers }} / {{ stats.totalUsers }} 用户在线</strong>
          </div>
          <div class="dynamic-item">
            <span>待处理害虫任务</span>
            <strong>{{ stats.pendingPests }} 条待处理任务</strong>
          </div>
          <div class="dynamic-item">
            <span>最新留言</span>
            <strong>{{ mailboxList[0]?.title || '暂无留言' }}</strong>
          </div>
          <div class="dynamic-item">
            <span>最新问卷</span>
            <strong>{{ questionnaireList[0]?.title || '暂无问卷' }}</strong>
          </div>
        </div>
      </div>

      <!-- 消防员 -->
      <div v-if="isFirefighter" class="panel">
        <div class="panel-title">
          <h2>应急风险判断</h2>
        </div>

        <div class="risk-grid">
          <div class="risk-card" :class="riskLevel.className">
            <span>当前风险等级</span>
            <strong>{{ riskLevel.label }}</strong>
            <p>{{ riskLevel.desc }}</p>
          </div>

          <div class="dynamic-item">
            <span>温度状态</span>
            <strong>{{ temperatureStatus }}</strong>
          </div>
          <div class="dynamic-item">
            <span>湿度状态</span>
            <strong>{{ humidityStatus }}</strong>
          </div>
          <div class="dynamic-item">
            <span>风速状态</span>
            <strong>{{ windStatus }}</strong>
          </div>
          <div class="dynamic-item">
            <span>待处理任务</span>
            <strong>{{ stats.pendingPests }} 条</strong>
          </div>
        </div>
      </div>

      <!-- 研究员 -->
      <div v-if="isResearcher" class="panel">
        <div class="panel-title">
          <h2>科研分析摘要</h2>
        </div>

        <div class="dynamic-list">
          <div class="dynamic-item">
            <span>树种图片覆盖</span>
            <strong>{{ imageCoverageRate }}%</strong>
          </div>
          <div class="dynamic-item">
            <span>科属覆盖</span>
            <strong>{{ stats.familyCount }} 个科 / {{ stats.genusCount }} 个属</strong>
          </div>
          <div class="dynamic-item">
            <span>最新问卷</span>
            <strong>{{ questionnaireList[0]?.title || '暂无问卷' }}</strong>
          </div>
          <div class="dynamic-item">
            <span>科研模型资源</span>
            <strong>{{ stats.totalModels }} 个模型资源</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- 中间两栏 -->
    <section class="middle-grid">
      <!-- 最新监测 -->
      <div class="panel" v-if="!isFirefighter">
        <div class="panel-title">
          <h2>{{ isResearcher ? '环境监测辅助信息' : '最新环境监测' }}</h2>
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
            <span>降水</span>
            <strong>{{ monitorData.precipitation ?? '--' }} mm</strong>
          </div>
          <div class="monitor-item">
            <span>风速</span>
            <strong>{{ monitorData.wind_speed ?? '--' }} m/s</strong>
          </div>
          <div class="monitor-item">
            <span>风向</span>
            <strong>{{ monitorData.wind_direction || '--' }}</strong>
          </div>
          <div class="monitor-item">
            <span>土壤湿度</span>
            <strong>{{ monitorData.soil_moisture ?? '--' }} %</strong>
          </div>
          <div class="monitor-item full">
            <span>记录时间</span>
            <strong>{{ formatDateTime(monitorData.record_time || monitorData.created_at) }}</strong>
          </div>
        </div>

        <div v-else class="empty-box">暂无监测数据</div>
      </div>

      <!-- 系统动态 / 科研动态 / 任务动态 -->
      <div class="panel">
        <div class="panel-title">
          <h2>{{ dynamicPanelTitle }}</h2>
        </div>

        <div class="dynamic-list">
          <div class="dynamic-item">
            <span>{{ dynamicLabel1 }}</span>
            <strong>{{ dynamicValue1 }}</strong>
          </div>
          <div class="dynamic-item">
            <span>{{ dynamicLabel2 }}</span>
            <strong>{{ dynamicValue2 }}</strong>
          </div>
          <div class="dynamic-item">
            <span>{{ dynamicLabel3 }}</span>
            <strong>{{ dynamicValue3 }}</strong>
          </div>
          <div class="dynamic-item">
            <span>{{ dynamicLabel4 }}</span>
            <strong>{{ dynamicValue4 }}</strong>
          </div>
          <div class="dynamic-item">
            <span>{{ dynamicLabel5 }}</span>
            <strong>{{ dynamicValue5 }}</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="panel">
      <div class="panel-title">
        <h2>功能入口</h2>
      </div>

      <div class="modules-grid">
        <div
          v-for="item in moduleCards"
          :key="item.path"
          class="module-card"
          @click="router.push(item.path)"
        >
          <span class="module-icon">{{ item.icon }}</span>
          <span class="module-text">{{ item.label }}</span>
        </div>
      </div>
    </section>

    <!-- 管理员专属区 -->
    <section v-if="isAdmin" class="panel">
      <div class="panel-title">
        <h2>平台管理视图</h2>
      </div>

      <div class="resource-grid">
        <div class="resource-card">
          <h3>用户管理</h3>
          <p>管理员可统一查看用户数量、在线状态及用户基础信息。</p>
        </div>
        <div class="resource-card">
          <h3>信息维护</h3>
          <p>支持维护森林信息、资源数据与系统业务内容。</p>
        </div>
        <div class="resource-card">
          <h3>业务汇总</h3>
          <p>可集中查看留言、问卷、病虫害处理与平台运行情况。</p>
        </div>
        <div class="resource-card">
          <h3>平台调度</h3>
          <p>首页用于展示全局概览，便于管理者快速定位关键模块。</p>
        </div>
      </div>
    </section>

    <!-- 消防员专属区 -->
    <section v-if="isFirefighter" class="panel">
      <div class="panel-title">
        <h2>消防业务重点</h2>
      </div>

      <div class="resource-grid">
        <div class="resource-card">
          <h3>监测优先</h3>
          <p>首页优先展示温湿度、风速、降水、土壤湿度等实时环境信息。</p>
        </div>
        <div class="resource-card">
          <h3>快速处置</h3>
          <p>支持快速进入监控告警与病虫害检测页面，提升处理效率。</p>
        </div>
        <div class="resource-card">
          <h3>风险判断</h3>
          <p>根据环境监测数据生成简易风险等级，辅助消防巡查与预判。</p>
        </div>
        <div class="resource-card">
          <h3>任务导向</h3>
          <p>围绕监测、预警、处置三类核心场景组织首页信息内容。</p>
        </div>
      </div>
    </section>

    <!-- 研究员专属区 -->
    <section v-if="isResearcher" class="panel">
      <div class="panel-title">
        <h2>科研业务重点</h2>
      </div>

      <div class="resource-grid">
        <div class="resource-card">
          <h3>树种资源</h3>
          <p>优先展示树种数量、类别、科属覆盖与带图记录等科研基础数据。</p>
        </div>
        <div class="resource-card">
          <h3>科研问卷</h3>
          <p>问卷模块可辅助开展科研调查与公众信息收集工作。</p>
        </div>
        <div class="resource-card">
          <h3>模型资源</h3>
          <p>支持树种模型资源查看，便于研究工作中的数据建模与分析。</p>
        </div>
        <div class="resource-card">
          <h3>分析支持</h3>
          <p>首页采用分析型展示方式，帮助研究员快速掌握资源覆盖情况。</p>
        </div>
      </div>
    </section>

    <!-- 资源概览 -->
    <section class="panel">
      <div class="panel-title">
        <h2>{{ isResearcher ? '科研资源概览' : isFirefighter ? '业务资源概览' : '资源概览' }}</h2>
      </div>

      <div class="resource-grid">
        <div class="resource-card">
          <h3>树种资源</h3>
          <p>
            当前系统已收录 <b>{{ stats.totalSpecies }}</b> 条树种信息。
          </p>
        </div>
        <div class="resource-card">
          <h3>模型资源</h3>
          <p>
            当前系统已加载 <b>{{ stats.totalModels }}</b> 个树种模型资源。
          </p>
        </div>
        <div class="resource-card">
          <h3>环境监测</h3>
          <p>系统可展示最新环境监测数据，并支持历史记录查看。</p>
        </div>
        <div class="resource-card">
          <h3>公众服务</h3>
          <p>
            当前用户可见留言数量为 <b>{{ stats.totalMailbox }}</b> 条。
          </p>
        </div>
      </div>
    </section>

    <footer class="footer">
      © 2026 Forest Disaster Prevention System | Graduation Design Project
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const currentTime = ref('')
const username = sessionStorage.getItem('username') || ''
const access = sessionStorage.getItem('access') || 'guest'
const token = sessionStorage.getItem('atoken') || ''

const monitorData = ref(null)
const questionnaireList = ref([])
const mailboxList = ref([])
const timer = ref(null)

const stats = reactive({
  totalSpecies: 0,
  totalModels: 0,
  pendingPests: 0,
  totalQuestionnaires: 0,
  totalMailbox: 0,
  totalUsers: 0,
  onlineUsers: 0,
  speciesWithImage: 0,
  plantTypeCount: 0,
  familyCount: 0,
  genusCount: 0,
})

const isAdmin = computed(() => access === 'admin')
const isResearcher = computed(() => access === 'researcher')
const isFirefighter = computed(() => access === 'firefighter')

const roleConfig = computed(() => {
  if (isAdmin.value) {
    return {
      roleName: '管理员首页',
      title: '系统总览与平台管理首页',
      enTitle: 'Platform Overview & Administration Dashboard',
      intro: '面向系统管理、用户调度、业务总览与平台维护场景的综合管理首页。',
    }
  }

  if (isFirefighter.value) {
    return {
      roleName: '消防员首页',
      title: '火情监测与应急处置首页',
      enTitle: 'Fire Monitoring & Emergency Response Dashboard',
      intro: '面向环境监测、风险预警、应急处理与快速业务响应场景的专属工作首页。',
    }
  }

  if (isResearcher.value) {
    return {
      roleName: '研究员首页',
      title: '科研分析与树种资源首页',
      enTitle: 'Research Analysis & Tree Species Resource Dashboard',
      intro: '面向树种资源研究、模型分析、科研问卷与数据查看场景的个性化业务首页。',
    }
  }

  return {
    roleName: '通用首页',
    title: '系统总览首页',
    enTitle: 'Forest Disaster Prevention & Public Service Platform',
    intro: '面向森林资源监测、灾害预警、病虫害处理与公众服务场景的综合管理平台。',
  }
})

const moduleCards = computed(() => {
  if (isFirefighter.value) {
    return [
      { icon: '🔥', label: '监控告警', path: '/monitor' },
      { icon: '🐞', label: '病虫害检测', path: '/disease' },
      { icon: '🌲', label: '基本森林信息', path: '/info' },
      { icon: '📊', label: '可视化分析', path: '/visual' },
      { icon: '📨', label: '读者信箱', path: '/mailbox' },
      { icon: '📝', label: '科研问卷', path: '/QuestionNaire' },
    ]
  }

  if (isResearcher.value) {
    return [
      { icon: '🌲', label: '基本森林信息', path: '/info' },
      { icon: '📊', label: '可视化分析', path: '/visual' },
      { icon: '📝', label: '科研问卷', path: '/QuestionNaire' },
      { icon: '✏️', label: '信息更新', path: '/UpdateInfo' },
      { icon: '🔥', label: '监控告警', path: '/monitor' },
      { icon: '📨', label: '读者信箱', path: '/mailbox' },
      { icon: '🐞', label: '病虫害检测', path: '/disease' },
    ]
  }

  if (isAdmin.value) {
    return [
      { icon: '🌲', label: '基本森林信息', path: '/info' },
      { icon: '📊', label: '可视化分析', path: '/visual' },
      { icon: '🔥', label: '监控告警', path: '/monitor' },
      { icon: '📨', label: '读者信箱', path: '/mailbox' },
      { icon: '🐞', label: '病虫害检测', path: '/disease' },
      { icon: '📝', label: '科研问卷', path: '/QuestionNaire' },
      { icon: '✏️', label: '信息更新', path: '/UpdateInfo' },
      { icon: '⚙️', label: '用户管理', path: '/UserAdmin' },
    ]
  }

  return [
    { icon: '🌲', label: '基本森林信息', path: '/info' },
    { icon: '📊', label: '可视化分析', path: '/visual' },
    { icon: '🔥', label: '监控告警', path: '/monitor' },
    { icon: '📨', label: '读者信箱', path: '/mailbox' },
    { icon: '🐞', label: '病虫害检测', path: '/disease' },
    { icon: '📝', label: '科研问卷', path: '/QuestionNaire' },
  ]
})

const imageCoverageRate = computed(() => {
  if (!stats.totalSpecies) return 0
  return ((stats.speciesWithImage / stats.totalSpecies) * 100).toFixed(1)
})

const temperatureStatus = computed(() => {
  const temp = Number(monitorData.value?.temperature)
  if (Number.isNaN(temp)) return '暂无数据'
  if (temp >= 35) return '高温'
  if (temp >= 28) return '偏高'
  if (temp >= 15) return '正常'
  return '偏低'
})

const humidityStatus = computed(() => {
  const humidity = Number(monitorData.value?.humidity)
  if (Number.isNaN(humidity)) return '暂无数据'
  if (humidity < 30) return '偏低'
  if (humidity < 50) return '较低'
  if (humidity <= 80) return '正常'
  return '偏高'
})

const windStatus = computed(() => {
  const wind = Number(monitorData.value?.wind_speed)
  if (Number.isNaN(wind)) return '暂无数据'
  if (wind >= 10) return '较强'
  if (wind >= 6) return '偏强'
  return '平稳'
})

const riskLevel = computed(() => {
  const temp = Number(monitorData.value?.temperature)
  const humidity = Number(monitorData.value?.humidity)
  const wind = Number(monitorData.value?.wind_speed)

  let score = 0

  if (!Number.isNaN(temp)) {
    if (temp >= 35) score += 3
    else if (temp >= 30) score += 2
    else if (temp >= 26) score += 1
  }

  if (!Number.isNaN(humidity)) {
    if (humidity < 30) score += 3
    else if (humidity < 45) score += 2
    else if (humidity < 60) score += 1
  }

  if (!Number.isNaN(wind)) {
    if (wind >= 10) score += 3
    else if (wind >= 6) score += 2
    else if (wind >= 3) score += 1
  }

  if (score >= 7) {
    return {
      label: '高风险',
      desc: '当前环境条件较敏感，建议加强巡查与预警关注。',
      className: 'danger',
    }
  }

  if (score >= 4) {
    return {
      label: '中风险',
      desc: '当前环境存在一定波动，建议保持重点监测。',
      className: 'warning',
    }
  }

  return {
    label: '低风险',
    desc: '当前环境整体较平稳，适合常规监测。',
    className: 'safe',
  }
})

const dynamicPanelTitle = computed(() => {
  if (isFirefighter.value) return '任务动态'
  if (isResearcher.value) return '科研动态'
  return '系统动态'
})

const dynamicLabel1 = computed(() => {
  if (isFirefighter.value) return '待处理害虫任务'
  if (isResearcher.value) return '最新问卷'
  return '最新留言'
})
const dynamicValue1 = computed(() => {
  if (isFirefighter.value) return `${stats.pendingPests} 条待处理任务`
  if (isResearcher.value) return questionnaireList.value[0]?.title || '暂无问卷'
  return mailboxList.value[0]?.title || '暂无留言'
})

const dynamicLabel2 = computed(() => {
  if (isFirefighter.value) return '当前风险等级'
  if (isResearcher.value) return '树种带图记录'
  return '最新问卷'
})
const dynamicValue2 = computed(() => {
  if (isFirefighter.value) return riskLevel.value.label
  if (isResearcher.value) return `${stats.speciesWithImage} 条`
  return questionnaireList.value[0]?.title || '暂无问卷'
})

const dynamicLabel3 = computed(() => {
  if (isFirefighter.value) return '温度状态'
  if (isResearcher.value) return '树种类别数'
  return '树种带图记录'
})
const dynamicValue3 = computed(() => {
  if (isFirefighter.value) return temperatureStatus.value
  if (isResearcher.value) return `${stats.plantTypeCount} 类`
  return `${stats.speciesWithImage}`
})

const dynamicLabel4 = computed(() => {
  if (isFirefighter.value) return '风速状态'
  if (isResearcher.value) return '科属覆盖'
  return '树种类别数'
})
const dynamicValue4 = computed(() => {
  if (isFirefighter.value) return windStatus.value
  if (isResearcher.value) return `${stats.familyCount} 个科 / ${stats.genusCount} 个属`
  return `${stats.plantTypeCount}`
})

const dynamicLabel5 = computed(() => {
  if (isFirefighter.value) return '记录更新时间'
  if (isResearcher.value) return '模型资源数'
  return '科属覆盖'
})
const dynamicValue5 = computed(() => {
  if (isFirefighter.value) {
    return formatDateTime(monitorData.value?.record_time || monitorData.value?.created_at)
  }
  if (isResearcher.value) return `${stats.totalModels} 个模型资源`
  return `${stats.familyCount} 个科 / ${stats.genusCount} 个属`
})

const updateTime = () => {
  currentTime.value = new Date().toLocaleString()
}

const formatDateTime = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

const loadHomeData = async () => {
  try {
    const requests = [
      axios.get('/api/tree-species'),
      axios.get('/api/models/all'),
      axios.get('/api/pestfind/pending-count'),
      axios.get('/api/questionnaire/list'),
      axios.get('/api/mailbox', {
        params: {
          user_role: access,
          username,
        },
      }),
      axios.get('/api/monitor/latest'),
    ]

    if (access === 'admin' && token) {
      requests.push(
        axios.get('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      )
    }

    const results = await Promise.all(requests)

    const [treeRes, modelRes, pestRes, questionRes, mailboxRes, monitorRes, userRes] = results

    const treeList = treeRes.data || []

    stats.totalSpecies = treeList.length
    stats.speciesWithImage = treeList.filter((item) => item.image_url).length
    stats.plantTypeCount = new Set(treeList.map((item) => item.plant_type).filter(Boolean)).size
    stats.familyCount = new Set(treeList.map((item) => item.family_name).filter(Boolean)).size
    stats.genusCount = new Set(treeList.map((item) => item.genus_name).filter(Boolean)).size

    stats.totalModels = (modelRes.data || []).filter(
      (m) => m.model_path && m.model_path.trim() !== '',
    ).length
    stats.pendingPests = pestRes.data?.count || 0

    questionnaireList.value = questionRes.data || []
    stats.totalQuestionnaires = questionnaireList.value.length

    mailboxList.value = mailboxRes.data || []
    stats.totalMailbox = mailboxList.value.length

    monitorData.value = monitorRes.data || null

    if (userRes?.data) {
      stats.totalUsers = userRes.data.length
      stats.onlineUsers = userRes.data.filter((item) => item.statu === '在线中').length
    }
  } catch (err) {
    console.error('首页数据加载失败', err.response?.data || err)
  }
}

onMounted(() => {
  updateTime()
  timer.value = setInterval(updateTime, 1000)
  loadHomeData()
  window.scrollTo(0, 0)
})

onBeforeUnmount(() => {
  if (timer.value) clearInterval(timer.value)
})
</script>

<style scoped>
.home-dashboard {
  min-height: 100vh;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #0f172a, #05070f);
}

.dashboard-header,
.panel {
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid #1e293b;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 18px;
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.25);
}

.panel-priority {
  border-color: rgba(56, 189, 248, 0.45);
  box-shadow:
    0 0 0 1px rgba(56, 189, 248, 0.08),
    0 14px 30px rgba(2, 6, 23, 0.3);
}

.dashboard-header {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
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

.header-left h1 {
  font-size: 32px;
  margin-bottom: 10px;
  color: #f8fafc;
}

.subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 14px;
}

.intro {
  color: #cbd5e1;
  line-height: 1.8;
  margin-bottom: 14px;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.role-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.16);
  border: 1px solid rgba(34, 197, 94, 0.25);
  color: #86efac;
  font-size: 12px;
}

.role-tag.soft {
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}

.header-right {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.status-card {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 16px;
}

.status-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.status-card strong {
  font-size: 15px;
  color: #e2e8f0;
  word-break: break-word;
}

.online {
  color: #22c55e !important;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-title h2 {
  font-size: 18px;
  color: #38bdf8;
  margin: 0;
}

.panel-tip {
  font-size: 12px;
  color: #94a3b8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.16);
  padding: 4px 10px;
  border-radius: 999px;
}

.stats-grid,
.modules-grid,
.resource-grid,
.role-summary-grid {
  display: grid;
  gap: 14px;
}

.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.stats-grid-research {
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.stat-card {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  padding: 18px;
  border-radius: 14px;
  text-align: center;
  transition: 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(56, 189, 248, 0.45);
}

.stat-card h3 {
  font-size: 28px;
  color: #22c55e;
  margin-bottom: 8px;
}

.stat-card.warning h3 {
  color: #f59e0b;
}

.stat-card p {
  font-size: 13px;
  color: #9ca3af;
}

.role-summary-grid {
  grid-template-columns: 1fr;
}

.middle-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
  margin-bottom: 18px;
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.priority-monitor-grid {
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.monitor-item,
.dynamic-item,
.resource-card,
.risk-card {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 14px;
}

.monitor-item span,
.dynamic-item span,
.risk-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.monitor-item strong,
.dynamic-item strong,
.risk-card strong {
  color: #e2e8f0;
  line-height: 1.5;
}

.monitor-item.important {
  border-color: rgba(56, 189, 248, 0.28);
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.05);
}

.monitor-item.full {
  grid-column: 1 / -1;
}

.dynamic-list {
  display: grid;
  gap: 12px;
}

.risk-grid {
  display: grid;
  gap: 12px;
}

.risk-card strong {
  font-size: 24px;
}

.risk-card p {
  margin-top: 8px;
  color: #cbd5e1;
  line-height: 1.7;
  font-size: 13px;
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

.modules-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.module-card {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  padding: 18px 16px;
  border-radius: 14px;
  cursor: pointer;
  transition: 0.22s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 64px;
  text-align: center;
}

.module-card:hover {
  border-color: #38bdf8;
  transform: translateY(-4px);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
}

.module-icon {
  font-size: 20px;
}

.module-text {
  font-size: 15px;
  color: #e2e8f0;
}

.resource-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.resource-card h3 {
  margin-bottom: 10px;
  color: #e2e8f0;
  font-size: 16px;
}

.resource-card p {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.8;
}

.empty-box {
  color: #94a3b8;
  text-align: center;
  padding: 30px 0;
}

.footer {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 960px) {
  .dashboard-header,
  .middle-grid {
    grid-template-columns: 1fr;
  }

  .header-right {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .header-right,
  .monitor-grid,
  .priority-monitor-grid {
    grid-template-columns: 1fr;
  }

  .panel-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left h1 {
    font-size: 26px;
  }
}
</style>
