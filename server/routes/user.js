/* global process */
import 'dotenv/config'
import express from 'express'
import db from '../db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { verifyToken } from '../verify.js'

const SECRET = process.env.JWT_SECRET
const router = express.Router()

const hasAdminPermission = (req, res, next) => {
  const userAccess = req.user.access

  if (userAccess !== 'admin') {
    return res.status(403).json({ msg: '权限不足' })
  }

  next()
}

// 定时任务：每60秒把超过60秒没心跳的用户设为离线
setInterval(() => {
  const sql = `
    UPDATE user
    SET statu = '离线'
    WHERE TIMESTAMPDIFF(SECOND, last_active, NOW()) >= 60
  `
  db.query(sql, (err) => {
    if (err) {
      console.error('更新离线状态失败:', err.response?.data || err)
    }
  })
}, 60000)

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body

  db.query('SELECT * FROM user WHERE username=?', [username], (err, results) => {
    if (err) return res.status(500).send({ code: 500, msg: '数据库错误' })
    if (results.length === 0) return res.send({ code: 401, msg: '用户不存在' })

    bcrypt.compare(password, results[0].password, (err, match) => {
      if (err) return res.status(500).send({ code: 500, msg: '密码校验失败' })
      if (!match) return res.send({ code: 401, msg: '密码错误' })

      const user = results[0]

      db.query('UPDATE user SET last_active = NOW(), statu="在线中" WHERE username=?', [username])

      const tokenes = jwt.sign(
        {
          id: user.id,
          username: user.username,
          access: user.access,
          role: user.role,
        },
        SECRET,
        { expiresIn: '2h' },
      )

      res.send({
        code: 200,
        msg: '登录成功',
        user: {
          id: user.id,
          username: user.username,
          access: user.access,
          role: user.role,
          phone: user.phone || null,
          email: user.email || null,
          point: user.point || 0,
          tokenes,
        },
      })
    })
  })
})

// 注册
router.post('/register', (req, res) => {
  const { username, password, phone, email } = req.body
  if (!username || !password) {
    return res.send({ code: 400, msg: '用户名和密码不能为空' })
  }

  db.query('SELECT id FROM user WHERE username=?', [username], (err, results) => {
    if (err) return res.status(500).send({ code: 500, msg: '数据库错误' })
    if (results.length > 0) return res.send({ code: 409, msg: '用户名已存在' })

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).send({ code: 500, msg: '加密失败' })

      db.query(
        'INSERT INTO user (username, password, role, phone, email, point, last_active, statu) VALUES (?, ?, ?, ?, ?, 0, NOW(), "离线")',
        [username, hashedPassword, 'user', phone || null, email || null],
        (err) => {
          if (err) return res.status(500).send({ code: 500, msg: '注册失败' })
          res.send({ code: 200, msg: '注册成功' })
        },
      )
    })
  })
})

// 心跳接口
router.post('/user/heartbeat', verifyToken, (req, res) => {
  const username = req.user.username

  db.query(
    'UPDATE user SET last_active = NOW(), statu="在线中" WHERE username=?',
    [username],
    (err) => {
      if (err) {
        console.error(err.response?.data || err)
        return res.status(500).json({ msg: '心跳失败' })
      }
      res.json({ msg: 'ok' })
    },
  )
})

// 获取单个用户信息
router.get('/user/info/:username', verifyToken, (req, res) => {
  const { username } = req.params
  const loginUser = req.user.username
  const userAccess = req.user.access

  if (userAccess !== 'admin' && username !== loginUser) {
    return res.status(403).json({ msg: '权限不足' })
  }

  db.query(
    'SELECT id, username, point, phone, email, access, statu FROM user WHERE username=?',
    [username],
    (err, results) => {
      if (err) {
        console.error(err.response?.data || err)
        return res.status(500).json({ msg: '数据库错误' })
      }
      if (!results.length) return res.status(404).json({ msg: '用户不存在' })
      res.json(results[0])
    },
  )
})

