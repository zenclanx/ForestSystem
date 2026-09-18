<template>
  <div class="disease-page">
    <!-- 顶部 -->
    <section class="hero-panel">
      <div class="hero-left">
        <p class="badge">病虫害检测中心</p>
        <h1>害虫识别与防治建议分析</h1>
        <p class="hero-desc">
          基于 YOLOv8 模型对上传图片进行病虫害检测，支持单图检测、批量检测与事务写入。
        </p>
      </div>

      <div class="hero-actions">
        <button
          v-if="access === 'forestguard' || access === 'admin'"
          class="action-btn"
          @click="goToPestProcess"
        >
          事务处理
        </button>
      </div>
    </section>

    <!-- 状态卡片 -->
    <section class="summary-grid">
      <div class="summary-card">
        <span>当前用户</span>
        <strong>{{ username || '未登录' }}</strong>
      </div>
      <div class="summary-card">
        <span>当前身份</span>
        <strong>{{ access || 'guest' }}</strong>
      </div>
      <div class="summary-card">
        <span>检测模式</span>
        <strong>{{ mode === 'single' ? '单图片检测' : '批量检测' }}</strong>
      </div>
      <div class="summary-card highlight">
        <span>当前检测数</span>
        <strong>{{ mode === 'single' ? predictions.length : totalBatchPredictions }}</strong>
      </div>
    </section>

    <!-- 模式切换 -->
    <section class="panel">
      <div class="mode-switch">
        <label class="switch-item" :class="{ active: mode === 'single' }">
          <input type="radio" value="single" v-model="mode" />
          <span>单图片检测</span>
        </label>

        <label class="switch-item" :class="{ active: mode === 'batch' }">
          <input type="radio" value="batch" v-model="mode" />
          <span>批量检测</span>
        </label>
      </div>
    </section>

    <!-- 单图检测 -->
    <section v-if="mode === 'single'" class="panel">
      <div class="panel-title">
        <h2>单图检测</h2>
        <span class="panel-tip">适合快速识别单张图片中的害虫目标</span>
      </div>

      <div class="upload-toolbar">
        <input type="file" @change="handleFileChange" accept="image/*" />
        <button class="primary-btn" @click="uploadImage" :disabled="!selectedFile || loading">
          上传并检测
        </button>
        <button class="secondary-btn" @click="clearSingleResult" :disabled="loading">
          清空当前检测
        </button>
      </div>

      <div v-if="singleTags.length" class="tags-wrap">
        <span v-for="(tag, index) in singleTags" :key="index" class="tag-chip">{{ tag }}</span>
      </div>

      <div class="image-grid" v-if="previewUrl || resultUrl">
        <div v-if="previewUrl" class="image-card">
          <h3>原图</h3>
          <img :src="previewUrl" alt="原图" />
        </div>

        <div v-if="resultUrl" class="image-card">
          <h3>检测结果</h3>
          <img :src="resultUrl" alt="检测结果" />
        </div>
      </div>

      <div v-if="predictions.length" class="result-report">
        <div class="report-top">
          <div class="report-card">
            <span>检测目标数量</span>
            <strong>{{ predictions.length }}</strong>
          </div>
          <div class="report-card">
            <span>检测类别数</span>
            <strong>{{ singleUniqueClasses.length }}</strong>
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>害虫类别</th>
                <th>置信度</th>
                <th>坐标 [x1, y1, x2, y2]</th>
                <th>防治方案</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in predictions" :key="index">
                <td>{{ item.class }}</td>
                <td>{{ formatConfidence(item.confidence) }}</td>
                <td>{{ formatBBox(item.bbox) }}</td>
                <td>{{ item.treatment }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!loading && selectedFile && !predictions.length && resultUrl" class="empty-box">
        当前图片未检测到明显害虫目标
      </div>
    </section>

    <!-- 批量检测 -->
    <section v-if="mode === 'batch'" class="panel">
      <div class="panel-title">
        <h2>批量检测</h2>
        <span class="panel-tip">适合对多张图片或整个图片文件夹进行连续识别</span>
      </div>

      <div class="upload-toolbar">
        <button class="secondary-btn" @click="selectMultipleImages">选择多图片</button>
        <button class="secondary-btn" @click="selectFolder">选择文件夹</button>
        <button
          class="primary-btn"
          @click="uploadImages"
          :disabled="!selectedFiles.length || loading"
        >
          上传并检测（批量）
        </button>
        <button class="secondary-btn" @click="clearBatchResult" :disabled="loading">
          清空批量结果
        </button>
      </div>

      <div v-if="selectedFiles.length" class="report-top">
        <div class="report-card">
          <span>已选图片数</span>
          <strong>{{ selectedFiles.length }}</strong>
        </div>
        <div class="report-card">
          <span>已检测目标数</span>
          <strong>{{ totalBatchPredictions }}</strong>
        </div>
      </div>

      <div v-if="batchResults.length" class="batch-list">
        <div v-for="(result, index) in batchResults" :key="'batch-' + index" class="batch-card">
          <div class="batch-header">
            <h3>{{ result.filename || `图片 ${index + 1}` }}</h3>
            <span class="batch-count">{{ result.predictions?.length || 0 }} 个目标</span>
          </div>

          <div class="batch-images">
            <div v-if="previewUrls[index]" class="image-card small">
              <h4>原图</h4>
              <img :src="previewUrls[index]" :alt="'原图 ' + (index + 1)" />
            </div>

            <div class="image-card small">
              <h4>检测结果</h4>
              <img
                :src="
                  result.resultBase64
                    ? 'data:image/png;base64,' + result.resultBase64
                    : result.resultUrl
                "
                :alt="'结果图 ' + (index + 1)"
              />
            </div>
          </div>

          <div v-if="result.predictions && result.predictions.length" class="batch-predictions">
            <div class="tags-wrap">
              <span v-for="(p, i) in result.predictions" :key="i" class="tag-chip">
                {{ p.class }}
              </span>
            </div>

            <ul class="prediction-list">
              <li v-for="(p, i) in result.predictions" :key="i">
                <div class="prediction-left">
                  <span class="pred-class">{{ p.class }}</span>
                  <span class="pred-conf">置信度：{{ formatConfidence(p.confidence) }}</span>
                </div>
                <span class="pred-treatment">{{ p.treatment }}</span>
              </li>
            </ul>
          </div>

          <div v-else class="empty-box small-empty">当前图片未检测到明显害虫目标</div>
        </div>
      </div>
    </section>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-mask">
      <div class="loading-box">检测中，请稍候...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = sessionStorage.getItem('username') || ''
const access = sessionStorage.getItem('access') || 'guest'

// 模式切换
const mode = ref('single')

// 路由
const goToPestProcess = () => {
  router.push('/PestProcess')
}

// 单图检测
const selectedFile = ref(null)
const previewUrl = ref('')
const resultUrl = ref('')
const predictions = ref([])

// 防治方案映射
const pestTreatmentMap = {
  蜈蚣: '使用杀虫剂并清理杂物',
  蟑螂: '保持清洁，使用蟑螂诱杀剂',
  家蜈蚣: '保持干燥，封堵缝隙',
  幼虫: '定期检查植物并喷洒安全杀虫剂',
  蛾蝇: '使用诱捕灯和杀虫剂',
  臭虫: '清洗衣物，高温处理',
  家蛀蛾: '清理谷物，使用防蛀剂',
  蜘蛛: '清理角落，保持通风',
}

const loading = ref(false)

// 批量检测
const selectedFiles = ref([])
const previewUrls = ref([])
const batchResults = ref([])

let fileInput = null
let folderInput = null

const singleUniqueClasses = computed(() => {
  return [...new Set(predictions.value.map((item) => item.class))]
})

const singleTags = computed(() => {
  return singleUniqueClasses.value
})

const totalBatchPredictions = computed(() => {
  return batchResults.value.reduce((sum, item) => {
    return sum + (item.predictions?.length || 0)
  }, 0)
})

const formatBBox = (bbox) => {
  if (!bbox) return '--'
  const flat = Array.isArray(bbox[0]) ? bbox[0] : bbox
  return flat.map((n) => Number(n).toFixed(1)).join(', ')
}

const formatConfidence = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '--'
  return `${(Number(value) * 100).toFixed(1)}%`
}

