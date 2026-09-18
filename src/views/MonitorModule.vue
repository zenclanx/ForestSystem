<template>
  <div class="monitor-module">
    <!-- 顶部标题区 -->
    <section class="hero-panel">
      <div class="hero-left">
        <p class="badge">森林灾害监控中心</p>
        <h1>环境监测与灾情告警总览</h1>
        <p class="hero-desc">
          对温度、湿度、降水、风速、日照与土壤湿度进行综合监测，并对异常情况进行风险识别与告警提示。
        </p>
      </div>

      <div class="hero-actions">
        <button class="action-btn primary" @click="goToDisasterSimulation">灾情模拟</button>
        <button class="action-btn" @click="goToSendMail">告警邮件</button>
        <button class="action-btn" @click="goToEnvironmentRecord">记录数据</button>
      </div>
    </section>

    <!-- 风险总览 -->
    <section class="summary-grid">
      <div class="summary-card risk-card" :class="riskSummary.className">
        <span>当前综合风险</span>
        <strong>{{ riskSummary.label }}</strong>
        <p>{{ riskSummary.desc }}</p>
      </div>

      <div class="summary-card">
        <span>当前告警数量</span>
        <strong>{{ alertList.length }}</strong>
        <p>{{ alertStatsText }}</p>
      </div>

      <div class="summary-card">
        <span>监测记录总数</span>
        <strong>{{ monitorList.length }}</strong>
        <p>当前用于图表展示的历史监测记录数量</p>
      </div>

      <div class="summary-card">
        <span>最新记录时间</span>
        <strong class="small-text">{{ latestRecordTime }}</strong>
        <p>系统最近一次环境监测数据更新时间</p>
      </div>
    </section>

    <!-- 当前最新数据 -->
    <section class="panel">
      <div class="panel-title">
        <h2>当前最新数据</h2>
      </div>

      <div class="overview" v-if="overviewList.length">
        <div class="overview-item" v-for="(item, index) in overviewList" :key="index">
          <div class="label">{{ item.label }}</div>
          <div class="value">{{ item.value }}</div>
        </div>
      </div>

      <div v-else class="empty-box">暂无最新监测数据</div>
    </section>

    <!-- 触发条件 -->
    <section class="panel">
      <div class="panel-title">
        <h2>当前触发条件</h2>
      </div>

      <div v-if="triggeredConditions.length" class="trigger-grid">
        <div class="trigger-tag" v-for="(item, index) in triggeredConditions" :key="index">
          {{ item }}
        </div>
      </div>

      <div v-else class="empty-box">当前未触发明显异常条件，环境整体较平稳</div>
    </section>

    <!-- 图表区域 -->
    <section class="panel">
      <div class="panel-title chart-toolbar">
        <h2>监测趋势图表</h2>

        <div class="toolbar-right">
          <span class="toolbar-label">显示范围：</span>
          <button
            v-for="item in rangeOptions"
            :key="item.value"
            class="range-btn"
            :class="{ active: rangeLimit === item.value }"
            @click="changeRange(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div v-if="filteredMonitorList.length" class="charts">
        <div class="chart-card">
          <div class="chart-title">温度变化趋势</div>
          <div class="chart" ref="tempChartRef"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">湿度变化趋势</div>
          <div class="chart" ref="humidityChartRef"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">降水量变化</div>
          <div class="chart" ref="rainChartRef"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">风速变化趋势</div>
          <div class="chart" ref="windChartRef"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">日照时长变化</div>
          <div class="chart" ref="sunChartRef"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">土壤含水量变化</div>
          <div class="chart" ref="soilChartRef"></div>
        </div>
      </div>

      <div v-else class="empty-box">暂无可展示的图表数据</div>
    </section>

    <!-- 告警区域 -->
    <section class="panel">
      <div class="panel-title">
        <h2>告警信息</h2>
      </div>

      <div v-if="alertList.length" class="alerts-grid">
        <div
          v-for="(alert, index) in alertList"
          :key="index"
          class="alert-card"
          :class="alert.levelClass"
        >
          <div class="alert-top">
            <span class="alert-level">{{ alert.levelText }}</span>
            <span class="alert-type">{{ alert.category }}</span>
          </div>
          <div class="alert-message">{{ alert.message }}</div>
          <div class="alert-time">更新时间：{{ latestRecordTime }}</div>
        </div>
      </div>

      <div v-else class="empty-box">当前没有触发告警信息</div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import * as echarts from 'echarts'