// 获取所有用户（仅 admin）
router.get('/users', verifyToken, hasAdminPermission, (req, res) => {
  db.query(
    'SELECT id, username, phone, email, point, access, statu, last_active FROM user ORDER BY id ASC',
    (err, results) => {
      if (err) {
        console.error(err.response?.data || err)
        return res.status(500).json({ msg: '获取用户列表失败' })
      }
      res.json(results)
    },
  )
})

// 用户主动下线
router.post('/user/offline', verifyToken, (req, res) => {
  const username = req.user.username

  db.query(
    'UPDATE user SET statu="离线", last_active = NOW() WHERE username=?',
    [username],
    (err) => {
      if (err) {
        console.error(err.response?.data || err)
        return res.status(500).json({ msg: '下线失败' })
      }
      res.json({ msg: '用户已下线' })
    },
  )
})

// 重置密码
router.post('/reset-password', (req, res) => {
  const { username, newPassword, verifyCode } = req.body

  if (!username || !newPassword) {
    return res.send({ code: 400, msg: '用户名和新密码不能为空' })
  }

  db.query('SELECT * FROM user WHERE username=?', [username], (err, results) => {
    if (err) return res.status(500).send({ code: 500, msg: '数据库错误' })
    if (results.length === 0) return res.send({ code: 404, msg: '用户不存在' })

    const user = results[0]

    // 如果前端传了 verifyCode，校验预留手机号
    if (verifyCode) {
      const phone = user.phone || ''
      if (phone !== verifyCode) {
        return res.send({ code: 403, msg: '身份验证失败，手机号后不匹配' })
      }
    }

    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) return res.status(500).send({ code: 500, msg: '密码加密失败' })

      db.query(
        'UPDATE user SET password=? WHERE username=?',
        [hashedPassword, username],
        (err, result) => {
          if (err) return res.status(500).send({ code: 500, msg: '密码重置失败' })
          if (result.affectedRows === 0) return res.send({ code: 500, msg: '重置失败' })

          res.send({ code: 200, msg: '密码重置成功' })
        },
      )
    })
  })
})
// 更新用户信息（仅 admin）
router.put('/users/:id', verifyToken, hasAdminPermission, (req, res) => {
  const { id } = req.params
  const { phone, email, point, access } = req.body

  db.query(
    'UPDATE user SET phone=?, email=?, point=?, access=? WHERE id=?',
    [phone || null, email || null, point || 0, access || 'user', id],
    (err, result) => {
      if (err) {
        console.error(err.response?.data || err)
        return res.status(500).json({ msg: '更新用户失败' })
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ msg: '用户不存在' })
      }

      res.json({ msg: '用户更新成功' })
    },
  )
})

// 删除用户（仅 admin）
router.delete('/users/:id', verifyToken, hasAdminPermission, (req, res) => {
  const { id } = req.params

  db.query('DELETE FROM user WHERE id=?', [id], (err, result) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ msg: '删除用户失败' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: '用户不存在' })
    }

    res.json({ msg: '删除成功' })
  })
})

// 增加积分（仅 admin）
router.post('/user/addPoint', verifyToken, hasAdminPermission, (req, res) => {
  const { username, point } = req.body

  if (!username || point === undefined) {
    return res.status(400).json({ msg: '参数错误' })
  }

  db.query(
    'UPDATE user SET point = point + ? WHERE username=?',
    [point, username],
    (err, result) => {
      if (err) {
        console.error(err.response?.data || err)
        return res.status(500).json({ msg: '积分更新失败' })
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ msg: '用户不存在' })
      }

      res.json({ msg: '积分增加成功' })
    },
  )
})

// 扣除积分
router.post('/user/deductPoint', verifyToken, (req, res) => {
  const { username, point } = req.body

  if (!username || point === undefined) {
    return res.status(400).json({ msg: '参数错误' })
  }

  db.query(
    'UPDATE user SET point = point - ? WHERE username=? AND point >= ?',
    [point, username, point],
    (err, result) => {
      if (err) {
        console.error(err.response?.data || err)
        return res.status(500).json({ msg: '数据库错误' })
      }
      if (result.affectedRows === 0) {
        return res.status(400).json({ msg: '积分不足或用户不存在' })
      }
      res.json({ msg: '积分扣除成功', success: true })
    },
  )
})

export default router
