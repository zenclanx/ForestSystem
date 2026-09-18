<template>
  <div class="forest-page">
    <!-- 浮动 AI 窗口 -->
    <FloatingWindow v-if="showWindow" :treeData="windowTreeData" @close="showWindow = false">
      <p>AI助手回答</p>
    </FloatingWindow>

    <!-- 顶部区域 -->
    <section class="top-section">
      <div class="title-area">
        <p class="page-badge">森林基础信息资源库</p>
        <h1>Forest Species Information Center</h1>
        <p class="page-desc">
          以树种数据库为核心，提供树种检索、基础档案展示、生态环境分析与资源信息浏览。
        </p>
      </div>

      <div class="action-area">
        <div class="search-box">
          <input
            v-model="keyword"
            placeholder="搜索树种名称 / 拉丁名 / 生态环境 / 分布区域"
            @keyup.enter="searchTree"
          />
        </div>

        <div class="filter-box">
          <select v-model="plantTypeFilter">
            <option value="">全部植物类型</option>
            <option v-for="item in plantTypeOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>

        <div class="button-group">
          <button @click="searchTree">搜索定位</button>
          <button @click="goToQuestionNaire">科研问卷</button>
          <button v-if="role === 'researcher' || role === 'admin'" @click="goToUpdate">
            信息更新
          </button>
          <button @click="openAiWindow">AI助手</button>
        </div>
      </div>
    </section>

    <!-- 统计区域 -->
    <section class="stats-section">
      <div class="stat-card">
        <span class="stat-label">树种总数</span>
        <h3>{{ stats.totalSpecies }}</h3>
        <p>tree_species 数据表</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">植物类型数</span>
        <h3>{{ stats.plantTypeCount }}</h3>
        <p>按 plant_type 统计</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">科数量</span>
        <h3>{{ stats.familyCount }}</h3>
        <p>按 family_name 统计</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">属数量</span>
        <h3>{{ stats.genusCount }}</h3>
        <p>按 genus_name 统计</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">带图片记录</span>
        <h3>{{ stats.imageCount }}</h3>
        <p>image_url 非空记录</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">当前结果数</span>
        <h3>{{ filteredTrees.length }}</h3>
        <p>当前筛选后的树种数量</p>
      </div>
    </section>

    <!-- 主内容 -->
    <section class="main-layout">
      <!-- 左侧列表 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3>树种列表</h3>
          <span>{{ filteredTrees.length }} 条</span>
        </div>

        <div class="sidebar-list">
          <div
            v-for="tree in filteredTrees"
            :key="tree.id"
            :class="['tree-item', { active: selectedTree && selectedTree.id === tree.id }]"
            @click="selectTree(tree)"
          >
            <div class="tree-item-top">
              <h4>{{ tree.species_name }}</h4>
              <span v-if="tree.image_url" class="img-badge">有图</span>
            </div>

            <p class="latin-name">{{ tree.species_latin_name || '暂无拉丁名' }}</p>

            <div class="mini-tags">
              <span>{{ tree.plant_type || '未分类' }}</span>
              <span>{{ tree.family_name || '未知科' }}</span>
            </div>
          </div>

          <div v-if="!filteredTrees.length" class="empty-tip">没有匹配到树种数据</div>
        </div>
      </aside>

      <!-- 右侧详情 -->
      <section class="detail-panel" ref="detailPanelRef">
        <template v-if="selectedTree">
          <!-- 基础档案 -->
          <div class="detail-card hero-card">
            <div class="hero-info">
              <div>
                <p class="small-title">树种基础档案</p>
                <h2>{{ selectedTree.species_name }}</h2>
                <p class="latin-display">
                  {{ selectedTree.species_latin_name || '暂无拉丁学名信息' }}
                </p>
              </div>

              <div class="hero-tags">
                <span>{{ selectedTree.plant_type || '未分类' }}</span>
                <span>{{ selectedTree.family_name || '未知科' }}</span>
                <span>{{ selectedTree.genus_name || '未知属' }}</span>
              </div>
            </div>

            <p class="desc">{{ selectedTree.description || '暂无描述信息' }}</p>
          </div>

          <!-- 详细信息 -->
          <div class="detail-grid">
            <div class="detail-card info-card">
              <h3>生态环境</h3>
              <div class="tag-list">
                <span v-for="(item, idx) in envList" :key="'env' + idx" class="use-tag">
                  {{ item }}
                </span>
                <span v-if="!envList.length" class="empty-inline">暂无生态环境信息</span>
              </div>
            </div>

            <div class="detail-card info-card">
              <h3>分布区域</h3>
              <div class="tag-list">
                <span v-for="(item, idx) in areaList" :key="'area' + idx" class="use-tag">
                  {{ item }}
                </span>
                <span v-if="!areaList.length" class="empty-inline">暂无分布区域信息</span>
              </div>
            </div>

            <div class="detail-card info-card">
              <h3>主要特征</h3>
              <div class="tag-list">
                <span v-for="(item, idx) in charList" :key="'char' + idx" class="use-tag">
                  {{ item }}
                </span>
                <span v-if="!charList.length" class="empty-inline">暂无特征信息</span>
              </div>
            </div>

            <div class="detail-card info-card">
              <h3>主要用途</h3>
              <div class="tag-list">
                <span v-for="(item, idx) in mainUseList" :key="'use' + idx" class="use-tag">
                  {{ item }}
                </span>
                <span v-if="!mainUseList.length" class="empty-inline">暂无用途信息</span>
              </div>
            </div>
          </div>

          <!-- 模型状态 -->
          <div class="detail-card model-card">
            <div class="card-head">
              <h3>模型资源状态</h3>
              <button class="refresh-btn" @click="fetchModelBySpecies(selectedTree.species_name)">
                刷新模型状态
              </button>
            </div>

            <div v-if="modelLoading" class="model-loading">模型信息加载中...</div>

            <div v-else-if="modelInfo" class="model-content">
              <div class="model-status success">当前树种已录入模型资源</div>
              <div class="model-grid">
                <div class="model-item">
                  <span>树种名称</span>
                  <strong>{{ modelInfo.species_name || selectedTree.species_name }}</strong>
                </div>
                <div class="model-item">
                  <span>模型ID</span>
                  <strong>{{ modelInfo.id || '--' }}</strong>
                </div>
                <div class="model-item">
                  <span>创建时间</span>
                  <strong>{{ formatDateTime(modelInfo.created_at) }}</strong>
                </div>
                <div class="model-item">
                  <span>更新时间</span>
                  <strong>{{ formatDateTime(modelInfo.updated_at) }}</strong>
                </div>
              </div>
            </div>

            <div v-else class="model-content">
              <div class="model-status warning">当前树种暂无对应模型资源</div>
            </div>
          </div>

          <!-- 树种图片 -->
          <div class="detail-card image-card">
            <h3>树种图片</h3>
            <div v-if="selectedTree.image_url" class="image-wrapper">
              <img :src="selectedTree.image_url" class="tree-img" />
            </div>
            <div v-else class="empty-tip">该树种暂无图片资源</div>
          </div>
        </template>

        <div v-else class="detail-card empty-state">请先从左侧选择一个树种查看详情</div>
      </section>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import FloatingWindow from '../components/AnswerAI.vue'

