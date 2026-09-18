<template>
  <div class="environment-record-page">
    <div class="top-bar">
      <div>
        <p class="badge">环境监测记录管理</p>
        <h2>森林环境数据管理</h2>
        <p class="desc">支持环境监测数据新增、编辑、删除、分页查看与风险状态识别。</p>
      </div>
      <button @click="goBack" class="back-btn">返回概览</button>
    </div>

    <!-- 表单区 -->
    <section class="panel">
      <div class="panel-title">
        <h3>{{ form.id ? '编辑环境记录' : '新增环境记录' }}</h3>
        <span class="panel-tip">{{ form.id ? '当前为编辑模式' : '当前为新增模式' }}</span>
      </div>

      <form class="record-form" @submit.prevent="submitForm">
        <input
          v-model.number="form.temperature"
          type="number"
          step="0.01"
          min="-50"
          max="60"
          placeholder="温度 (℃)"
          required
        />
        <input
          v-model.number="form.humidity"
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="湿度 (%)"
          required
        />
        <input
          v-model.number="form.precipitation"
          type="number"
          step="0.01"
          min="0"
          placeholder="日降水量 (mm)"
        />
        <input
          v-model.number="form.wind_speed"
          type="number"
          step="0.01"
          min="0"
          placeholder="风速 (m/s)"
        />

        <select v-model="form.wind_direction" required>
          <option value="" disabled>请选择风向</option>
          <option value="北">北</option>
          <option value="东北">东北</option>
          <option value="东">东</option>
          <option value="东南">东南</option>
          <option value="南">南</option>
          <option value="西南">西南</option>
          <option value="西">西</option>
          <option value="西北">西北</option>
        </select>

        <input
          v-model.number="form.sunshine_hours"
          type="number"
          step="0.01"
          min="0"
          max="24"
          placeholder="日照时长 (h)"
        />
        <input
          v-model.number="form.soil_moisture"
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="土壤含水量 (%)"
        />
        <input v-model="form.record_time" type="datetime-local" required />

        <div class="form-actions">
          <button type="submit" class="submit-btn">{{ form.id ? '更新记录' : '新增记录' }}</button>
          <button type="button" class="reset-btn" @click="resetForm">重置</button>
        </div>
      </form>
    </section>

    <!-- 统计与分页控制 -->
    <section class="panel">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <div class="info-card">
            <span>总记录数</span>
            <strong>{{ sortedRecords.length }}</strong>
          </div>
          <div class="info-card">
            <span>当前页</span>
            <strong>{{ currentPage }} / {{ totalPages }}</strong>
          </div>
        </div>

        <div class="toolbar-right">
          <label>每页显示：</label>
          <select v-model.number="pageSize" @change="handlePageSizeChange">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="15">15</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>温度</th>
              <th>湿度</th>
              <th>降水量</th>
              <th>风速</th>
              <th>风向</th>
              <th>日照时长</th>
              <th>土壤含水量</th>
              <th>风险状态</th>
              <th>数据时间</th>
              <th>操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="pagedRecords.length === 0">
              <td colspan="11" class="empty-cell">暂无环境记录数据</td>
            </tr>

            <tr v-for="item in pagedRecords" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.temperature }}</td>
              <td>{{ item.humidity }}</td>
              <td>{{ item.precipitation }}</td>
              <td>{{ item.wind_speed }}</td>
              <td>{{ item.wind_direction || '--' }}</td>
              <td>{{ item.sunshine_hours }}</td>
              <td>{{ item.soil_moisture }}</td>
              <td>
                <span class="risk-tag" :class="getRiskInfo(item).className">
                  {{ getRiskInfo(item).label }}
                </span>
              </td>
              <td>{{ formatDate(item.record_time) }}</td>
              <td class="action-cell">
                <button class="edit-btn" @click="editRecord(item)">编辑</button>
                <button class="delete-btn" @click="deleteRecord(item.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="currentPage === 1" @click="goToPrevPage">上一页</button>
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page)"
          :class="{ active: currentPage === page }"
        >
          {{ page }}
        </button>
        <button :disabled="currentPage === totalPages" @click="goToNextPage">下一页</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const goBack = () => {
  router.push('/monitor')
}

const records = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const form = ref({
  id: null,
  temperature: '',
  humidity: '',
  precipitation: '',
  wind_speed: '',
  wind_direction: '',
  sunshine_hours: '',
  soil_moisture: '',
  record_time: '',
})

const sortedRecords = computed(() => {
  return [...records.value].sort((a, b) => {
    return new Date(b.record_time) - new Date(a.record_time)
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(sortedRecords.value.length / pageSize.value))
})

const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedRecords.value.slice(start, end)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []

  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)

  if (current <= 3) {
    end = Math.min(total, 5)
  }

  if (current >= total - 2) {
    start = Math.max(1, total - 4)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const loadRecords = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/monitor/list')
    records.value = res.data || []

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (err) {
    console.error('获取记录失败', err.response?.data || err)
  }
}

// 表单校验：true 通过，false 拦截
const validateForm = () => {
  const f = form.value

  if (f.temperature === '' || f.temperature < -50 || f.temperature > 60) {
    alert('温度必须在 -50℃ ~ 60℃ 之间')
    return false
  }
  if (f.humidity === '' || f.humidity < 0 || f.humidity > 100) {
    alert('湿度必须在 0% ~ 100% 之间')
    return false
  }
  if (f.precipitation !== '' && f.precipitation < 0) {
    alert('降水量不能为负数')
    return false
  }
  if (f.wind_speed !== '' && f.wind_speed < 0) {
    alert('风速不能为负数')
    return false
  }
  if (!f.wind_direction) {
    alert('请选择风向')
    return false
  }
  if (f.sunshine_hours !== '' && (f.sunshine_hours < 0 || f.sunshine_hours > 24)) {
    alert('日照时长必须在 0 ~ 24 小时之间')
    return false
  }
  if (f.soil_moisture !== '' && (f.soil_moisture < 0 || f.soil_moisture > 100)) {
    alert('土壤含水量必须在 0% ~ 100% 之间')
    return false
  }
  if (!f.record_time) {
    alert('请选择记录时间')
    return false
  }

  return true
}

