<template>
  <div class="mask">
    <div class="modal">
      <h2>登录 / 注册</h2>

      <!-- 账号密码 -->
      <input v-model="username" type="text" placeholder="用户名" />
      <input v-model="password" type="password" placeholder="密码" />

      <!-- 注册专用手机号和邮箱 -->
      <input v-model="phone" type="text" placeholder="手机号（注册用）" />
      <input v-model="email" type="email" placeholder="邮箱（注册用）" />

      <div class="button-group">
        <button @click="login">登录</button>
        <button @click="register">注册</button>
        <button @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits(['close', 'login-success'])

const username = ref('')
const password = ref('')
const phone = ref('')
const email = ref('')

// 正则规则
const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_]{3,15}$/ // 字母开头4-16位
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,20}$/ // 6-20位必须包含字母数字
const phonePattern = /^1[3-9]\d{9}$/ // 手机号规则
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // 简单邮箱规则

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

    console.log('登录返回数据', res.data) // 确认这里有 token

    if (res.data.code === 200 && res.data.user?.tokenes) {
      sessionStorage.removeItem('atoken')
      sessionStorage.removeItem('username')
      sessionStorage.removeItem('access')
      sessionStorage.removeItem('role')
      const { username: uname, access, role } = res.data.user
      const tokentest = res.data.user.tokenes
      console.log('返回数据', tokentest) // 确认这里有 token
      // 存 token + 用户信息到 sessionStorage
      sessionStorage.setItem('atoken', tokentest)
      sessionStorage.setItem('username', uname)
      sessionStorage.setItem('access', access)
      sessionStorage.setItem('role', role)

      // 通知父组件
      emit('login-success', { username: uname, access, role, token: tokentest })
      emit('close')
      alert('登录成功')
    } else {
      alert(res.data.msg || '登录失败')
    }
    window.location.reload()
  } catch (err) {
    console.error(err)
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
      emit('close')
    }
  } catch (err) {
    console.error(err)
    alert('接口调用失败')
  }
}
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  background: #fff;
  padding: 20px;
  width: 400px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.modal h2 {
  color: #000;
  text-align: center;
  margin-bottom: 20px;
}

input {
  width: 100%;
  margin-bottom: 10px;
  padding: 8px 10px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.button-group button {
  flex: 1;
  padding: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background-color: #2563eb;
  color: #fff;
  transition: background 0.2s;
}

.button-group button:hover {
  background-color: #1e40af;
}

.button-group button:last-child {
  background-color: #6b7280;
}

.button-group button:last-child:hover {
  background-color: #4b5563;
}
</style>