const router = useRouter()

// 显示/隐藏 AI 窗口
const showWindow = ref(false)
const windowTreeData = ref(null)

// 页面数据
const keyword = ref('')
const plantTypeFilter = ref('')
const treeSpecies = ref([])
const selectedTree = ref(null)
const detailPanelRef = ref(null)
const role = sessionStorage.getItem('access') || 'guest'

// 模型状态
const modelInfo = ref(null)
const modelLoading = ref(false)
const modelCache = new Map()

// 跳转
const goToQuestionNaire = () => router.push('/QuestionNaire')
const goToUpdate = () => router.push('/UpdateInfo')

// 工具方法
const splitText = (text) => {
  if (!text) return []
  return text
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

const formatDateTime = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

// 统计数据
const stats = computed(() => {
  const plantTypes = new Set()
  const families = new Set()
  const genera = new Set()

  let imageCount = 0

  treeSpecies.value.forEach((item) => {
    if (item.plant_type) plantTypes.add(item.plant_type)
    if (item.family_name) families.add(item.family_name)
    if (item.genus_name) genera.add(item.genus_name)
    if (item.image_url) imageCount++
  })

  return {
    totalSpecies: treeSpecies.value.length,
    plantTypeCount: plantTypes.size,
    familyCount: families.size,
    genusCount: genera.size,
    imageCount,
  }
})

// 下拉选项
const plantTypeOptions = computed(() => {
  return [...new Set(treeSpecies.value.map((item) => item.plant_type).filter(Boolean))]
})

// 当前树种信息拆分
const mainUseList = computed(() => splitText(selectedTree.value?.main_use))
const envList = computed(() => splitText(selectedTree.value?.environment))
const areaList = computed(() => splitText(selectedTree.value?.distribution_area))
const charList = computed(() => splitText(selectedTree.value?.characteristics))

// 过滤树种列表
const filteredTrees = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  return treeSpecies.value.filter((tree) => {
    const matchKeyword =
      !kw ||
      (tree.species_name || '').toLowerCase().includes(kw) ||
      (tree.species_latin_name || '').toLowerCase().includes(kw) ||
      (tree.environment || '').toLowerCase().includes(kw) ||
      (tree.distribution_area || '').toLowerCase().includes(kw)

    const matchPlantType = !plantTypeFilter.value || tree.plant_type === plantTypeFilter.value

    return matchKeyword && matchPlantType
  })
})

