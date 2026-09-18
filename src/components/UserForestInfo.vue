<template>
  <div class="user-forest-page">
    <!-- 顶部介绍区 -->
    <section class="hero-section">
      <div class="hero-left">
        <p class="hero-badge">森林科普信息</p>
        <h1>森林树种科普浏览</h1>
        <p class="hero-desc">
          在这里你可以浏览系统收录的常见树种，了解它们的生态环境、分布区域、
          主要特征和用途，增强森林生态保护意识。
        </p>
      </div>

      <div class="hero-right">
        <div class="search-panel">
          <h3>快速查找</h3>

          <input
            v-model="keyword"
            class="search-input"
            placeholder="搜索树种名称 / 拉丁名 / 生态环境"
            @keyup.enter="searchTree"
          />

          <select v-model="plantTypeFilter" class="filter-select">
            <option value="">全部植物类型</option>
            <option v-for="item in plantTypeOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>

          <div class="search-actions">
            <button @click="searchTree">搜索定位</button>
            <button @click="router.push('/mailbox')">去留言</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 数据概览 -->
    <section class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">树种总数</span>
        <h2>{{ stats.totalSpecies }}</h2>
        <p>平台可浏览树种资源</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">植物类型数</span>
        <h2>{{ stats.plantTypeCount }}</h2>
        <p>不同植物分类统计</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">带图片树种</span>
        <h2>{{ stats.imageCount }}</h2>
        <p>可视化图片资源数量</p>
      </div>

      <div class="stat-card">
        <span class="stat-label">当前筛选结果</span>
        <h2>{{ filteredTrees.length }}</h2>
        <p>符合检索条件的树种</p>
      </div>
    </section>

    <!-- 主体内容 -->
    <section class="main-layout">
      <!-- 左侧树种列表 -->
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
          <!-- 头部档案 -->
          <div class="detail-card hero-card">
            <div class="hero-info">
              <div>
                <p class="small-title">树种科普信息卡</p>
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

          <!-- 图片区 -->
          <div class="detail-card image-card">
            <h3>树种图片</h3>

            <div v-if="selectedTree.image_url" class="image-wrapper">
              <img :src="selectedTree.image_url" class="tree-img" />
            </div>
            <div v-else class="empty-box">该树种暂无图片资源</div>
          </div>

          <!-- 信息区 -->
          <div class="detail-grid">
            <div class="detail-card info-card">
              <h3>生态环境</h3>
              <div class="tag-list">
                <span v-for="(item, idx) in envList" :key="'env' + idx" class="info-tag">
                  {{ item }}
                </span>
                <span v-if="!envList.length" class="empty-inline">暂无生态环境信息</span>
              </div>
            </div>

            <div class="detail-card info-card">
              <h3>分布区域</h3>
              <div class="tag-list">
                <span v-for="(item, idx) in areaList" :key="'area' + idx" class="info-tag">
                  {{ item }}
                </span>
                <span v-if="!areaList.length" class="empty-inline">暂无分布区域信息</span>
              </div>
            </div>

            <div class="detail-card info-card">
              <h3>主要特征</h3>
              <div class="tag-list">
                <span v-for="(item, idx) in charList" :key="'char' + idx" class="info-tag">
                  {{ item }}
                </span>
                <span v-if="!charList.length" class="empty-inline">暂无特征信息</span>
              </div>
            </div>

            <div class="detail-card info-card">
              <h3>主要用途</h3>
              <div class="tag-list">
                <span v-for="(item, idx) in mainUseList" :key="'use' + idx" class="info-tag">
                  {{ item }}
                </span>
                <span v-if="!mainUseList.length" class="empty-inline">暂无用途信息</span>
              </div>
            </div>
          </div>

          <!-- 科普提示 -->
          <div class="detail-card tip-card">
            <h3>科普小提示</h3>
            <div class="tip-list">
              <div class="tip-item">
                <h4>关注生态环境</h4>
                <p>不同树种适合生长在不同生态环境中，了解其习性有助于更好地认识森林生态系统。</p>
              </div>
              <div class="tip-item">
                <h4>认识分布区域</h4>
                <p>树种分布与气候、土壤、水分等因素关系密切，是生态适应性的直观体现。</p>
              </div>
              <div class="tip-item">
                <h4>了解树种用途</h4>
                <p>树木除了生态价值外，还有木材利用、景观建设、水土保持等多种社会价值。</p>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="detail-card empty-state">请先从左侧选择一个树种查看详情</div>
      </section>
    </section>

    <footer class="footer">© 2026 Forest Public Science Page | User Forest Information</footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const keyword = ref('')
