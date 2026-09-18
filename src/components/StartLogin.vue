<template>
  <div class="start-login-page">
    <div class="overlay">
      <div class="login-wrapper">
        <!-- 左侧系统介绍 -->
        <div class="intro-panel">
          <h1>森林灾害防控与公众服务系统</h1>
          <p class="subtitle">Forest Disaster Prevention & Public Service System</p>

          <div class="intro-card">
            <h3>系统功能</h3>
            <ul>
              <li>森林基础信息展示</li>
              <li>环境监测与预警</li>
              <li>病虫害检测与处理</li>
              <li>读者信箱与公众服务</li>
              <li>多角色用户权限管理</li>
            </ul>
          </div>
        </div>

        <!-- 右侧登录注册找回 -->
        <div class="form-panel">
          <div class="tabs">
            <button :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</button>
            <button :class="{ active: mode === 'register' }" @click="mode = 'register'">
              注册
            </button>
            <button v-if="mode === 'forgot'" class="active">找回密码</button>
          </div>

          <h2>
            {{ mode === 'login' ? '欢迎登录' : mode === 'register' ? '创建账号' : '重置密码' }}
          </h2>
          <p class="desc">
            {{
              mode === 'login'
                ? '请输入账号信息进入系统'
                : mode === 'register'
                  ? '请填写信息完成注册'
                  : '验证身份后设置新密码'
            }}
          </p>

          <div class="form">
            <input v-model="username" type="text" placeholder="请输入用户名" />

            <input
              v-if="mode !== 'forgot'"
              v-model="password"
              type="password"
              :placeholder="mode === 'login' ? '请输入密码' : '请设置密码'"
            />

            <template v-if="mode === 'forgot'">
              <input v-model="newPassword" type="password" placeholder="请输入新密码" />
              <input v-model="confirmPassword" type="password" placeholder="请再次确认新密码" />
              <input v-model="verifyCode" type="text" placeholder="请输入预留手机号" />
            </template>

            <template v-if="mode === 'register'">
              <input v-model="phone" type="text" placeholder="请输入手机号" />
              <input v-model="email" type="email" placeholder="请输入邮箱" />
            </template>

            <button class="submit-btn" @click="handleSubmit">
              {{ mode === 'login' ? '立即登录' : mode === 'register' ? '立即注册' : '确认重置' }}
            </button>
          </div>

          <p class="forgot-text" v-if="mode === 'login'">
            <a href="javascript:void(0)" @click="mode = 'forgot'">忘记密码？</a>
          </p>

          <p class="switch-text">
            <span v-if="mode === 'login'">
              还没有账号？
              <a href="javascript:void(0)" @click="mode = 'register'">去注册</a>
            </span>
            <span v-else-if="mode === 'register'">
              已有账号？
              <a href="javascript:void(0)" @click="mode = 'login'">去登录</a>
            </span>
            <span v-else>
              想起密码了？
              <a href="javascript:void(0)" @click="mode = 'login'">去登录</a>
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits(['login-success'])

const mode = ref('login')

const username = ref('')
const password = ref('')
const phone = ref('')
const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const verifyCode = ref('')

// 正则规则
const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_]{3,15}$/
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,20}$/
const phonePattern = /^1[3-9]\d{9}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateForRegister = () => {
  if (!usernamePattern.test(username.value)) {
    alert('用户名格式不正确：字母开头，4-16位，允许字母、数字、下划线')
    return false
  }
  if (!passwordPattern.test(password.value)) {
    alert('密码格式不正确：6-20位，必须包含字母和数字')
    return false
  }
  if (phone.value && !phonePattern.test(phone.value)) {
    alert('手机号格式不正确')
    return false
  }
  if (email.value && !emailPattern.test(email.value)) {
    alert('邮箱格式不正确')
    return false
  }
  return true
}

const handleSubmit = () => {
  if (mode.value === 'login') return login()
  if (mode.value === 'register') return register()
  return resetPassword()
}

// 登录
const login = async () => {
  if (!username.value || !password.value) {
    alert('请填写用户名和密码')
    return
  }

  try {
    const res = await axios.post('/api/login', {
      username: username.value,
      password: password.value,
    })

    console.log('登录返回数据', res.data)

    if (res.data.code === 200 && res.data.user?.tokenes) {
      sessionStorage.removeItem('atoken')
      sessionStorage.removeItem('username')
      sessionStorage.removeItem('access')
      sessionStorage.removeItem('role')

      const { username: uname, access, role } = res.data.user
      const tokentest = res.data.user.tokenes

      console.log('返回 token', tokentest)

      sessionStorage.setItem('atoken', tokentest)
      sessionStorage.setItem('username', uname)
      sessionStorage.setItem('access', access)
      sessionStorage.setItem('role', role)

      emit('login-success', {
        username: uname,
        access,
        role,
        token: tokentest,
      })

      alert('登录成功')
    } else {
      alert(res.data.msg || '登录失败')
    }
  } catch (err) {
    console.error(err.response?.data || err)
    alert('接口调用失败')
  }
}

