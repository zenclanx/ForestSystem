<template>
  <div class="simulation-page">
    <!-- 顶部 -->
    <section class="hero-panel">
      <div class="hero-left">
        <p class="badge">灾情模拟分析中心</p>
        <h1>森林灾害风险模拟与应急推演</h1>
        <p class="hero-desc">
          支持历史监测数据导入、环境参数调节、风险等级推演、灾情类型分析与应急方案建议。
        </p>
      </div>

      <div class="hero-actions">
        <button class="action-btn" @click="goBack">返回监控中心</button>
      </div>
    </section>

    <div class="main-grid">
      <!-- 左侧参数控制 -->
      <section class="panel left-panel">
        <div class="panel-title">
          <h2>模拟参数设置</h2>
        </div>

        <div class="form-group">
          <label>选择历史监测时间</label>
          <select v-model="selectedRecordId">
            <option value="">-- 请选择历史时间 --</option>
            <option v-for="r in records" :key="r.id" :value="r.id">
              {{ formatDate(r.record_time) }}
            </option>
          </select>
        </div>

        <div class="button-row">
          <button class="primary-btn" @click="loadRecordById">导入历史参数</button>
          <button class="secondary-btn" @click="resetParams">恢复默认参数</button>
        </div>

        <div class="divider"></div>

        <div class="slider-group">
          <div class="param-item">
            <label>🌡 温度 (°C)</label>
            <div class="param-value">{{ params.temperature }}</div>
            <input type="range" v-model.number="params.temperature" min="-10" max="50" />
          </div>

          <div class="param-item">
            <label>💧 空气湿度 (%)</label>
            <div class="param-value">{{ params.humidity }}</div>
            <input type="range" v-model.number="params.humidity" min="0" max="100" />
          </div>

          <div class="param-item">
            <label>🌧 日降水量 (mm)</label>
            <div class="param-value">{{ params.precipitation }}</div>
            <input type="range" v-model.number="params.precipitation" min="0" max="100" />
          </div>

          <div class="param-item">
            <label>💨 风速 (m/s)</label>
            <div class="param-value">{{ params.wind_speed }}</div>
            <input type="range" v-model.number="params.wind_speed" min="0" max="20" />
          </div>

          <div class="param-item">
            <label>🧭 风向</label>
            <select v-model="params.wind_direction">
              <option value="北">北</option>
              <option value="东北">东北</option>
              <option value="东">东</option>
              <option value="东南">东南</option>
              <option value="南">南</option>
              <option value="西南">西南</option>
              <option value="西">西</option>
              <option value="西北">西北</option>
            </select>
          </div>

          <div class="param-item">
            <label>☀ 日照时长 (h)</label>
            <div class="param-value">{{ params.sunshine_hours }}</div>
            <input type="range" v-model.number="params.sunshine_hours" min="0" max="12" />
          </div>

          <div class="param-item">
            <label>🌱 土壤湿度 (%)</label>
            <div class="param-value">{{ params.soil_moisture }}</div>
            <input type="range" v-model.number="params.soil_moisture" min="0" max="100" />
          </div>
        </div>
      </section>

      <!-- 右侧模拟结果 -->
      <section class="panel right-panel">
        <div class="panel-title">
          <h2>模拟结果分析</h2>
        </div>

        <!-- 风险总览 -->
        <div class="summary-grid">
          <div class="summary-card" :class="riskClass">
            <span>灾害风险等级</span>
            <strong>{{ riskText }}</strong>
            <p>{{ riskDesc }}</p>
          </div>

          <div class="summary-card">
            <span>风险分值</span>
            <strong>{{ riskScore }} / 10</strong>
            <p>基于温度、湿度、降水、风速与土壤湿度综合计算</p>
          </div>
        </div>

        <div class="progress-wrap">
          <div class="progress-label">
            <span>风险分值可视化</span>
            <span>{{ riskScore }} / 10</span>
          </div>
          <div class="progress-bar">
            <div class="progress-inner" :style="{ width: `${(riskScore / 10) * 100}%` }"></div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 触发条件 -->
        <div class="panel-title inner-title">
          <h2>当前触发条件</h2>
        </div>

        <div v-if="triggeredConditions.length" class="trigger-grid">
          <div class="trigger-tag" v-for="(item, index) in triggeredConditions" :key="index">
            {{ item }}
          </div>
        </div>
        <div v-else class="empty-box">当前未触发明显异常条件</div>

        <div class="divider"></div>

        <!-- 重点建议 -->
        <div class="panel-title inner-title">
          <h2>重点建议</h2>
        </div>

        <div class="advice-list">
          <div class="advice-card" v-for="(item, index) in priorityActions" :key="index">
            {{ item }}
          </div>
        </div>

        <div class="divider"></div>

        <!-- 分析 -->
        <div class="result-section">
          <h3>灾情类型与影响分析</h3>
          <p class="analysis-text" style="white-space: pre-line">
            {{ disasterResult }}
          </p>
        </div>

        <div class="result-section">
          <h3>灾害应急与防控方案</h3>
          <p class="solution-text" style="white-space: pre-line">
            {{ disasterSolutions }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

const defaultParams = {
  temperature: 25,
  humidity: 60,
  precipitation: 10,
  wind_speed: 3,
  wind_direction: '东北',
  sunshine_hours: 6,
  soil_moisture: 30,
}

const params = ref({ ...defaultParams })

const records = ref([])
const selectedRecordId = ref('')

const formatDate = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

const loadRecordList = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/monitor/list')
    records.value = res.data || []
  } catch (err) {
    console.error(err.response?.data || err)
    alert('获取历史监测数据失败，请检查控制台')
  }
}

