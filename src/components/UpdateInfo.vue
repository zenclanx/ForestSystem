<template>
  <div class="update-info-page">
    <!-- 顶部说明 -->
    <section class="hero-panel">
      <div class="hero-left">
        <p class="badge">树种信息维护中心</p>
        <h1>树种资源更新与管理</h1>
        <p class="hero-desc">支持树种资料检索、分页查看、新增编辑、图片上传与基础信息维护。</p>
      </div>

      <div class="hero-actions">
        <button class="action-btn primary" @click="openForm()">➕ 新增树种</button>
      </div>
    </section>

    <!-- 统计区 -->
    <section class="stats-grid">
      <div class="stat-card">
        <span>树种总数</span>
        <strong>{{ trees.length }}</strong>
      </div>
      <div class="stat-card">
        <span>当前筛选结果</span>
        <strong>{{ filteredTrees.length }}</strong>
      </div>
      <div class="stat-card">
        <span>带图记录数</span>
        <strong>{{ imageCount }}</strong>
      </div>
      <div class="stat-card">
        <span>当前页 / 总页数</span>
        <strong>{{ currentPage }} / {{ totalPages }}</strong>
      </div>
    </section>

    <!-- 搜索栏 -->
    <section class="panel">
      <div class="toolbar">
        <input v-model="keyword" placeholder="搜索树种名称或拉丁名..." />
        <button class="toolbar-btn" @click="resetSearch">🧹 重置</button>
        <button class="toolbar-btn primary" @click="openForm()">➕ 新增树种</button>
      </div>
    </section>

    <!-- 列表区 -->
    <section class="panel">
      <div class="panel-title">
        <h2>树种列表</h2>

        <div class="table-controls">
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
              <th>树种名称</th>
              <th>拉丁学名</th>
              <th>类型</th>
              <th>科</th>
              <th>属</th>
              <th>图片</th>
              <th>操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="pagedTrees.length === 0">
              <td colspan="8" class="empty-cell">暂无匹配的树种数据</td>
            </tr>

            <tr v-for="tree in pagedTrees" :key="tree.id">
              <td>{{ tree.id }}</td>
              <td>{{ tree.species_name || '--' }}</td>
              <td>{{ tree.species_latin_name || '--' }}</td>
              <td>{{ tree.plant_type || '--' }}</td>
              <td>{{ tree.family_name || '--' }}</td>
              <td>{{ tree.genus_name || '--' }}</td>
              <td>
                <div class="image-cell">
                  <img v-if="tree.image_url" :src="tree.image_url" class="tree-img" />
                  <span v-else class="no-image">无图</span>
                </div>
              </td>
              <td>
                <div class="action-group">
                  <button class="edit-btn" @click="openForm(tree)">✏ 编辑</button>
                  <button class="delete-btn" @click="deleteTree(tree.id)">🗑 删除</button>
                </div>
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

    <!-- 弹窗表单 -->
    <div v-if="showForm" class="form-overlay" @click.self="closeForm">
      <div class="form-card">
        <div class="form-header">
          <div>
            <h3>{{ form.id ? '编辑树种信息' : '新增树种信息' }}</h3>
            <p>{{ form.id ? '当前为编辑模式' : '当前为新增模式' }}</p>
          </div>
          <button class="close-btn" @click="closeForm">✖</button>
        </div>

        <div class="form-grid">
          <label>
            <span>树种名称</span>
            <input v-model="form.species_name" />
          </label>

          <label>
            <span>拉丁学名</span>
            <input v-model="form.species_latin_name" />
          </label>

          <label>
            <span>植物类型</span>
            <input v-model="form.plant_type" />
          </label>

          <label>
            <span>科</span>
            <input v-model="form.family_name" />
          </label>

          <label>
            <span>属</span>
            <input v-model="form.genus_name" />
          </label>

          <label class="full-row">
            <span>生态环境</span>
            <input v-model="form.environment" />
          </label>

          <label class="full-row">
            <span>分布区域</span>
            <input v-model="form.distribution_area" />
          </label>

          <label class="full-row">
            <span>性状特征</span>
            <input v-model="form.characteristics" />
          </label>

          <label class="full-row">
            <span>主要用途</span>
            <input v-model="form.main_use" />
          </label>

          <label class="full-row">
            <span>简介</span>
            <textarea v-model="form.description"></textarea>
          </label>

          <label class="full-row">
            <span>树种图片</span>
            <input type="file" @change="onImageChange" accept="image/*" />
          </label>
        </div>

        <div v-if="form.image_url" class="image-preview">
          <p>图片预览</p>
          <img :src="form.image_url" alt="树种图片" />
        </div>

        <div class="form-actions">
          <button class="save-btn" @click="saveTree">
            {{ form.id ? '💾 保存修改' : '➕ 添加树种' }}
          </button>
          <button class="cancel-btn" @click="closeForm">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const trees = ref([])
const keyword = ref('')
const showForm = ref(false)
const form = ref({})