// 加载树种数据
const loadTrees = async () => {
  try {
    const res = await axios.get('/api/tree-species')
    treeSpecies.value = res.data || []
    selectedTree.value = treeSpecies.value[0] || null

    if (selectedTree.value) {
      windowTreeData.value = selectedTree.value
      await fetchModelBySpecies(selectedTree.value.species_name)
    }
  } catch (err) {
    console.error('加载树种数据失败', err.response?.data || err)
  }
}

// 查询对应模型，带缓存
const fetchModelBySpecies = async (speciesName) => {
  if (!speciesName) {
    modelInfo.value = null
    return
  }

  if (modelCache.has(speciesName)) {
    modelInfo.value = modelCache.get(speciesName)
    modelLoading.value = false
    return
  }

  modelLoading.value = true
  modelInfo.value = null

  try {
    const res = await axios.get('/api/models/bySpecies', {
      params: { species_name: speciesName },
    })

    const data = res.data
    const isValid = data && data.model_path && data.model_path.trim() !== ''

    modelInfo.value = isValid ? data : null
    modelCache.set(speciesName, modelInfo.value)
  } catch (err) {
    modelInfo.value = null
    modelCache.set(speciesName, null)

    if (err.response?.status !== 404) {
      console.error('获取模型资源失败', err.response?.data || err)
    }
  } finally {
    modelLoading.value = false
  }
}

// 选中树种
const selectTree = async (tree) => {
  selectedTree.value = tree
  windowTreeData.value = tree
  await fetchModelBySpecies(tree.species_name)

  nextTick(() => {
    if (detailPanelRef.value) {
      detailPanelRef.value.scrollTop = 0
    }
  })
}

// 搜索定位
const searchTree = () => {
  if (!filteredTrees.value.length) return
  selectTree(filteredTrees.value[0])
}

// 打开 AI 助手
const openAiWindow = () => {
  windowTreeData.value = selectedTree.value
  showWindow.value = true
}

onMounted(() => {
  loadTrees()
})
</script>

<style scoped>
.forest-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a, #08101f);
  color: #e5e7eb;
  padding: 18px;
  box-sizing: border-box;
}

/* 顶部区域 */
.top-section {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}