const loadRecordById = () => {
  const record = records.value.find((r) => String(r.id) === String(selectedRecordId.value))
  if (!record) {
    alert('请选择历史时间')
    return
  }

  params.value = {
    temperature: Number(record.temperature) || 0,
    humidity: Number(record.humidity) || 0,
    precipitation: Number(record.precipitation) || 0,
    wind_speed: Number(record.wind_speed) || 0,
    wind_direction: record.wind_direction || '东北',
    sunshine_hours: Number(record.sunshine_hours) || 0,
    soil_moisture: Number(record.soil_moisture) || 0,
  }

  alert('已导入历史环境参数')
}

const resetParams = () => {
  params.value = { ...defaultParams }
}

const riskScore = computed(() => {
  const t = Number(params.value.temperature)
  const h = Number(params.value.humidity)
  const p = Number(params.value.precipitation)
  const w = Number(params.value.wind_speed)
  const s = Number(params.value.soil_moisture)

  let score = 0

  // 火灾风险
  if (t > 35) score += 2
  else if (t > 30) score += 1

  if (h < 30) score += 2
  else if (h < 45) score += 1

  if (w > 6) score += 1
  if (w > 12) score += 1

  // 洪水/泥石流风险
  if (p > 60) score += 2
  else if (p > 30) score += 1

  if (s > 70) score += 1

  // 干旱风险
  if (s < 20) score += 2
  else if (s < 30) score += 1

  // 冻害
  if (t < -5) score += 2
  else if (t < 0) score += 1

  // 封顶
  return Math.min(score, 10)
})

const riskText = computed(() => {
  if (riskScore.value >= 7) return '高风险 ⚠️'
  if (riskScore.value >= 4) return '中风险'
  return '低风险'
})

const riskClass = computed(() => {
  if (riskScore.value >= 7) return 'risk-high'
  if (riskScore.value >= 4) return 'risk-mid'
  return 'risk-low'
})

const riskDesc = computed(() => {
  if (riskScore.value >= 7) return '当前环境条件已触发多项危险因素，建议立即加强巡查和预警。'
  if (riskScore.value >= 4) return '当前环境存在一定异常波动，建议持续关注重点风险。'
  return '当前环境整体较平稳，可维持常规监测。'
})