const router = useRouter()

const goToEnvironmentRecord = () => {
  router.push('/environment-record')
}
const goToSendMail = () => {
  router.push('/SendMail')
}
const goToDisasterSimulation = () => {
  router.push('/Disaster-Simulation')
}

const BASE_URL = 'http://localhost:3000/api'
const log = (...args) => console.log('[MonitorModule]', ...args)

const overviewList = ref([])
const monitorList = ref([])
const alertList = ref([])
const latestData = ref(null)

const rangeLimit = ref(10)
const rangeOptions = [
  { label: '最近10条', value: 10 },
  { label: '最近20条', value: 20 },
  { label: '全部', value: 'all' },
]

// 图表 DOM
const tempChartRef = ref(null)
const humidityChartRef = ref(null)
const rainChartRef = ref(null)
const windChartRef = ref(null)
const sunChartRef = ref(null)
const soilChartRef = ref(null)

// 图表实例
let tempChart = null
let humidityChart = null
let rainChart = null
let windChart = null
let sunChart = null
let soilChart = null

const formatDateTime = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

const latestRecordTime = computed(() => {
  return formatDateTime(latestData.value?.record_time || latestData.value?.created_at)
})

const filteredMonitorList = computed(() => {
  if (!monitorList.value.length) return []
  if (rangeLimit.value === 'all') return monitorList.value
  return monitorList.value.slice(-rangeLimit.value)
})

const triggeredConditions = computed(() => {
  const data = latestData.value
  if (!data) return []

  const list = []

  if (Number(data.temperature) > 35) list.push(`高温：${data.temperature}℃`)
  if (Number(data.temperature) < 0) list.push(`低温：${data.temperature}℃`)
  if (Number(data.humidity) < 20) list.push(`湿度过低：${data.humidity}%`)
  if (Number(data.humidity) > 90) list.push(`湿度过高：${data.humidity}%`)
  if (Number(data.precipitation) > 50) list.push(`强降水：${data.precipitation}mm`)
  if (Number(data.wind_speed) > 20) list.push(`大风：${data.wind_speed}m/s`)
  if (Number(data.sunshine_hours) > 12) list.push(`日照过强：${data.sunshine_hours}h`)
  if (Number(data.sunshine_hours) < 1) list.push(`日照不足：${data.sunshine_hours}h`)
  if (Number(data.soil_moisture) < 10) list.push(`土壤过干：${data.soil_moisture}%`)
  if (Number(data.soil_moisture) > 80) list.push(`土壤过湿：${data.soil_moisture}%`)

  if (Number(data.temperature) > 30 && Number(data.humidity) < 20) {
    list.push(`高温干燥组合风险`)
  }
  if (Number(data.precipitation) > 30 && Number(data.wind_speed) > 15) {
    list.push(`暴雨大风组合风险`)
  }

  return list
})

const riskSummary = computed(() => {
  const count = triggeredConditions.value.length

  if (count >= 4) {
    return {
      label: '高风险',
      desc: '已触发多个异常条件，建议尽快关注并启动预警处置。',
      className: 'danger',
    }
  }

  if (count >= 2) {
    return {
      label: '中风险',
      desc: '当前存在一定异常波动，建议加强巡查与持续监测。',
      className: 'warning',
    }
  }

  return {
    label: '低风险',
    desc: '当前环境整体较平稳，可保持常规监测。',
    className: 'safe',
  }
})

const alertStatsText = computed(() => {
  const highCount = alertList.value.filter((item) => item.levelClass === 'danger').length
  const warnCount = alertList.value.filter((item) => item.levelClass === 'warning').length

  if (!alertList.value.length) return '当前无异常告警'
  return `高风险 ${highCount} 条，关注级 ${warnCount} 条`
})