const currentPage = ref(1)
const pageSize = ref(10)

const emptyForm = () => ({
  species_name: '',
  species_latin_name: '',
  plant_type: '',
  family_name: '',
  genus_name: '',
  description: '',
  environment: '',
  distribution_area: '',
  characteristics: '',
  main_use: '',
  image_url: '',
})

// 获取树种列表
const loadTrees = async () => {
  try {
    const res = await axios.get('/api/tree-species')
    trees.value = res.data || []

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (err) {
    console.error(err.response?.data || err)
    alert('加载树种列表失败，请检查控制台')
  }
}

// 搜索过滤
const filteredTrees = computed(() => {
  if (!keyword.value) return trees.value

  const key = keyword.value.toLowerCase()

  return trees.value.filter(
    (t) =>
      t.species_name?.toLowerCase().includes(key) ||
      t.species_latin_name?.toLowerCase().includes(key),
  )
})

const imageCount = computed(() => {
  return trees.value.filter((item) => item.image_url).length
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredTrees.value.length / pageSize.value))
})

const pagedTrees = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTrees.value.slice(start, end)
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

const resetSearch = () => {
  keyword.value = ''
  currentPage.value = 1
}

const handlePageSizeChange = () => {
  currentPage.value = 1
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

// 打开表单
const openForm = (tree = null) => {
  if (tree) {
    form.value = { ...tree }
  } else {
    form.value = emptyForm()
  }
  showForm.value = true
}

// 关闭表单
const closeForm = () => {
  showForm.value = false
  form.value = {}
}

// 保存树种
const saveTree = async () => {
  if (!form.value.species_name) {
    alert('树种名称不能为空')
    return
  }

  try {
    if (form.value.id) {
      await axios.put(`/api/tree-species/${form.value.id}`, form.value)
      alert('更新成功')
    } else {
      await axios.post('/api/tree-species', form.value)
      alert('新增成功')
    }

    closeForm()
    await loadTrees()
  } catch (err) {
    console.error(err.response?.data || err)
    alert('操作失败，请检查控制台')
  }
}

// 删除树种
const deleteTree = async (id) => {
  if (!confirm('确定删除此树种吗？')) return

  try {
    await axios.delete(`/api/tree-species/${id}`)
    alert('删除成功')
    await loadTrees()
  } catch (err) {
    console.error(err.response?.data || err)
    alert('删除失败，请检查控制台')
  }
}

// 图片上传
const onImageChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await axios.post('/api/tree-species/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    form.value.image_url = res.data.path
  } catch (err) {
    console.error(err.response?.data || err)
    alert('图片上传失败，请检查控制台')
  }
}

onMounted(loadTrees)
</script>

<style scoped>
.update-info-page {
  min-height: 100vh;
  padding: 20px;
  background: radial-gradient(circle at top, #0f172a, #05070f);
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
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
.toolbar-btn,
.edit-btn,
.delete-btn,
.save-btn,
.cancel-btn,
.pagination button {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.action-btn,
.toolbar-btn,
.save-btn,
.cancel-btn {
  padding: 10px 16px;
}

.action-btn.primary,
.toolbar-btn.primary,
.save-btn {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
}

.toolbar-btn {
  background: #334155;
  color: #e2e8f0;
}

.cancel-btn {
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

.action-btn:hover,
.toolbar-btn:hover,
.edit-btn:hover,
.delete-btn:hover,
.save-btn:hover,
.cancel-btn:hover,
.pagination button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.stat-card {
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 18px;
}

.stat-card span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.stat-card strong {
  color: #f8fafc;
  font-size: 28px;
}

.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar input {
  flex: 1;
  min-width: 240px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
  outline: none;
}

.toolbar input:focus,
.form-grid input:focus,
.form-grid textarea:focus {
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

.table-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
}

.table-controls select {
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
  min-width: 980px;
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

.image-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.tree-img {
  width: 58px;
  height: 58px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #334155;
}

.no-image {
  color: #94a3b8;
  font-size: 12px;
}

.action-group {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
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

.form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 20px;
}

.form-card {
  width: 760px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.form-header h3 {
  margin: 0 0 6px;
  color: #f8fafc;
  font-size: 22px;
}

.form-header p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.close-btn {
  border: none;
  background: transparent;
  color: #cbd5e1;
  font-size: 18px;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-grid label span {
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 600;
}

.form-grid input,
.form-grid textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
  box-sizing: border-box;
  outline: none;
}

.form-grid textarea {
  min-height: 120px;
  resize: vertical;
}

.full-row {
  grid-column: 1 / -1;
}

.image-preview {
  margin-top: 18px;
}

.image-preview p {
  margin-bottom: 10px;
  color: #cbd5e1;
  font-weight: 600;
}

.image-preview img {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hero-panel {
    flex-direction: column;
  }
}

@media (max-width: 760px) {
  .panel-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .hero-left h1 {
    font-size: 24px;
  }
}
</style>
