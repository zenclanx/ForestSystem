<template>
  <div class="visual-module">
    <!-- 左侧树种列表 -->
    <aside class="sidebar">
      <div class="sidebar-top">
        <h2>树种可视化列表</h2>

        <input v-model="keyword" class="search-input" placeholder="搜索树种名称" />

        <select v-model="modelFilter" class="filter-select">
          <option value="all">全部树种</option>
          <option value="hasModel">仅显示有模型</option>
          <option value="noModel">仅显示无模型</option>
        </select>
      </div>

      <div class="species-list">
        <div
          v-for="item in filteredSpecies"
          :key="item.id"
          :class="['species-item', { active: item.name === currentSpecies }]"
          @click="selectSpecies(item)"
        >
          <div class="species-head">
            <span class="species-name">{{ item.name }}</span>
            <span
              :class="['model-dot', item.hasModel ? 'yes' : 'no']"
              :title="item.hasModel ? '已有模型' : '暂无模型'"
            ></span>
          </div>
          <p class="species-sub">
            {{ item.hasModel ? '模型资源已录入' : '暂无模型资源' }}
          </p>
        </div>

        <div v-if="!filteredSpecies.length" class="empty-tip">暂无匹配树种</div>
      </div>
    </aside>

    <!-- 右侧 -->
    <section class="right-area">
      <!-- 顶部：模型 + 操作 -->
      <div class="top-area">
        <div class="viewer-card">
          <div class="card-head">
            <div>
              <h2>3D 模型展示区</h2>
              <p>{{ currentSpecies || '请先选择树种' }}</p>
            </div>

            <div class="viewer-actions">
              <button @click="resetView">重置视角</button>
              <button @click="toggleAutoRotate">
                {{ autoRotate ? '关闭自转' : '开启自转' }}
              </button>
              <button @click="toggleWireframe">
                {{ wireframe ? '关闭线框' : '线框模式' }}
              </button>
            </div>
          </div>

          <div class="viewer-body" ref="viewerBodyRef">
            <ThreeScene ref="threeSceneRef" />
          </div>
        </div>
      </div>

      <!-- 底部：信息卡 + 图表 -->
      <div class="bottom-area">
        <!-- 树种信息 -->
        <div class="info-card">
          <div class="card-head">
            <h3>当前树种信息</h3>
          </div>

          <template v-if="selectedTree">
            <div class="info-grid">
              <div class="info-item">
                <span>中文名</span>
                <strong>{{ selectedTree.species_name || '--' }}</strong>
              </div>
              <div class="info-item">
                <span>拉丁名</span>
                <strong>{{ selectedTree.species_latin_name || '--' }}</strong>
              </div>
              <div class="info-item">
                <span>植物类型</span>
                <strong>{{ selectedTree.plant_type || '--' }}</strong>
              </div>
              <div class="info-item">
                <span>科</span>
                <strong>{{ selectedTree.family_name || '--' }}</strong>
              </div>
              <div class="info-item">
                <span>属</span>
                <strong>{{ selectedTree.genus_name || '--' }}</strong>
              </div>
              <div class="info-item">
                <span>模型状态</span>
                <strong>{{ selectedTree.hasModel ? '已录入' : '暂无模型' }}</strong>
              </div>
            </div>

            <div class="block">
              <h4>生态环境</h4>
              <div class="tag-list">
                <span v-for="(item, index) in envList" :key="'env' + index">{{ item }}</span>
                <span v-if="!envList.length" class="empty-inline">暂无数据</span>
              </div>
            </div>

            <div class="block">
              <h4>分布区域</h4>
              <div class="tag-list">
                <span v-for="(item, index) in areaList" :key="'area' + index">{{ item }}</span>
                <span v-if="!areaList.length" class="empty-inline">暂无数据</span>
              </div>
            </div>

            <div class="block">
              <h4>主要用途</h4>
              <div class="tag-list">
                <span v-for="(item, index) in useList" :key="'use' + index">{{ item }}</span>
                <span v-if="!useList.length" class="empty-inline">暂无数据</span>
              </div>
            </div>
          </template>

          <div v-else class="empty-panel">请选择左侧树种查看信息</div>
        </div>

        <!-- 环境监测图表 -->
        <div class="chart-card">
          <div class="card-head">
            <div>
              <h3>环境监测趋势</h3>
              <p>基于 forest_environment_data 历史记录</p>
            </div>

            <select v-model="chartField" class="chart-select" @change="renderChart">
              <option value="temperature">温度</option>
              <option value="humidity">湿度</option>
              <option value="soil_moisture">土壤湿度</option>
              <option value="wind_speed">风速</option>
            </select>
          </div>

          <div ref="chartRef" class="chart-box"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
