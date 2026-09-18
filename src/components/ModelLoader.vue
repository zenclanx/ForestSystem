<template>
  <div class="model-loader">
    <button @click="loadModel" :disabled="loading">
      {{ loading ? '模型加载中...' : '加载 3D 模型' }}
    </button>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

//emit
const emit = defineEmits(['model-loaded'])

//状态
const loading = ref(false)
const error = ref('')

//加载模型
async function loadModel() {
  loading.value = true
  error.value = ''

  const loader = new GLTFLoader()

  try {
    //根路径
    const gltf = await loader.loadAsync('/3dModel/penguin.glb')

    //只把scene抛出去
    emit('model-loaded', gltf.scene)
  } catch (err) {
    console.error(err)
    error.value = '模型加载失败，请检查 penguin.glb 是否存在'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.model-loader {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 20;
}

button {
  padding: 8px 14px;
  font-size: 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  margin-top: 6px;
  color: #ff6b6b;
  font-size: 13px;
}
</style>
