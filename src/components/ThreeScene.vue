<template>
  <div ref="sceneContainer" class="scene-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, defineExpose } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import axios from 'axios'

const sceneContainer = ref(null)

let scene = null
let camera = null
let renderer = null
let controls = null
let currentModel = null
let lastSpecies = null
let animationId = null

const loader = new GLTFLoader()

const defaultCameraPosition = new THREE.Vector3(10, 5, 10)
const defaultTarget = new THREE.Vector3(0, 0, 0)

const handleContextMenu = (e) => {
  e.preventDefault()
}

function initScene() {
  if (!sceneContainer.value) return

  scene = new THREE.Scene()
  scene.background = null

  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
  camera.position.copy(defaultCameraPosition)

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

  const { clientWidth: w, clientHeight: h } = sceneContainer.value
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  sceneContainer.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = true
  controls.autoRotate = false
  controls.autoRotateSpeed = 2.0
  controls.target.copy(defaultTarget)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(5, 10, 5)
  scene.add(directionalLight)

  renderer.domElement.addEventListener('contextmenu', handleContextMenu)

  animate()
}

function animate() {
  if (!renderer || !scene || !camera) return

  animationId = requestAnimationFrame(animate)

  if (controls) controls.update()
  renderer.render(scene, camera)
}

function onParentResize() {
  nextTick(() => {
    if (!renderer || !camera || !sceneContainer.value) return
    const { clientWidth: w, clientHeight: h } = sceneContainer.value
    if (!w || !h) return
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  })
}

async function loadModel(speciesName) {
  lastSpecies = speciesName

  try {
    const res = await axios.get('/api/models/bySpecies', {
      params: { species_name: speciesName },
    })

    const modelData = res.data
    if (!modelData || !modelData.model_path) return

    const gltf = await loader.loadAsync(modelData.model_path)

    if (lastSpecies !== speciesName) {
      disposeModel(gltf.scene)
      return
    }

    if (currentModel) {
      scene.remove(currentModel)
      disposeModel(currentModel)
      currentModel = null
    }

    const scale = modelData.scale || 0.5
    const posY = modelData.position_y || -1

    gltf.scene.scale.set(scale, scale, scale)
    gltf.scene.position.y = posY

    scene.add(gltf.scene)
    currentModel = gltf.scene

    resetView()
  } catch (err) {
    console.error('[ThreeScene] 加载模型失败', err)
  }
}

function resetView() {
  if (!camera || !controls) return
  camera.position.copy(defaultCameraPosition)
  controls.target.copy(defaultTarget)
  controls.update()
}

function setAutoRotate(value) {
  if (controls) {
    controls.autoRotate = !!value
  }
}

function setWireframe(value) {
  if (!currentModel) return

  currentModel.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => {
          m.wireframe = !!value
        })
      } else {
        child.material.wireframe = !!value
      }
    }
  })
}

function disposeModel(obj) {
  if (!obj) return

  obj.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) cleanMaterial(child.material)
    }
  })
}

function cleanMaterial(material) {
  if (!material) return

  if (Array.isArray(material)) {
    material.forEach(cleanMaterial)
    return
  }

  const mapKeys = [
    'map',
    'lightMap',
    'bumpMap',
    'normalMap',
    'specularMap',
    'roughnessMap',
    'metalnessMap',
    'aoMap',
    'emissiveMap',
    'alphaMap',
    'envMap',
  ]

  mapKeys.forEach((key) => {
    if (material[key]) {
      material[key].dispose()
    }
  })

  material.dispose?.()
}

onMounted(() => {
  initScene()
  window.addEventListener('resize', onParentResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onParentResize)

  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('contextmenu', handleContextMenu)
  }

  if (controls) {
    controls.dispose()
    controls = null
  }

  if (currentModel) {
    scene?.remove(currentModel)
    disposeModel(currentModel)
    currentModel = null
  }

  if (scene) {
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose?.()
      if (obj.material) cleanMaterial(obj.material)
    })
    scene.clear()
    scene = null
  }

  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss?.()

    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }

    renderer.domElement = null
    renderer = null
  }

  camera = null
  lastSpecies = null
})

defineExpose({
  loadModel,
  onParentResize,
  resetView,
  setAutoRotate,
  setWireframe,
})
</script>

<style scoped>
.scene-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}
</style>