const triggeredConditions = computed(() => {
  const t = Number(params.value.temperature)
  const h = Number(params.value.humidity)
  const p = Number(params.value.precipitation)
  const w = Number(params.value.wind_speed)
  const s = Number(params.value.soil_moisture)
  const result = []

  if (t > 35) result.push(`高温：${t}℃`)
  if (t < -5) result.push(`低温：${t}℃`)
  if (h < 30) result.push(`空气湿度偏低：${h}%`)
  if (p > 60) result.push(`强降水：${p}mm`)
  if (w > 6) result.push(`大风：${w}m/s`)
  if (w > 15) result.push(`强风灾害可能：${w}m/s`)
  if (s < 20) result.push(`土壤偏干：${s}%`)
  if (s > 70) result.push(`土壤过湿：${s}%`)
  if (t > 35 && h < 30 && w > 6) result.push('森林火灾高风险组合')
  if (p > 60 && s > 70) result.push('洪水/泥石流高风险组合')
  if (t > 30 && s < 20) result.push('干旱高风险组合')

  return result
})

const priorityActions = computed(() => {
  const t = Number(params.value.temperature)
  const h = Number(params.value.humidity)
  const p = Number(params.value.precipitation)
  const w = Number(params.value.wind_speed)
  const s = Number(params.value.soil_moisture)

  const actions = []

  if (t > 35 && h < 30 && w > 6) {
    actions.push('立即发布火险预警并加强林区巡查')
    actions.push('部署消防力量和灭火设备，重点关注风向扩散区域')
  }

  if (p > 60 && s > 70) {
    actions.push('检查排水系统并预警滑坡、泥石流风险')
    actions.push('对重点区域进行人员提醒和安全疏散准备')
  }

  if (t > 30 && s < 20) {
    actions.push('加强灌溉调度与水源管理，预防持续干旱影响')
  }

  if (t < -5) {
    actions.push('关注冻害风险，采取苗木防寒和灾后补植准备')
  }

  if (w > 15) {
    actions.push('发布强风提醒，检查高危树木与林区设施安全')
  }

  if (actions.length === 0) {
    actions.push('当前环境总体稳定，建议保持常规监测与巡查')
  }

  return actions
})

const disasterResult = computed(() => {
  const t = Number(params.value.temperature)
  const h = Number(params.value.humidity)
  const p = Number(params.value.precipitation)
  const w = Number(params.value.wind_speed)
  const s = Number(params.value.soil_moisture)

  const results = []

  if (t > 35 && h < 30 && w > 6) {
    results.push('🔥 森林火灾风险：高温、低湿度、大风条件极易引发火灾并快速蔓延。')
  }
  if (p > 60 && s > 70) {
    results.push('🌊 洪水/泥石流风险：强降水导致土壤饱和，可能引发滑坡、泥石流与基础设施破坏。')
  }
  if (t > 30 && s < 20) {
    results.push('☀️ 干旱风险：长期高温与低土壤湿度将抑制森林生长并增加病虫害发生率。')
  }
  if (t < -5) {
    results.push('❄️ 冻害风险：极端低温可能导致树木组织损伤甚至死亡。')
  }
  if (w > 15) {
    results.push('🌪️ 风灾风险：强风可能导致树木倒伏、枝干折断及设施受损。')
  }

  if (results.length === 0) {
    return '当前环境条件稳定，未检测到明显灾害风险。'
  }

  return results.join('\n')
})