import ThreeScene from '@/components/ThreeScene.vue'

const speciesList = ref([])
const rawTreeList = ref([])
const currentSpecies = ref('')
const selectedTree = ref(null)

const keyword = ref('')
const modelFilter = ref('all')

const autoRotate = ref(false)
const wireframe = ref(false)

const chartField = ref('temperature')
const monitorList = ref([])

const threeSceneRef = ref(null)
const viewerBodyRef = ref(null)
const chartRef = ref(null)

let chartInstance = null

const splitText = (text) => {
  if (!text) return []
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const envList = computed(() => splitText(selectedTree.value?.environment))
const areaList = computed(() => splitText(selectedTree.value?.distribution_area))
const useList = computed(() => splitText(selectedTree.value?.main_use))

const filteredSpecies = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  return speciesList.value.filter((item) => {
    const matchKeyword = !kw || (item.name || '').toLowerCase().includes(kw)

    const matchModel =
      modelFilter.value === 'all' ||
      (modelFilter.value === 'hasModel' && item.hasModel) ||
      (modelFilter.value === 'noModel' && !item.hasModel)

    return matchKeyword && matchModel
  })
})

const renderChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const labelMap = {
    temperature: '温度',
    humidity: '湿度',
    soil_moisture: '土壤湿度',
    wind_speed: '风速',
  }

  const xData = monitorList.value.map((item, index) => {
    const raw = item.record_time || item.created_at
    if (!raw) return String(index + 1)
    const d = new Date(raw)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  const yData = monitorList.value.map((item) => item[chartField.value] ?? 0)

  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: 50,
      right: 25,
      top: 40,
      bottom: 50,
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        color: '#94a3b8',
        rotate: 25,
      },
      axisLine: {
        lineStyle: {
          color: '#334155',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: labelMap[chartField.value],
      nameTextStyle: {
        color: '#cbd5e1',
      },
      axisLabel: {
        color: '#94a3b8',
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.15)',
        },
      },
    },
    series: [
      {
        data: yData,
        type: 'line',
        smooth: true,
        areaStyle: {},
      },
    ],
  })
}

const fetchSpecies = async () => {
  try {
    const [speciesRes, treeRes, modelRes] = await Promise.all([
      axios.get('/api/visual/species'),
      axios.get('/api/tree-species'),
      axios.get('/api/models/all'),
    ])

    const visualSpecies = speciesRes.data || []
    const treeList = treeRes.data || []
    const modelList = modelRes.data || []

    rawTreeList.value = treeList

    const modelSpeciesSet = new Set(
      modelList
        .filter((item) => item.model_path && item.model_path.trim() !== '')
        .map((item) => item.species_name)
        .filter(Boolean),
    )

    speciesList.value = visualSpecies.map((item) => ({
      ...item,
      hasModel: modelSpeciesSet.has(item.name),
    }))

    if (speciesList.value.length > 0) {
      selectSpecies(speciesList.value[0])
    }
  } catch (err) {
    console.error('[VisualModule] 获取树种数据失败', err.response?.data || err)
  }
}

const fetchMonitorList = async () => {
  try {
    const res = await axios.get('/api/monitor/list')
    monitorList.value = res.data || []
    nextTick(() => {
      renderChart()
    })
  } catch (err) {
    console.error('[VisualModule] 获取监测数据失败', err.response?.data || err)
  }
}

