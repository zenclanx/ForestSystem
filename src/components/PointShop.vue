<template>
  <div class="point-shop-page">
    <!-- 顶部 -->
    <section class="hero-panel">
      <div class="hero-left">
        <p class="badge">积分商城</p>
        <h1>积分兑换与礼品中心</h1>
        <p class="hero-desc">
          完成问卷可获得积分，积分可用于兑换商城礼品。当前版本支持礼品浏览、筛选、兑换与记录查看。
        </p>
      </div>

      <div class="hero-actions">
        <button class="action-btn" @click="goBack">返回问卷中心</button>
      </div>
    </section>

    <!-- 用户信息 -->
    <section class="summary-grid">
      <div class="summary-card">
        <span>当前用户</span>
        <strong>{{ username || '未登录' }}</strong>
      </div>
      <div class="summary-card">
        <span>当前身份</span>
        <strong>{{ access || 'user' }}</strong>
      </div>
      <div class="summary-card highlight">
        <span>当前积分</span>
        <strong>{{ userPoint }}</strong>
      </div>
      <div class="summary-card">
        <span>可兑换商品数</span>
        <strong>{{ availableCount }}</strong>
      </div>
    </section>

    <!-- 工具栏 -->
    <section class="panel">
      <div class="toolbar">
        <input v-model="keyword" placeholder="搜索礼品名称..." />

        <select v-model="selectedCategory">
          <option value="">全部分类</option>
          <option value="学习用品">学习用品</option>
          <option value="生活用品">生活用品</option>
          <option value="纪念礼品">纪念礼品</option>
        </select>

        <button class="toolbar-btn" @click="resetFilter">🧹 重置</button>
      </div>
    </section>

    <div class="main-grid">
      <!-- 左侧商品 -->
      <section class="panel goods-panel">
        <div class="panel-title">
          <h2>礼品列表</h2>
          <span class="panel-tip">共 {{ filteredGoods.length }} 件礼品</span>
        </div>

        <div v-if="filteredGoods.length" class="goods-grid">
          <div v-for="item in filteredGoods" :key="item.id" class="goods-card">
            <div class="goods-image-wrap">
              <img :src="item.image" :alt="item.name" class="goods-image" />
              <span class="goods-category">{{ item.category }}</span>
            </div>

            <div class="goods-body">
              <h3>{{ item.name }}</h3>
              <p class="goods-desc">{{ item.desc }}</p>

              <div class="goods-meta">
                <div class="meta-item">
                  <span>所需积分</span>
                  <strong>{{ item.point }}</strong>
                </div>
              </div>

              <div class="goods-status">
                <span class="status-tag" :class="canExchange(item) ? 'ok' : 'not-ok'">
                  {{ canExchange(item) ? '可兑换' : '积分不足 ' }}
                </span>
              </div>

              <button
                class="exchange-btn"
                :disabled="!canExchange(item)"
                @click="exchangeGift(item)"
              >
                {{ canExchange(item) ? '立即兑换' : '暂不可兑换' }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-box">暂无符合条件的礼品</div>
      </section>

      <!-- 右侧记录 -->
      <section class="panel record-panel">
        <div class="panel-title">
          <h2>兑换记录</h2>
          <span class="panel-tip">最近 {{ exchangeRecords.length }} 条</span>
        </div>

        <div v-if="exchangeRecords.length" class="record-list">
          <div v-for="(record, index) in exchangeRecords" :key="index" class="record-item">
            <div class="record-top">
              <strong>{{ record.name }}</strong>
              <span>{{ record.time }}</span>
            </div>
            <div class="record-bottom">
              <span>消耗积分：{{ record.point }}</span>
              <span>兑换后剩余：{{ record.remainingPoint }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-box">暂无兑换记录</div>

        <div class="divider"></div>

        <div class="panel-title">
          <h2>商城说明</h2>
        </div>

        <div class="tips-box">
          <p>1. 用户通过完成问卷获得积分。</p>
          <p>2. 积分满足条件后即可兑换对应礼品。</p>
          <p>3. 当前演示版本礼品图片统一使用同一张示例图。</p>
          <p>4. 兑换后会立即扣除积分，并记录兑换信息。</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import giftImg from '@/assets/picture/礼品2.jpg'

const router = useRouter()

const username = sessionStorage.getItem('username') || ''
const access = sessionStorage.getItem('access') || 'user'
const token = sessionStorage.getItem('atoken') || ''

const userPoint = ref(0)
const keyword = ref('')
const selectedCategory = ref('')
const exchangeRecords = ref([])

const goodsList = ref([
  {
    id: 1,
    name: '森林主题马克杯',
    category: '生活用品',
    point: 20,
    stock: 20,
    desc: '适合日常使用的纪念马克杯，可作为积分兑换礼品。',
    image: giftImg,
  },
  {
    id: 2,
    name: '森林书签礼盒',
    category: '学习用品',
    point: 15,
    stock: 30,
    desc: '适合问卷活动纪念与学习使用的文创书签礼盒。',
    image: giftImg,
  },
  {
    id: 3,
    name: '生态主题笔记本',
    category: '学习用品',
    point: 25,
    stock: 18,
    desc: '适合作为学习记录和问卷奖励发放的纪念笔记本。',
    image: giftImg,
  },
  {
    id: 4,
    name: '森林公益帆布袋',
    category: '生活用品',
    point: 30,
    stock: 12,
    desc: '环保主题帆布袋，适合作为活动兑换礼品。',
    image: giftImg,
  },
  {
    id: 5,
    name: '纪念徽章套装',
    category: '纪念礼品',
    point: 10,
    stock: 40,
    desc: '轻量型纪念礼品，适合积分较少时进行兑换。',
    image: giftImg,
  },
  {
    id: 6,
    name: '森林主题钥匙扣',
    category: '纪念礼品',
    point: 12,
    stock: 35,
    desc: '便携式纪念礼品，可用于活动参与奖励。',
    image: giftImg,
  },
])

const loadUserPoint = async () => {
  if (!username) return

  try {
    const res = await axios.get(`/api/user/info/${username}`, {
      headers: {
        Authorization: token,
      },
    })
    userPoint.value = res.data.point || 0
  } catch (err) {
    console.error(err.response?.data || err)
  }
}

const filteredGoods = computed(() => {
  return goodsList.value.filter((item) => {
    const matchKeyword = !keyword.value || item.name.includes(keyword.value)
    const matchCategory = !selectedCategory.value || item.category === selectedCategory.value
    return matchKeyword && matchCategory
  })
})

const availableCount = computed(() => {
  return goodsList.value.filter((item) => canExchange(item)).length
})

const canExchange = (item) => {
  return userPoint.value >= item.point
}

const resetFilter = () => {
  keyword.value = ''
  selectedCategory.value = ''
}

const exchangeGift = async (item) => {
  if (!canExchange(item)) {
    alert('积分不足无法兑换')
    return
  }

  if (!confirm(`确定兑换【${item.name}】吗？将消耗 ${item.point} 积分。`)) return

  try {
    const res = await axios.post('http://localhost:3000/api/user/deductPoint', {
      username: username,
      point: item.point,
    })

    if (res.data.success) {
      alert(`兑换成功：${item.name}`)
      location.reload()
    } else {
      alert(res.data.message || '兑换失败')
    }
  } catch (err) {
    console.error(err.response?.data || err)
    alert(err.response?.data?.message || '兑换失败，请检查网络')
  }
}

const goBack = () => {
  router.push('/QuestionNaire')
}

onMounted(() => {
  loadUserPoint()
})
</script>

<style scoped>
.point-shop-page {
  min-height: 100vh;
  padding: 20px;
  background: radial-gradient(circle at top, #0f172a, #05070f);
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
}

.hero-panel,
.panel,
.summary-card,
.goods-card {
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
.toolbar-btn,
.exchange-btn {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.action-btn,
.toolbar-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #0f766e, #0ea5e9);
  color: white;
}

.toolbar-btn.primary {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.exchange-btn {
  width: 100%;
  padding: 12px 14px;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
  font-weight: 700;
  margin-top: 12px;
}

.exchange-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn:hover,
.toolbar-btn:hover,
.exchange-btn:hover:not(:disabled) {
  transform: translateY(-1px);
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
  font-size: 24px;
  color: #f8fafc;
}

.summary-card.highlight {
  border-color: rgba(245, 158, 11, 0.35);
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

.panel-tip {
  font-size: 12px;
  color: #94a3b8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.16);
  padding: 4px 10px;
  border-radius: 999px;
}

.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.toolbar input,
.toolbar select {
  min-width: 220px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
  outline: none;
}

.main-grid {
  display: grid;
  grid-template-columns: 1.5fr 0.9fr;
  gap: 18px;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.goods-card {
  margin-bottom: 0;
  padding: 0;
  overflow: hidden;
}

.goods-image-wrap {
  position: relative;
}

.goods-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

.goods-category {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(15, 23, 42, 0.88);
  color: #93c5fd;
  border: 1px solid rgba(147, 197, 253, 0.25);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.goods-body {
  padding: 16px;
}

.goods-body h3 {
  margin: 0 0 10px;
  color: #f8fafc;
  font-size: 18px;
}

.goods-desc {
  color: #94a3b8;
  line-height: 1.8;
  min-height: 52px;
  margin-bottom: 12px;
}

.goods-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.meta-item {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 12px;
}

.meta-item span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 6px;
}

.meta-item strong {
  color: #e2e8f0;
  font-size: 16px;
}

.goods-status {
  margin-top: 12px;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
}

.status-tag.ok {
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.28);
}

.status-tag.not-ok {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.28);
}

.record-list {
  display: grid;
  gap: 12px;
}

.record-item {
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 14px;
}

.record-top,
.record-bottom {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.record-top {
  margin-bottom: 8px;
}

.record-top strong {
  color: #f8fafc;
}

.record-top span,
.record-bottom span {
  color: #94a3b8;
  font-size: 13px;
}

.tips-box {
  display: grid;
  gap: 10px;
  color: #cbd5e1;
  line-height: 1.8;
}

.divider {
  height: 1px;
  background: rgba(148, 163, 184, 0.14);
  margin: 20px 0;
}

.empty-box {
  color: #94a3b8;
  text-align: center;
  padding: 30px 0;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-grid,
  .goods-grid,
  .hero-panel {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}

@media (max-width: 700px) {
  .summary-grid,
  .goods-grid {
    grid-template-columns: 1fr;
  }

  .hero-left h1 {
    font-size: 24px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar input,
  .toolbar select,
  .toolbar-btn {
    width: 100%;
  }
}
</style>