const disasterSolutions = computed(() => {
  const t = Number(params.value.temperature)
  const h = Number(params.value.humidity)
  const p = Number(params.value.precipitation)
  const w = Number(params.value.wind_speed)
  const s = Number(params.value.soil_moisture)

  const solutions = []

  if (t > 35 && h < 30 && w > 6) {
    solutions.push(
      '🔥 森林火灾应对措施：\n1. 启动预警系统，限制林区人员活动；\n2. 部署消防队伍与灭火设备；\n3. 建立隔离带；\n4. 使用无人机持续监测火情。\n',
    )
  }

  if (p > 60 && s > 70) {
    solutions.push(
      '🌊 洪水/泥石流防控措施：\n1. 疏通排水系统与河道；\n2. 设置地质监测点与预警广播；\n3. 撤离危险区域；\n4. 加固道路与基础设施。\n',
    )
  }

  if (t > 30 && s < 20) {
    solutions.push(
      '☀️ 干旱防控措施：\n1. 实施人工灌溉与水资源调度；\n2. 种植耐旱树种；\n3. 建立水源保护区；\n4. 加强病虫害监测。\n',
    )
  }

  if (t < -5) {
    solutions.push(
      '❄️ 冻害防控措施：\n1. 防寒覆盖保护幼苗；\n2. 调整树种结构；\n3. 加强冬季气象监测；\n4. 进行灾后补植恢复。\n',
    )
  }

  if (w > 15) {
    solutions.push(
      '🌪️ 风灾防控措施：\n1. 建立防风林带与生态屏障；\n2. 修剪高危树木；\n3. 发布风灾预警；\n4. 加固林区设施。\n',
    )
  }

  if (solutions.length === 0) {
    return '当前环境条件稳定，无需启动灾害应急方案。'
  }

  return solutions.join('\n')
})

const goBack = () => {
  router.push('/monitor')
}

onMounted(() => {
  loadRecordList()
})
</script>

<style scoped>
.simulation-page {
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
.secondary-btn {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
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

.action-btn:hover,
.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-2px);
  opacity: 0.96;
}

.main-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 18px;
}

.left-panel {
  position: sticky;
  top: 20px;
  align-self: start;
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

.inner-title {
  margin-bottom: 10px;
}

.form-group,
.param-item {
  margin-bottom: 14px;
}

.form-group label,
.param-item label {
  display: block;
  margin-bottom: 8px;
  color: #cbd5e1;
  font-weight: 600;
}

select,
input[type='range'] {
  width: 100%;
}

select {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
  outline: none;
}

select:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
}

.button-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.divider {
  height: 1px;
  background: rgba(148, 163, 184, 0.14);
  margin: 20px 0;
}

.slider-group {
  display: grid;
  gap: 8px;
}

.param-item {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 14px;
}

.param-value {
  color: #38bdf8;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.summary-card {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 16px;
}

.summary-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.summary-card strong {
  display: block;
  font-size: 26px;
  margin-bottom: 8px;
  color: #f8fafc;
}

.summary-card p {
  margin: 0;
  line-height: 1.7;
  color: #cbd5e1;
}

.risk-low {
  border-color: rgba(34, 197, 94, 0.35);
}

.risk-mid {
  border-color: rgba(245, 158, 11, 0.35);
}

.risk-high {
  border-color: rgba(239, 68, 68, 0.35);
}

.progress-wrap {
  margin-top: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  color: #cbd5e1;
  font-size: 14px;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #0f172a;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid #1e293b;
}

.progress-inner {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #f59e0b, #ef4444);
  transition: width 0.25s ease;
}

.trigger-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.trigger-tag {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.28);
  color: #fbbf24;
  font-size: 13px;
}

.advice-list {
  display: grid;
  gap: 12px;
}

.advice-card {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid rgba(56, 189, 248, 0.22);
  border-radius: 14px;
  padding: 14px;
  line-height: 1.8;
  color: #e2e8f0;
}

.result-section + .result-section {
  margin-top: 18px;
}

.result-section h3 {
  color: #f8fafc;
  margin-bottom: 10px;
  font-size: 17px;
}

.analysis-text,
.solution-text {
  font-size: 15px;
  line-height: 1.9;
  padding: 14px;
  border-radius: 10px;
  margin-top: 10px;
}

.analysis-text {
  background: rgba(59, 130, 246, 0.08);
  border-left: 4px solid #409eff;
}

.solution-text {
  background: rgba(34, 197, 94, 0.08);
  border-left: 4px solid #67c23a;
}

.empty-box {
  color: #94a3b8;
  text-align: center;
  padding: 18px 0;
}

@media (max-width: 1100px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .left-panel {
    position: static;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    flex-direction: column;
  }
}

@media (max-width: 700px) {
  .hero-left h1 {
    font-size: 24px;
  }

  .panel-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .button-row {
    flex-direction: column;
  }
}
</style>
