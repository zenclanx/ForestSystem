<script setup>
defineProps({
  message: {
    type: String,
    default: '您没有权限访问此页面',
  },
})
</script>

<template>
  <div class="page">
    <h1>权限不足</h1>
    <p>{{ message }}</p>
    <router-link to="/" class="back-btn">返回首页</router-link>
  </div>
</template>

<style scoped>
.back-btn {
  display: inline-block;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #c0392b; /* 深红色按钮 */
  color: #fff;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #922b21;
}
</style>