function revokeUrls(urls) {
  urls.forEach((url) => {
    if (url) URL.revokeObjectURL(url)
  })
}

// 选择单图文件
function handleFileChange(e) {
  const file = e.target.files[0]
  if (!file) return

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  resultUrl.value = ''
  predictions.value = []
}

function clearSingleResult() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)

  selectedFile.value = null
  previewUrl.value = ''
  resultUrl.value = ''
  predictions.value = []
}

function clearBatchResult() {
  revokeUrls(previewUrls.value)
  selectedFiles.value = []
  previewUrls.value = []
  batchResults.value = []
}

// 保存害虫记录到 Node.js 后端
async function savePestRecords(preds) {
  if (!preds.length) return
  if (access != 'user') {
    for (const item of preds) {
      const pestName = item.class
      const detectedAt = new Date().toLocaleString('zh-CN', { hour12: false })
      const treatmentPlan = pestTreatmentMap[pestName] || item.treatment || ''
      item.treatment = treatmentPlan

      try {
        await axios.post('http://localhost:3000/api/pestfind', {
          pest_name: pestName,
          detected_at: detectedAt,
          status: 'pending',
        })
      } catch (err) {
        console.error(err.response?.data || err)
      }
    }
  }
}

// 上传单图：改为一次请求 predict-all
async function uploadImage() {
  if (!selectedFile.value) return
  loading.value = true

  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)

    const res = await axios.post('http://127.0.0.1:5000/predict-all', formData)
    const preds = res.data.predictions || []

    predictions.value = preds
    resultUrl.value = res.data.resultBase64 ? 'data:image/png;base64,' + res.data.resultBase64 : ''

    await savePestRecords(preds)
  } catch (err) {
    console.error(err.response?.data || err)
    alert('检测失败，请查看控制台')
  } finally {
    loading.value = false
  }
}