const toAlertItem = (message, category, levelClass = 'danger', levelText = '高风险') => {
  return {
    message,
    category,
    levelClass,
    levelText,
  }
}

const checkAlerts = (data, previousData = null) => {
  const alerts = []

  if (Number(data.temperature) > 35) {
    alerts.push(toAlertItem(`高温告警：${data.temperature}℃`, '温度监测', 'danger', '高风险'))
  }
  if (Number(data.temperature) < 0) {
    alerts.push(toAlertItem(`低温告警：${data.temperature}℃`, '温度监测', 'warning', '关注'))
  }
  if (previousData && Math.abs(Number(data.temperature) - Number(previousData.temperature)) > 10) {
    alerts.push(
      toAlertItem(
        `温度剧烈变化：${previousData.temperature}℃ → ${data.temperature}℃`,
        '温度波动',
        'danger',
        '高风险',
      ),
    )
  }

  if (Number(data.humidity) > 90) {
    alerts.push(toAlertItem(`湿度过高：${data.humidity}%`, '湿度监测', 'warning', '关注'))
  }
  if (Number(data.humidity) < 20) {
    alerts.push(toAlertItem(`湿度过低：${data.humidity}%`, '湿度监测', 'danger', '高风险'))
  }
  if (previousData && Math.abs(Number(data.humidity) - Number(previousData.humidity)) > 30) {
    alerts.push(
      toAlertItem(
        `湿度剧烈变化：${previousData.humidity}% → ${data.humidity}%`,
        '湿度波动',
        'danger',
        '高风险',
      ),
    )
  }

  if (Number(data.precipitation) > 50) {
    alerts.push(
      toAlertItem(`降水量异常高：${data.precipitation}mm`, '降水监测', 'danger', '高风险'),
    )
  }
  if (previousData && Number(data.precipitation) - Number(previousData.precipitation) > 20) {
    alerts.push(
      toAlertItem(`短时间降水量剧增：${data.precipitation}mm`, '降水波动', 'danger', '高风险'),
    )
  }

  if (Number(data.wind_speed) > 20) {
    alerts.push(toAlertItem(`风速过大：${data.wind_speed} m/s`, '风速监测', 'danger', '高风险'))
  }
  if (Number(data.wind_speed) < 0.5) {
    alerts.push(toAlertItem(`风速过低：${data.wind_speed} m/s`, '风速监测', 'warning', '关注'))
  }

  if (
    data.wind_direction &&
    !['北', '东北', '东', '东南', '南', '西南', '西', '西北'].includes(data.wind_direction)
  ) {
    alerts.push(toAlertItem(`风向异常：${data.wind_direction}`, '风向监测', 'warning', '关注'))
  }

  if (Number(data.sunshine_hours) > 12) {
    alerts.push(toAlertItem(`日照过强：${data.sunshine_hours}h`, '日照监测', 'warning', '关注'))
  }
  if (Number(data.sunshine_hours) < 1) {
    alerts.push(toAlertItem(`日照不足：${data.sunshine_hours}h`, '日照监测', 'warning', '关注'))
  }
  if (
    previousData &&
    Math.abs(Number(data.sunshine_hours) - Number(previousData.sunshine_hours)) > 6
  ) {
    alerts.push(
      toAlertItem(
        `日照剧烈变化：${previousData.sunshine_hours}h → ${data.sunshine_hours}h`,
        '日照波动',
        'warning',
        '关注',
      ),
    )
  }

  if (Number(data.soil_moisture) < 10) {
    alerts.push(toAlertItem(`土壤过干：${data.soil_moisture}%`, '土壤监测', 'danger', '高风险'))
  }
  if (Number(data.soil_moisture) > 80) {
    alerts.push(toAlertItem(`土壤过湿：${data.soil_moisture}%`, '土壤监测', 'warning', '关注'))
  }
  if (
    previousData &&
    Math.abs(Number(data.soil_moisture) - Number(previousData.soil_moisture)) > 20
  ) {
    alerts.push(
      toAlertItem(
        `土壤含水量剧烈变化：${previousData.soil_moisture}% → ${data.soil_moisture}%`,
        '土壤波动',
        'warning',
        '关注',
      ),
    )
  }

  if (Number(data.temperature) > 30 && Number(data.humidity) < 20) {
    alerts.push(
      toAlertItem(
        `高温干燥告警：${data.temperature}℃ / ${data.humidity}%`,
        '组合风险',
        'danger',
        '高风险',
      ),
    )
  }

  if (Number(data.precipitation) > 30 && Number(data.wind_speed) > 15) {
    alerts.push(toAlertItem(`暴雨大风告警`, '组合风险', 'danger', '高风险'))
  }

  return alerts
}

