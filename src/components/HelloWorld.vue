<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <!-- 顶部 -->
    <header class="header">
      <div class="header-inner">
        <h1 class="title">森林灾害防控与公众服务系统</h1>

        <nav class="nav">
          <RouterLink to="/" class="nav-item">森林信息</RouterLink>
          <RouterLink to="/visual" class="nav-item">可视化展示</RouterLink>
          <RouterLink to="/monitor" class="nav-item">监控告警</RouterLink>
          <RouterLink to="/feedback" class="nav-item">读者信箱</RouterLink>
          <RouterLink to="/pest" class="nav-item">病虫害检测</RouterLink>
        </nav>
      </div>
    </header>

    <!-- 主体 -->
    <main class="main">
      <div class="main-inner">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 全局容器 */
.app-container {
  min-height: 100vh;
  background: #f4f6f8;
}

/* 顶部 */
.header {
  background: #2d6a4f;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.title {
  color: #fff;
  font-size: 22px;
  margin-bottom: 12px;
}

/* 导航 */
.nav {
  display: flex;
  flex-wrap: wrap; /*允许换行 */
  gap: 12px;
}

.nav-item {
  color: #e0f2e9;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 4px;
  white-space: nowrap;
}

.nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  font-weight: bold;
}

/* 主体 */
.main {
  padding: 24px 16px;
}

.main-inner {
  max-width: 1200px;
  margin: 0 auto;
}

/* 响应式小屏优化 */
@media (max-width: 600px) {
  .title {
    font-size: 18px;
  }
}
</style>