const selectSpecies = (item) => {
  currentSpecies.value = item.name

  const tree = rawTreeList.value.find((t) => t.species_name === item.name)
  selectedTree.value = tree
    ? {
        ...tree,
        hasModel: item.hasModel,
      }
    : {
        species_name: item.name,
        hasModel: item.hasModel,
      }

  if (threeSceneRef.value?.loadModel) {
    threeSceneRef.value.loadModel(item.name)
  }
}

const resetView = () => {
  threeSceneRef.value?.resetView?.()
}

const toggleAutoRotate = () => {
  autoRotate.value = !autoRotate.value
  threeSceneRef.value?.setAutoRotate?.(autoRotate.value)
}

const toggleWireframe = () => {
  wireframe.value = !wireframe.value
  threeSceneRef.value?.setWireframe?.(wireframe.value)
}

const handleResize = () => {
  nextTick(() => {
    threeSceneRef.value?.onParentResize?.()
    if (chartInstance) {
      chartInstance.resize()
    }
  })
}

onMounted(async () => {
  await Promise.all([fetchSpecies(), fetchMonitorList()])
  window.addEventListener('resize', handleResize)
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.visual-module {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 18px;
  width: 100%;
  min-height: 100vh;
  padding: 18px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #0f172a, #08101f);
  color: #e5e7eb;
}

.sidebar,
.viewer-card,
.info-card,
.chart-card {
  background: rgba(17, 25, 40, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  border-radius: 18px;
  overflow-y: auto;
}

.sidebar {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 36px);
  overflow: hidden;
}

.sidebar-top {
  flex-shrink: 0;
}

.sidebar-top h2 {
  font-size: 20px;
  margin-bottom: 14px;
}

.search-input,
.filter-select,
.chart-select {
  width: 100%;
  padding: 11px 12px;
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #31de16;
  box-sizing: border-box;
  outline: none;
}

.species-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.species-list::-webkit-scrollbar {
  width: 8px;
}

.species-list::-webkit-scrollbar-thumb {
  background: #1e90ff;
  border-radius: 10px;
}

.species-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.species-item {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border 0.2s ease;
}

.species-item:hover {
  background: rgba(34, 211, 238, 0.08);
}

.species-item.active {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.18), rgba(52, 211, 153, 0.14));
  border: 1px solid rgba(34, 211, 238, 0.25);
}

.species-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.species-name {
  font-weight: bold;
  font-size: 15px;
}

.species-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
}

.model-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.model-dot.yes {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.model-dot.no {
  background: #64748b;
}

.right-area {
  display: grid;
  grid-template-rows: 1fr 360px;
  gap: 18px;
  min-height: calc(100vh - 36px);
}

.top-area,
.bottom-area {
  min-height: 0;
}

.viewer-card {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.card-head h2,
.card-head h3 {
  margin-bottom: 6px;
}

.card-head p {
  color: #94a3b8;
  font-size: 13px;
}

.viewer-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.viewer-actions button {
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: bold;
  cursor: pointer;
  background: linear-gradient(135deg, #22d3ee, #34d399);
  color: #04111d;
}

.viewer-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
}

.bottom-area {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 18px;
}

.info-card,
.chart-card {
  padding: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
  overflow-y: auto;
}

.info-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
}

.info-item span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
}

.info-item strong {
  line-height: 1.5;
}

.block {
  margin-top: 14px;
}

.block h4 {
  margin-bottom: 10px;
  font-size: 15px;
}

.tag-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-list span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.12);
  border: 1px solid rgba(34, 211, 238, 0.25);
  color: #cffafe;
  font-size: 12px;
}

.empty-inline,
.empty-panel,
.empty-tip {
  color: #94a3b8;
}

.chart-box {
  width: 100%;
  height: 280px;
}

@media (max-width: 1200px) {
  .visual-module {
    grid-template-columns: 280px 1fr;
  }

  .bottom-area {
    grid-template-columns: 1fr;
  }

  .right-area {
    grid-template-rows: 1fr auto;
  }
}

@media (max-width: 900px) {
  .visual-module {
    grid-template-columns: 1fr;
  }

  .sidebar {
    height: 420px;
  }

  .right-area {
    min-height: auto;
  }
}
</style>