const loadMonitorList = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/monitor/list`)
    monitorList.value = Array.isArray(res.data) ? res.data : []
    log('监测列表 raw:', monitorList.value)
  } catch (err) {
    console.error('[MonitorModule] 获取监测列表失败', err)
    monitorList.value = []
  }
}

const loadLatestData = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/monitor/latest`)
    const data = res.data
    log('最新数据 raw:', data)
    if (!data) return

    latestData.value = data

    overviewList.value = [
      { label: '温度 (℃)', value: data.temperature ?? '--' },
      { label: '湿度 (%)', value: data.humidity ?? '--' },
      { label: '日降水量 (mm)', value: data.precipitation ?? '--' },
      { label: '风速 (m/s)', value: data.wind_speed ?? '--' },
      { label: '风向', value: data.wind_direction || '--' },
      { label: '日照时长 (h)', value: data.sunshine_hours ?? '--' },
      { label: '土壤含水量 (%)', value: data.soil_moisture ?? '--' },
    ]

    const previous =
      monitorList.value.length > 1 ? monitorList.value[monitorList.value.length - 2] : null

    alertList.value = checkAlerts(data, previous)
  } catch (err) {
    console.error('[MonitorModule] 获取最新数据失败', err)
  }
}

const disposeCharts = () => {
  const charts = [tempChart, humidityChart, rainChart, windChart, sunChart, soilChart]
  charts.forEach((chart) => {
    if (chart) chart.dispose()
  })
  tempChart = null
  humidityChart = null
  rainChart = null
  windChart = null
  sunChart = null
  soilChart = null
}

const createLineChart = (chart, title, xData, yData) => {
  chart.setOption({
    backgroundColor: 'transparent',
    title: {
      text: title,
      left: 'center',
      textStyle: {
        color: '#e2e8f0',
        fontSize: 14,
      },
    },
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 50, bottom: 40 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    series: [
      {
        type: 'line',
        data: yData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        areaStyle: { opacity: 0.08 },
      },
    ],
  })
}

const createBarChart = (chart, title, xData, yData) => {
  chart.setOption({
    backgroundColor: 'transparent',
    title: {
      text: title,
      left: 'center',
      textStyle: {
        color: '#e2e8f0',
        fontSize: 14,
      },
    },
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 50, bottom: 40 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    series: [
      {
        type: 'bar',
        data: yData,
        barMaxWidth: 28,
      },
    ],
  })
}

const initCharts = () => {
  if (!filteredMonitorList.value.length) return

  disposeCharts()

  const timeList = filteredMonitorList.value.map((i) => (i.record_time || '').slice(0, 16))
  const temperatureList = filteredMonitorList.value.map((i) => Number(i.temperature))
  const humidityList = filteredMonitorList.value.map((i) => Number(i.humidity))
  const rainfallList = filteredMonitorList.value.map((i) => Number(i.precipitation))
  const windSpeedList = filteredMonitorList.value.map((i) => Number(i.wind_speed))
  const sunshineList = filteredMonitorList.value.map((i) => Number(i.sunshine_hours))
  const soilMoistureList = filteredMonitorList.value.map((i) => Number(i.soil_moisture))

  tempChart = echarts.init(tempChartRef.value)
  humidityChart = echarts.init(humidityChartRef.value)
  rainChart = echarts.init(rainChartRef.value)
  windChart = echarts.init(windChartRef.value)
  sunChart = echarts.init(sunChartRef.value)
  soilChart = echarts.init(soilChartRef.value)

  createLineChart(tempChart, '温度变化趋势', timeList, temperatureList)
  createLineChart(humidityChart, '湿度变化趋势', timeList, humidityList)
  createBarChart(rainChart, '降水量变化', timeList, rainfallList)
  createLineChart(windChart, '风速变化趋势', timeList, windSpeedList)
  createBarChart(sunChart, '日照时长变化', timeList, sunshineList)
  createLineChart(soilChart, '土壤含水量变化', timeList, soilMoistureList)
}

