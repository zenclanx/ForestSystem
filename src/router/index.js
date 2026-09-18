import { createRouter, createWebHistory } from 'vue-router'

// 页面组件
import HomeInfo from '../views/HomeInfo.vue'
import ForestInfo from '../views/ForestInfo.vue'
import VisualModule from '../views/VisualModule.vue'
import Monitor from '../views/MonitorModule.vue'
import MailBox from '../views/MailBox.vue'
import MessageProcess from '../components/MessagesProcess.vue'
import MessagesWatch from '../components/MessagesWatch.vue'
import Disease from '../views/DiseaseInfo.vue'
import EnvironmentRecord from '../components/EnvironmentRecord.vue'
import DisasterSimulation from '../components/DisasterSimulation.vue'
import QuestionNaire from '../components/QuestionNaire.vue'
import CreateQuest from '../components/CreateQuest.vue'
import UpdateInfo from '../components/UpdateInfo.vue'
import PestProcess from '../components/PestProcess.vue'
import UserAdmin from '../components/UserAdmin.vue'
import SendMail from '../components/SendMail.vue'
import PointShop from '../components/PointShop.vue'

// 用户版页面
import UserHomeInfo from '../components/UserHomeInfo.vue'
import UserForestInfo from '../components/UserForestInfo.vue'

// 权限归并
const normalizeAccess = (access) => {
  const accessMap = {
    admin: 'admin',
    researcher: 'researcher',
    teacher: 'researcher',
    fireman: 'fireman',
    forestguard: 'fireman',
    user: 'user',
    guest: 'guest',
  }

  return accessMap[access] || 'guest'
}

// 路由表
const routes = [
  // 未匹配路径重定向
  { path: '/:catchAll(.*)', redirect: '/' },

  // 业务版首页

  {
    path: '/',
    name: 'home',
    component: HomeInfo,
    meta: { requiredAccess: ['admin', 'researcher', 'fireman'] },
  },

  // 用户版页面

  {
    path: '/user-home',
    name: 'user-home',
    component: UserHomeInfo,
    meta: { requiredAccess: ['user'] },
  },
  {
    path: '/user-forest',
    name: 'user-forest',
    component: UserForestInfo,
    meta: { requiredAccess: ['user'] },
  },

  // 原有页面

  {
    path: '/info',
    name: 'info',
    component: ForestInfo,
    meta: { requiredAccess: ['admin', 'researcher', 'fireman'] },
  },
  {
    path: '/visual',
    name: 'visual',
    component: VisualModule,
    meta: { requiredAccess: ['admin', 'researcher', 'user'] },
  },
  {
    path: '/monitor',
    name: 'monitor',
    component: Monitor,
    meta: { requiredAccess: ['admin', 'fireman'] },
  },
  {
    path: '/mailbox',
    name: 'mailbox',
    component: MailBox,
    meta: { requiredAccess: ['admin', 'user', 'researcher', 'fireman'] },
  },
  {
    path: '/message/:id',
    name: 'message-process',
    component: MessageProcess,
    meta: { requiredAccess: ['admin', 'user', 'researcher', 'fireman'] },
  },
  {
    path: '/message-watch/:id',
    name: 'message-watch',
    component: MessagesWatch,
    meta: { requiredAccess: ['admin', 'user', 'researcher', 'fireman'] },
  },
  {
    path: '/disease',
    name: 'disease',
    component: Disease,
    meta: { requiredAccess: ['admin', 'fireman', 'user'] },
  },
  {
    path: '/environment-record',
    name: 'environment-record',
    component: EnvironmentRecord,
    meta: { requiredAccess: ['admin', 'fireman'] },
  },
  {
    path: '/QuestionNaire',
    name: 'QuestionNaire',
    component: QuestionNaire,
    meta: { requiredAccess: ['admin', 'researcher', 'user'] },
  },
  {
    path: '/Disaster-Simulation',
    name: 'Disaster-Simulation',
    component: DisasterSimulation,
    meta: { requiredAccess: ['admin', 'fireman'] },
  },
  {
    path: '/CreateQuest',
    name: 'CreateQuest',
    component: CreateQuest,
    meta: { requiredAccess: ['admin', 'researcher'] },
  },
  {
    path: '/UpdateInfo',
    name: 'UpdateInfo',
    component: UpdateInfo,
    meta: { requiredAccess: ['admin', 'researcher'] },
  },
  {
    path: '/PestProcess',
    name: 'PestProcess',
    component: PestProcess,
    meta: { requiredAccess: ['admin', 'fireman'] },
  },
  {
    path: '/UserAdmin',
    name: 'UserAdmin',
    component: UserAdmin,
    meta: { requiredAccess: ['admin'] },
  },
  {
    path: '/SendMail',
    name: 'SendMail',
    component: SendMail,
    meta: { requiredAccess: ['admin', 'fireman'] },
  },
  {
    path: '/PointShop',
    name: 'PointShop',
    component: PointShop,
    meta: { requiredAccess: ['admin', 'user', 'researcher'] },
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const rawAccess = sessionStorage.getItem('access') || 'guest'
  const userAccess = normalizeAccess(rawAccess)

  // 未登录或游客：允许进入根路径，其余统一回首页
  if (userAccess === 'guest') {
    if (to.path === '/') {
      return next()
    }
    return next('/')
  }

  // 普通用户访问业务首页时，自动去用户首页
  if (userAccess === 'user' && to.path === '/') {
    return next('/user-home')
  }

  // 非普通用户访问用户端页面时，回业务首页
  if (userAccess !== 'user' && (to.path === '/user-home' || to.path === '/user-forest')) {
    return next('/')
  }

  // 通用权限校验：不进无权限页，直接回各自首页
  if (to.meta.requiredAccess && !to.meta.requiredAccess.includes(userAccess)) {
    if (userAccess === 'user') {
      return next('/user-home')
    }
    return next('/')
  }

  next()
})

export default router