const plantTypeFilter = ref('')
const treeSpecies = ref([])
const selectedTree = ref(null)
const detailPanelRef = ref(null)

const splitText = (text) => {
  if (!text) return []
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const stats = computed(() => {
  const plantTypes = new Set()
  let imageCount = 0

  treeSpecies.value.forEach((item) => {
    if (item.plant_type) plantTypes.add(item.plant_type)
    if (item.image_url) imageCount++
  })

  return {
    totalSpecies: treeSpecies.value.length,
    plantTypeCount: plantTypes.size,
    imageCount,
  }
})

const plantTypeOptions = computed(() => {
  return [...new Set(treeSpecies.value.map((item) => item.plant_type).filter(Boolean))]
})

const mainUseList = computed(() => splitText(selectedTree.value?.main_use))
const envList = computed(() => splitText(selectedTree.value?.environment))
const areaList = computed(() => splitText(selectedTree.value?.distribution_area))
const charList = computed(() => splitText(selectedTree.value?.characteristics))

const filteredTrees = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  return treeSpecies.value.filter((tree) => {
    const matchKeyword =
      !kw ||
      (tree.species_name || '').toLowerCase().includes(kw) ||
      (tree.species_latin_name || '').toLowerCase().includes(kw) ||
      (tree.environment || '').toLowerCase().includes(kw)

    const matchPlantType = !plantTypeFilter.value || tree.plant_type === plantTypeFilter.value

    return matchKeyword && matchPlantType
  })
})

const loadTrees = async () => {
  try {
    const res = await axios.get('/api/tree-species')
    treeSpecies.value = res.data || []
    selectedTree.value = treeSpecies.value[0] || null
  } catch (err) {
    console.error('加载树种数据失败', err.response?.data || err)
  }
}

const selectTree = (tree) => {
  selectedTree.value = tree

  nextTick(() => {
    if (detailPanelRef.value) {
      detailPanelRef.value.scrollTop = 0
    }
  })
}

const searchTree = () => {
  if (!filteredTrees.value.length) return
  selectTree(filteredTrees.value[0])
}

onMounted(() => {
  loadTrees()
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.user-forest-page {
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  color: #e5e7eb;
  background: linear-gradient(180deg, #0f172a, #08101f);
  font-family: 'Segoe UI', sans-serif;
}

.hero-section,
.stat-card,
.sidebar,
.detail-card {
  background: rgba(17, 25, 40, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  border-radius: 18px;
}

/* 顶部 */
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
}

.search-panel h3 {
  margin-bottom: 14px;
}

.search-input,
.filter-select {
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  outline: none;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  box-sizing: border-box;
}

.search-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-actions button {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: bold;
  cursor: pointer;
  background: linear-gradient(135deg, #22d3ee, #34d399);
  color: #04111d;
  transition: opacity 0.2s ease;
}

.search-actions button:hover {
  opacity: 0.92;
}

/* 统计 */
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

/* 主体 */
.main-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 18px;
  min-height: 720px;
}

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
  background: rgba(34, 211, 238, 0.08);
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

/* 详情 */
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

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-card h3,
.image-card h3,
.tip-card h3 {
  margin-bottom: 14px;
  font-size: 18px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.info-tag {
  background: rgba(0, 212, 255, 0.15);
  border: 1px solid rgba(0, 212, 255, 0.35);
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #dffbff;
}

.tip-list {
  display: grid;
  gap: 12px;
}

.tip-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 14px;
}

.tip-item h4 {
  margin-bottom: 8px;
  color: #e2e8f0;
}

.tip-item p {
  color: #94a3b8;
  line-height: 1.7;
  font-size: 14px;
}

.empty-inline,
.empty-box,
.empty-tip,
.empty-state {
  color: #94a3b8;
}

.empty-box,
.empty-state {
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
  .main-layout,
  .detail-grid {
    grid-template-columns: 1fr;
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

@media (max-width: 700px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .search-actions {
    flex-direction: column;
  }
}
</style>