// 注册
const register = async () => {
  if (!username.value || !password.value) {
    alert('请填写用户名和密码')
    return
  }

  if (!validateForRegister()) return

  try {
    const res = await axios.post('http://localhost:3000/api/register', {
      username: username.value,
      password: password.value,
      phone: phone.value || null,
      email: email.value || null,
    })

    alert(res.data.msg)

    if (res.data.code === 200) {
      mode.value = 'login'
      phone.value = ''
      email.value = ''
    }
  } catch (err) {
    console.error(err.response?.data || err)
    alert('接口调用失败')
  }
}

// 找回密码
const resetPassword = async () => {
  if (!username.value) {
    alert('请填写用户名')
    return
  }
  if (!newPassword.value || !confirmPassword.value) {
    alert('请填写新密码并确认')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    alert('两次输入的密码不一致')
    return
  }
  if (!passwordPattern.test(newPassword.value)) {
    alert('新密码格式不正确：6-20位，必须包含字母和数字')
    return
  }

  try {
    const res = await axios.post('/api/reset-password', {
      username: username.value,
      newPassword: newPassword.value,
      verifyCode: verifyCode.value || null,
    })

    alert(res.data.msg || '重置成功')

    if (res.data.code === 200) {
      mode.value = 'login'
      password.value = newPassword.value
      newPassword.value = ''
      confirmPassword.value = ''
      verifyCode.value = ''
    }
  } catch (err) {
    console.error(err.response?.data || err)
    alert('接口调用失败')
  }
}
</script>

<style scoped>
.start-login-page {
  width: 100vw;
  height: 100vh;
  background:
    linear-gradient(rgba(12, 45, 32, 0.65), rgba(12, 45, 32, 0.65)),
    url('../src/assets/picture/photo.avif') center center / cover no-repeat;
  overflow: hidden;
}

.overlay {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  box-sizing: border-box;
}

.login-wrapper {
  width: 1100px;
  max-width: 100%;
  min-height: 620px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.intro-panel {
  flex: 1.1;
  color: #fff;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(135deg, rgba(19, 78, 94, 0.45), rgba(34, 197, 94, 0.2));
}

.intro-panel h1 {
  font-size: 36px;
  line-height: 1.4;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 30px;
}

.intro-card {
  background: rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  padding: 24px 28px;
}

.intro-card h3 {
  margin-bottom: 16px;
  font-size: 22px;
}

.intro-card ul {
  padding-left: 20px;
  line-height: 2;
  font-size: 15px;
}

.form-panel {
  flex: 0.9;
  background: rgba(255, 255, 255, 0.95);
  padding: 50px 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.tabs button {
  flex: 1;
  border: none;
  padding: 12px 0;
  border-radius: 12px;
  background: #e5e7eb;
  color: #374151;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tabs button.active {
  background: linear-gradient(135deg, #16a34a, #0f766e);
  color: #fff;
}

.form-panel h2 {
  font-size: 30px;
  color: #111827;
  margin-bottom: 10px;
}

.desc {
  color: #6b7280;
  margin-bottom: 24px;
  font-size: 14px;
}

.form {
  display: flex;
  flex-direction: column;
}

.form input {
  width: 100%;
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.form input:focus {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
}

.submit-btn {
  margin-top: 8px;
  border: none;
  padding: 14px 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #16a34a, #0f766e);
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  opacity: 0.95;
}

.forgot-text {
  text-align: right;
  margin-top: -6px;
  margin-bottom: 12px;
  font-size: 13px;
}

.forgot-text a {
  color: #0f766e;
  text-decoration: none;
}

.forgot-text a:hover {
  text-decoration: underline;
}

.switch-text {
  margin-top: 18px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.switch-text a {
  color: #0f766e;
  text-decoration: none;
  font-weight: bold;
}

.switch-text a:hover {
  text-decoration: underline;
}

@media (max-width: 900px) {
  .login-wrapper {
    flex-direction: column;
    min-height: auto;
  }

  .intro-panel,
  .form-panel {
    width: 100%;
  }

  .intro-panel {
    padding: 36px 28px;
  }

  .form-panel {
    padding: 36px 28px;
  }

  .intro-panel h1 {
    font-size: 28px;
  }
}
</style>
