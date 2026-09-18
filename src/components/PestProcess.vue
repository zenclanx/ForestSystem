<template>
  <div class="pest-process-page">
    <!-- 顶部 -->
    <section class="hero-panel">
      <div class="hero-left">
        <p class="badge">病虫害事务处理中心</p>
        <h1>害虫任务处理与防治方案管理</h1>
        <p class="hero-desc">
          支持按状态筛选病虫害任务、分页查看记录、填写防治方案并完成事务处理。
        </p>
      </div>

      <div class="hero-actions">
        <button class="action-btn" @click="goBack">返回检测中心</button>
      </div>
    </section>

    <!-- 统计卡片 -->
    <section class="stats-grid">
      <div class="stat-card">
        <span>当前筛选状态</span>
        <strong>{{ statusText(statusFilter) }}</strong>
      </div>
      <div class="stat-card">
        <span>当前页</span>
        <strong>{{ currentPage }} / {{ totalPages }}</strong>
      </div>
      <div class="stat-card">
        <span>总任务数</span>
        <strong>{{ total }}</strong>
      </div>
      <div class="stat-card highlight">
        <span>本页记录数</span>
        <strong>{{ pestList.length }}</strong>
      </div>
    </section>

    <!-- 筛选栏 -->
    <section class="panel">
      <div class="toolbar">
        <div class="toolbar-item">
          <label for="statusSelect">状态筛选</label>
          <select id="statusSelect" v-model="statusFilter" @change="changeFilter">
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="processed">已处理</option>
            <option value="overdue">已过期</option>
          </select>
        </div>

        <div class="toolbar-item">
          <label for="pageSizeSelect">每页显示</label>
          <select id="pageSizeSelect" v-model.number="pageSize" @change="changePageSize">
            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 列表 -->
    <section class="panel">
      <div class="panel-title">
        <h2>害虫事务列表</h2>
        <span class="panel-tip">支持填写方案并提交处理结果</span>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>害虫类别</th>
              <th>检测时间</th>
              <th>状态</th>
              <th>防治方案</th>
              <th>操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="pestList.length === 0">
              <td colspan="6" class="empty-cell">暂无符合条件的害虫任务</td>
            </tr>

            <tr v-for="pest in pestList" :key="pest.id">
              <td>{{ pest.id }}</td>
              <td>{{ pest.pest_name || '--' }}</td>
              <td>{{ formatDateTime(pest.detect_time) }}</td>
              <td>
                <span class="status-badge" :class="statusClass(pest.status)">
                  {{ statusText(pest.status) }}
                </span>
              </td>
              <td>
                <input
                  v-model="pest.solution"
                  :disabled="isReadonly(pest.status)"
                  placeholder="请输入防治方案"
                />
              </td>
              <td>
                <button
                  class="submit-btn"
                  @click="updateSolution(pest)"
                  :disabled="isReadonly(pest.status)"
                >
                  {{ isReadonly(pest.status) ? '不可提交' : '提交方案' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const pestList = ref([])
const loading = ref(false)
const router = useRouter()

// 分页和筛选参数
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)
const statusFilter = ref('')
const pageSizeOptions = [5, 10, 20, 50]

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const goBack = () => router.push('/disease')

const statusText = (status) => {
  if (!status) return '全部'
  if (status === 'pending') return '待处理'
  if (status === 'processed') return '已处理'
  if (status === 'overdue') return '已过期'
  return status
}

const statusClass = (status) => {
  if (status === 'pending') return 'pending'
  if (status === 'processed') return 'processed'
  if (status === 'overdue') return 'overdue'
  return ''
}

const isReadonly = (status) => {
  return status === 'processed' || status === 'overdue'
}

const formatDateTime = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

// 获取害虫列表
const fetchPestList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/pestfind', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        status: statusFilter.value,
      },
    })

    pestList.value = res.data.data || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error(err.response?.data || err)
    alert('获取害虫任务失败，请检查控制台')
  } finally {
    loading.value = false
  }
}

// 更新方案
const updateSolution = async (pest) => {
  if (!pest.solution || !pest.solution.trim()) {
    alert('请输入防治方案')
    return
  }

  try {
    await axios.put(`http://localhost:3000/api/pestfind/${pest.id}/solution`, {
      solution: pest.solution,
    })
    alert('更新成功')
    fetchPestList()
  } catch (err) {
    console.error(err.response?.data || err)
    alert('更新失败: ' + (err.response?.data?.message || err.message))
  }
}

// 分页操作
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchPestList()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchPestList()
  }
}

// 改变每页显示行数
const changePageSize = () => {
  currentPage.value = 1
  fetchPestList()
}

// 改变状态筛选
const changeFilter = () => {
  currentPage.value = 1
  fetchPestList()
}

onMounted(() => {
  fetchPestList()
})
</script>

<style scoped>
.pest-process-page {
  min-height: 100vh;
  padding: 20px;
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #0f172a, #05070f);
}

.hero-panel,
.panel,
.stat-card {
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
.submit-btn,
.pagination button {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.action-btn,
.submit-btn {
  padding: 10px 16px;
  color: white;
}

.action-btn {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.submit-btn {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  font-weight: 700;
}

.action-btn:hover,
.submit-btn:hover,
.pagination button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.submit-btn:disabled,
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.stat-card {
  margin-bottom: 0;
  padding: 18px;
}

.stat-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.stat-card strong {
  font-size: 22px;
  color: #f8fafc;
}

.stat-card.highlight {
  border-color: rgba(245, 158, 11, 0.35);
}

.toolbar {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: end;
}

.toolbar-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
}

.toolbar-item label {
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 600;
}

select,
input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
  box-sizing: border-box;
  outline: none;
}

select:focus,
input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
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

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
}

table {
  width: 100%;
  min-width: 900px;
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
  transition: 0.2s;
}

tbody tr:hover {
  background: rgba(30, 41, 59, 0.7);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-width: 72px;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.12);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-badge.processed {
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-badge.overdue {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.empty-cell {
  color: #94a3b8;
  padding: 24px 0;
}

.pagination {
  margin-top: 18px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.pagination button {
  min-width: 88px;
  padding: 10px 14px;
  background: #0f172a;
  color: #e2e8f0;
  border: 1px solid #334155;
}

.loading {
  margin-top: 20px;
  color: #fbbf24;
  font-weight: bold;
  text-align: center;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hero-panel {
    flex-direction: column;
  }
}

@media (max-width: 700px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .hero-left h1 {
    font-size: 24px;
  }

  .toolbar,
  .panel-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-item {
    width: 100%;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>