.title-area,
.action-area,
.stat-card,
.sidebar,
.detail-card {
  background: rgba(17, 25, 40, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  border-radius: 18px;
}

.title-area {
  padding: 26px;
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

.title-area h1 {
  font-size: 32px;
  line-height: 1.35;
  margin-bottom: 12px;
}

.page-desc {
  color: #cbd5e1;
  line-height: 1.8;
  font-size: 15px;
}

.action-area {
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}

.search-box input,
.filter-box select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  outline: none;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
}

.filter-box select {
  appearance: none;
  cursor: pointer;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button-group button,
.refresh-btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: bold;
  cursor: pointer;
  background: linear-gradient(135deg, #22d3ee, #34d399);
  color: #04111d;
  transition:
    opacity 0.2s ease,
    background 0.2s ease;
}

.button-group button:hover,
.refresh-btn:hover {
  opacity: 0.92;
}

/* 统计区 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.stat-card {
  padding: 20px 16px;
  text-align: center;
}

.stat-label {
  display: block;
  color: #67e8f9;
  font-size: 13px;
  margin-bottom: 10px;
}

.stat-card h3 {
  font-size: 28px;
  color: #fff;
  margin-bottom: 8px;
}

.stat-card p {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

/* 主布局 */
.main-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;
  align-items: start;
  min-height: 720px;
}

/* 左侧 */
.sidebar {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 720px;
  min-height: 0;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.sidebar-header h3 {
  font-size: 18px;
}

.sidebar-header span {
  color: #94a3b8;
  font-size: 13px;
}

.sidebar-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.sidebar-list::-webkit-scrollbar {
  width: 8px;
}

.sidebar-list::-webkit-scrollbar-thumb {
  background: #1e90ff;
  border-radius: 10px;
}

.sidebar-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.tree-item {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border 0.2s ease;
}

.tree-item:hover {
  background: rgba(34, 211, 238, 0.1);
}

.tree-item.active {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(52, 211, 153, 0.16));
  border: 1px solid rgba(34, 211, 238, 0.28);
}

.tree-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.tree-item h4 {
  font-size: 16px;
  margin-bottom: 6px;
}

.img-badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  white-space: nowrap;
}

.latin-name {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 10px;
  line-height: 1.5;
}

.mini-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mini-tags span {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 12px;
  color: #cbd5e1;
}

/* 右侧详情 */
.detail-panel {
  overflow-y: auto;
  max-height: 720px;
  min-height: 720px;
  padding-right: 4px;
}

.detail-panel::-webkit-scrollbar {
  width: 8px;
}

.detail-panel::-webkit-scrollbar-thumb {
  background: #1e90ff;
  border-radius: 10px;
}

.detail-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.detail-card {
  padding: 20px;
  margin-bottom: 16px;
}

.hero-card {
  padding: 24px;
}

.hero-info {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.small-title {
  color: #67e8f9;
  font-size: 13px;
  margin-bottom: 8px;
}

.hero-info h2 {
  font-size: 30px;
  margin-bottom: 8px;
}

.latin-display {
  color: #94a3b8;
  font-size: 14px;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

.hero-tags span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.12);
  border: 1px solid rgba(34, 211, 238, 0.24);
  color: #cffafe;
  font-size: 13px;
}

.desc {
  color: #cbd5e1;
  line-height: 1.85;
  font-size: 15px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-card h3,
.model-card h3,
.image-card h3 {
  margin-bottom: 14px;
  font-size: 18px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.use-tag {
  background: rgba(0, 212, 255, 0.15);
  border: 1px solid rgba(0, 212, 255, 0.35);
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #dffbff;
}

.empty-inline {
  color: #94a3b8;
  font-size: 14px;
}

/* 模型状态 */
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.model-loading {
  color: #94a3b8;
}

.model-status {
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 14px;
  font-weight: bold;
}

.model-status.success {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.model-status.warning {
  background: rgba(245, 158, 11, 0.16);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.28);
}

.model-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.model-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
}

.model-item span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
}

.model-item strong {
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
}

/* 图片 */
.image-wrapper {
  margin-top: 8px;
}

.tree-img {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: 14px;
  display: block;
}

.empty-tip,
.empty-state {
  color: #94a3b8;
  text-align: center;
  padding: 30px 0;
}

/* 响应式 */
@media (max-width: 1400px) {
  .stats-section {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .top-section,
  .main-layout,
  .detail-grid,
  .model-grid {
    grid-template-columns: 1fr;
  }

  .hero-info {
    flex-direction: column;
  }

  .sidebar,
  .detail-panel {
    height: auto;
    max-height: none;
    min-height: auto;
  }

  .sidebar-list {
    max-height: 420px;
  }
}

@media (max-width: 640px) {
  .stats-section {
    grid-template-columns: 1fr 1fr;
  }

  .button-group {
    flex-direction: column;
  }
}
</style>