const resizeCharts = () => {
  ;[tempChart, humidityChart, rainChart, windChart, sunChart, soilChart].forEach((chart) => {
    if (chart) chart.resize()
  })
}

const changeRange = async (value) => {
  rangeLimit.value = value
  await nextTick()
  initCharts()
}

onMounted(async () => {
  log('[MonitorModule] mounted')
  await loadMonitorList()
  await loadLatestData()
  await nextTick()
  initCharts()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  disposeCharts()
})
</script>

<style scoped>
.monitor-module {
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
  margin-bottom: 10px;
  color: #f8fafc;
}

.hero-desc {
  color: #cbd5e1;
  line-height: 1.8;
  max-width: 760px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-btn {
  border: 1px solid #334155;
  background: linear-gradient(135deg, #020617, #111827);
  color: #e2e8f0;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  border-color: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
}

.action-btn.primary {
  border-color: rgba(56, 189, 248, 0.45);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 18px;
}

.summary-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.summary-card strong {
  display: block;
  font-size: 28px;
  color: #f8fafc;
  margin-bottom: 8px;
}

.summary-card strong.small-text {
  font-size: 16px;
  line-height: 1.6;
}

.summary-card p {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.7;
}

.risk-card.safe {
  border-color: rgba(34, 197, 94, 0.4);
}

.risk-card.warning {
  border-color: rgba(245, 158, 11, 0.4);
}

.risk-card.danger {
  border-color: rgba(239, 68, 68, 0.4);
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

.overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.overview-item {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  padding: 16px;
  border-radius: 14px;
  text-align: center;
}

.label {
  font-size: 13px;
  color: #94a3b8;
}

.value {
  font-size: 22px;
  font-weight: bold;
  margin-top: 10px;
  color: #e2e8f0;
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

.chart-toolbar {
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-label {
  color: #94a3b8;
  font-size: 13px;
}

.range-btn {
  border: 1px solid #334155;
  background: #0f172a;
  color: #cbd5e1;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: 0.2s;
}

.range-btn.active {
  color: #38bdf8;
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
}

.charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 16px;
  overflow: hidden;
}

.chart-title {
  padding: 14px 16px 0;
  color: #cbd5e1;
  font-size: 14px;
}

.chart {
  height: 320px;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.alert-card {
  border-radius: 14px;
  padding: 16px;
  border: 1px solid #1e293b;
  background: linear-gradient(135deg, #020617, #111827);
}

.alert-card.danger {
  border-color: rgba(239, 68, 68, 0.38);
}

.alert-card.warning {
  border-color: rgba(245, 158, 11, 0.38);
}

.alert-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.alert-level {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}

.alert-card.warning .alert-level {
  background: rgba(245, 158, 11, 0.12);
  color: #fcd34d;
}

.alert-type {
  font-size: 12px;
  color: #94a3b8;
}

.alert-message {
  font-size: 15px;
  color: #f8fafc;
  line-height: 1.7;
  margin-bottom: 10px;
}

.alert-time {
  font-size: 12px;
  color: #94a3b8;
}

.empty-box {
  color: #94a3b8;
  text-align: center;
  padding: 26px 0;
}

@media (max-width: 1100px) {
  .summary-grid,
  .overview,
  .charts,
  .alerts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hero-panel {
    flex-direction: column;
  }
}

@media (max-width: 700px) {
  .summary-grid,
  .overview,
  .charts,
  .alerts-grid {
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
