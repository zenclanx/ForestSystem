<template>
  <div
    class="floating-window"
    ref="windowRef"
    @mousedown="startDrag"
    :style="{ top: top + 'px', left: left + 'px' }"
  >
    <!-- 窗口头部 -->
    <div class="header">
      <span>{{ treeData?.species_name || 'AI助手' }}</span>
      <button @click="$emit('close')">✖</button>
    </div>

    <!-- 窗口内容 -->
    <div class="content">
      <p v-if="loading">AI 正在思考...</p>
      <p v-else>{{ aiAnswer }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  treeData: Object,
})

const windowRef = ref(null)
const top = ref(100)
const left = ref(100)
let offsetX = 0
let offsetY = 0
let isDragging = false

// 拖动逻辑
function startDrag(e) {
  if (!e.target.classList.contains('header')) return
  isDragging = true
  offsetX = e.clientX - left.value
  offsetY = e.clientY - top.value
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!isDragging) return
  left.value = Math.max(
    0,
    Math.min(e.clientX - offsetX, window.innerWidth - windowRef.value.offsetWidth),
  )
  top.value = Math.max(
    0,
    Math.min(e.clientY - offsetY, window.innerHeight - windowRef.value.offsetHeight),
  )
}

function stopDrag() {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// AI 回答
const aiAnswer = ref('')
const loading = ref(false)

// watch(
//   () => props.treeData,
//   (newTree) => {
//     // 先关闭之前的 EventSource
//     if (window.aiEventSource) {
//       window.aiEventSource.close()
//       window.aiEventSource = null
//     }

//     if (!newTree?.species_name) {
//       aiAnswer.value = ''
//       loading.value = false
//       return
//     }

//     aiAnswer.value = ''
//     loading.value = true

//     const queryStr = encodeURIComponent(`请介绍一下树种 ${newTree.species_name}。`)
//     const es = new EventSource(`http://localhost:3000/api/aianswer-stream?query=${queryStr}`)
//     window.aiEventSource = es // 保存引用，方便下次关闭

//     es.onmessage = (e) => {
//       if (e.data === '[DONE]') {
//         loading.value = false
//         es.close()
//         window.aiEventSource = null
//       } else if (e.data === '[ERROR]') {
//         aiAnswer.value += '\n[AI 请求失败]'
//         loading.value = false
//         es.close()
//         window.aiEventSource = null
//       } else {
//         aiAnswer.value += e.data
//       }
//     }

//     es.onerror = () => {
//       loading.value = false
//       es.close()
//       window.aiEventSource = null
//     }

//     es.onopen = () => {
//       console.log('AI 流式传输开始')
//     }
//   },
//   { immediate: true },
// )
//当 treeData 改变时调用 AI
watch(
  () => props.treeData,
  async (newTree) => {
    if (!newTree?.species_name) {
      aiAnswer.value = ''
      return
    }
    loading.value = true
    try {
      const res = await axios.post('http://localhost:3000/api/aianswer', {
        query: `请介绍一下树种 ${newTree.species_name}。`,
      })
      aiAnswer.value = res.data.answer || 'AI 未返回内容'
    } catch (err) {
      aiAnswer.value = 'AI 请求失败'
      console.error(err)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.floating-window {
  position: fixed;
  width: 320px;
  max-height: 400px;
  background: rgba(20, 30, 60, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  border: 1px solid rgba(0, 212, 255, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  cursor: default;
  user-select: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.floating-window .header {
  height: 36px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 212, 255, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  cursor: move;
  font-weight: bold;
  color: #00d4ff;
}

.floating-window .header span {
  background: linear-gradient(90deg, #00d4ff, #00ffa6);
  background-clip: text;
  color: transparent;
}

.floating-window .header button {
  background: none;
  border: none;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
}

.floating-window .content {
  padding: 10px;
  overflow-y: auto;
  flex: 1;
  color: #e5e7eb;
  font-size: 14px;
  line-height: 1.5;
}
</style>