const submitForm = async () => {
  if (!validateForm()) return

  try {
    if (form.value.id) {
      await axios.put(`http://localhost:3000/api/monitor/update/${form.value.id}`, form.value)
      alert('更新成功')
    } else {
      await axios.post('http://localhost:3000/api/monitor/create', form.value)
      alert('新增成功')
    }

    resetForm()
    await loadRecords()
    currentPage.value = 1
  } catch (err) {
    console.error('提交失败', err.response?.data || err)
    alert('提交失败，请检查控制台')
  }
}

const editRecord = (item) => {
  form.value = {
    ...item,
    record_time: new Date(item.record_time).toISOString().slice(0, 16),
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const deleteRecord = async (id) => {
  if (!confirm('确定删除这条记录吗？')) return

  try {
    await axios.delete(`http://localhost:3000/api/monitor/delete/${id}`)
    alert('删除成功')
    await loadRecords()

    if (pagedRecords.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (err) {
    console.error('删除失败', err.response?.data || err)
    alert('删除失败，请检查控制台')
  }
}

const resetForm = () => {
  form.value = {
    id: null,
    temperature: '',
    humidity: '',
    precipitation: '',
    wind_speed: '',
    wind_direction: '',
    sunshine_hours: '',
    soil_moisture: '',
    record_time: '',
  }
}

const formatDate = (datetime) => {
  if (!datetime) return '--'
  return new Date(datetime).toLocaleString()
}

const getRiskInfo = (item) => {
  const temperature = Number(item.temperature)
  const humidity = Number(item.humidity)
  const precipitation = Number(item.precipitation)
  const windSpeed = Number(item.wind_speed)
  const soilMoisture = Number(item.soil_moisture)

  let score = 0

  if (temperature > 35) score += 2
  else if (temperature > 30) score += 1

  if (humidity < 20) score += 2
  else if (humidity < 35) score += 1

  if (precipitation > 50) score += 2
  else if (precipitation > 30) score += 1

  if (windSpeed > 20) score += 2
  else if (windSpeed > 12) score += 1

  if (soilMoisture < 10 || soilMoisture > 80) score += 1

  if (score >= 5) {
    return { label: '高风险', className: 'danger' }
  }
  if (score >= 2) {
    return { label: '关注', className: 'warning' }
  }
  return { label: '正常', className: 'safe' }
}

const goToPage = (page) => {
  currentPage.value = page
}

const goToPrevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const handlePageSizeChange = () => {
  currentPage.value = 1
}

onMounted(loadRecords)
</script>

<style scoped>
/* 样式不变，跟你原来的一样 */
.environment-record-page {
  min-height: 100vh;
  padding: 20px;
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #0f172a, #05070f);
}

.top-bar,
.panel {
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid #1e293b;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 18px;
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.25);
}

.top-bar {
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

.top-bar h2 {
  margin: 0 0 10px;
  font-size: 30px;
  color: #f8fafc;
}

.desc {
  color: #cbd5e1;
  line-height: 1.8;
  margin: 0;
}

.back-btn {
  border: 1px solid #334155;
  background: linear-gradient(135deg, #020617, #111827);
  color: #e2e8f0;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.back-btn:hover {
  transform: translateY(-2px);
  border-color: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-title h3 {
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

.record-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.record-form input,
.record-form select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
  box-sizing: border-box;
  outline: none;
}

.record-form input:focus,
.record-form select:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
}

.form-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.submit-btn,
.reset-btn,
.edit-btn,
.delete-btn,
.pagination button {
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s;
}

.submit-btn,
.reset-btn {
  padding: 11px 16px;
}

.submit-btn {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
}

.reset-btn {
  background: #334155;
  color: #e2e8f0;
}

.edit-btn {
  background: #0f766e;
  color: #ecfeff;
  padding: 7px 12px;
}

.delete-btn {
  background: #b91c1c;
  color: #fff1f2;
  padding: 7px 12px;
}

.submit-btn:hover,
.reset-btn:hover,
.edit-btn:hover,
.delete-btn:hover,
.pagination button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.info-card {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 12px 16px;
  min-width: 130px;
}

.info-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 6px;
}

.info-card strong {
  font-size: 20px;
  color: #f8fafc;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
}

.toolbar-right select {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
}

table {
  width: 100%;
  min-width: 1100px;
  border-collapse: collapse;
  overflow: hidden;
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
  position: sticky;
  top: 0;
}

tbody tr {
  background: rgba(2, 6, 23, 0.55);
  transition: 0.2s;
}

tbody tr:hover {
  background: rgba(30, 41, 59, 0.7);
}

.action-cell {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.risk-tag {
  display: inline-block;
  min-width: 56px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.risk-tag.safe {
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.risk-tag.warning {
  background: rgba(245, 158, 11, 0.12);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.risk-tag.danger {
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
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination button {
  min-width: 42px;
  padding: 9px 12px;
  background: #0f172a;
  color: #e2e8f0;
  border: 1px solid #334155;
}

.pagination button.active {
  background: rgba(56, 189, 248, 0.14);
  color: #38bdf8;
  border-color: #38bdf8;
}

.pagination button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .top-bar,
  .panel-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    grid-column: 1 / -1;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .top-bar h2 {
    font-size: 24px;
  }

  .record-form {
    grid-template-columns: 1fr;
  }
}
</style>