function selectMultipleImages() {
  if (!fileInput) {
    fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.multiple = true
    fileInput.onchange = (e) => {
      revokeUrls(previewUrls.value)
      selectedFiles.value = Array.from(e.target.files)
      previewUrls.value = selectedFiles.value.map((f) => URL.createObjectURL(f))
      batchResults.value = []
    }
  }
  fileInput.click()
}

function selectFolder() {
  if (!folderInput) {
    folderInput = document.createElement('input')
    folderInput.type = 'file'
    folderInput.webkitdirectory = true
    folderInput.onchange = (e) => {
      revokeUrls(previewUrls.value)
      selectedFiles.value = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'))
      previewUrls.value = selectedFiles.value.map((f) => URL.createObjectURL(f))
      batchResults.value = []
    }
  }
  folderInput.click()
}

async function uploadImages() {
  if (!selectedFiles.value.length) return
  loading.value = true
  batchResults.value = []

  try {
    const formData = new FormData()
    selectedFiles.value.forEach((file) => formData.append('images', file))

    const res = await axios.post('http://127.0.0.1:5000/predict-batch', formData)
    const results = res.data.results || []

    for (const r of results) {
      const preds = r.predictions || []
      await savePestRecords(preds)
    }

    batchResults.value = results
  } catch (err) {
    console.error(err.response?.data || err)
    alert('批量检测失败，请查看控制台')
  } finally {
    loading.value = false
  }
}

watch(mode, (newMode) => {
  if (newMode === 'single') {
    clearBatchResult()
  } else {
    clearSingleResult()
  }
})

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  revokeUrls(previewUrls.value)
})
</script>

<style scoped>
.disease-page {
  min-height: 100vh;
  padding: 20px;
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #0f172a, #05070f);
}

.hero-panel,
.panel,
.summary-card,
.image-card,
.batch-card {
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

.action-btn,
.primary-btn,
.secondary-btn {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
  padding: 10px 16px;
  color: white;
}

.action-btn,
.primary-btn {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.secondary-btn {
  background: linear-gradient(135deg, #475569, #334155);
}

.action-btn:hover,
.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  margin-bottom: 0;
  padding: 18px;
}

.summary-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.summary-card strong {
  font-size: 22px;
  color: #f8fafc;
}

.summary-card.highlight {
  border-color: rgba(245, 158, 11, 0.35);
}

.mode-switch {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.switch-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid #334155;
  background: #020617;
  cursor: pointer;
  color: #cbd5e1;
}

.switch-item.active {
  border-color: #38bdf8;
  color: #93c5fd;
  background: rgba(56, 189, 248, 0.08);
}

.switch-item input {
  accent-color: #38bdf8;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.upload-toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.upload-toolbar input[type='file'] {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.28);
  color: #86efac;
  font-size: 12px;
}

.image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 18px;
}

.image-card {
  margin-bottom: 0;
}

.image-card.small {
  padding: 16px;
}

.image-card h3,
.image-card h4 {
  margin: 0 0 12px;
  color: #f8fafc;
}

.image-card img {
  width: 100%;
  max-height: 420px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
}

.result-report {
  margin-top: 18px;
}

.report-top {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

.report-card {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 14px;
}

.report-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.report-card strong {
  font-size: 22px;
  color: #f8fafc;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
}

table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
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
  font-weight: 600;
}

tbody tr {
  background: rgba(2, 6, 23, 0.55);
}

tbody tr:hover {
  background: rgba(30, 41, 59, 0.7);
}

.batch-list {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}

.batch-card {
  margin-bottom: 0;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.batch-header h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 18px;
  word-break: break-word;
}

.batch-count {
  font-size: 12px;
  color: #cbd5e1;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.16);
  padding: 4px 10px;
  border-radius: 999px;
}

.batch-images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.batch-predictions {
  margin-top: 10px;
}

.prediction-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  padding-left: 0;
  list-style: none;
}

.prediction-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 12px 14px;
  line-height: 1.7;
}

.prediction-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pred-class {
  color: #93c5fd;
  font-weight: 700;
  min-width: 90px;
}

.pred-conf {
  color: #94a3b8;
  font-size: 13px;
}

.pred-treatment {
  color: #cbd5e1;
  text-align: right;
}

.empty-box {
  color: #94a3b8;
  text-align: center;
  padding: 22px 0;
}

.small-empty {
  padding-top: 8px;
}

.loading-mask {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.loading-box {
  background: #0f172a;
  border: 1px solid #1e293b;
  color: #f8fafc;
  padding: 18px 24px;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.35);
  font-size: 16px;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hero-panel,
  .image-grid,
  .batch-images {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}

@media (max-width: 700px) {
  .summary-grid,
  .report-top {
    grid-template-columns: 1fr;
  }

  .hero-left h1 {
    font-size: 24px;
  }

  .upload-toolbar,
  .prediction-list li,
  .batch-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .upload-toolbar input[type='file'],
  .primary-btn,
  .secondary-btn {
    width: 100%;
  }

  .pred-treatment {
    text-align: left;
  }
}
</style>
