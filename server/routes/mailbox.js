import express from 'express'
import db from '../db.js'
import { verifyToken } from '../verify.js'

const router = express.Router()

// 获取留言列表
router.get('/mailbox', verifyToken, (req, res) => {
  const userAccess = req.user.access
  const username = req.user.username

  let sql = `
    SELECT id, title, status, created_at
    FROM mailbox_messages
  `
  const params = []

  // admin / researcher / teacher 可以查看全部
  if (!['admin', 'researcher', 'teacher'].includes(userAccess)) {
    sql += ' WHERE username = ?'
    params.push(username)
  }

  sql += ' ORDER BY created_at DESC'

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('查询留言失败:', err.response?.data || err)
      return res.status(500).json({ message: '查询失败' })
    }
    res.json(results)
  })
})

// 获取单条留言详情
router.get('/mailbox/:id', verifyToken, (req, res) => {
  const id = req.params.id
  const userAccess = req.user.access
  const username = req.user.username

  const sql = `
    SELECT id, title, content, contact, status, created_at, updated_at, user_role, username, answer
    FROM mailbox_messages
    WHERE id = ?
  `

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('查询留言详情失败:', err.response?.data || err)
      return res.status(500).json({ message: '查询失败' })
    }

    if (results.length === 0) {
      return res.status(404).json({ message: '留言不存在' })
    }

    const message = results[0]

    // admin / researcher / teacher 可以查看任意留言
    // 其他角色只能查看自己的留言
    if (!['admin', 'researcher', 'teacher'].includes(userAccess) && message.username !== username) {
      return res.status(403).json({ message: '权限不足' })
    }

    res.json(message)
  })
})

// 提交留言
router.post('/mailbox', verifyToken, (req, res) => {
  const { title, content, contact } = req.body
  const userRole = req.user.access || 'user'
  const username = req.user.username || 'unknown'

  if (!title || !content) {
    return res.status(400).json({ message: '标题和内容不能为空' })
  }

  const sql = `
    INSERT INTO mailbox_messages (title, content, contact, user_role, username, status, created_at)
    VALUES (?, ?, ?, ?, ?, '未处理', NOW())
  `

  db.query(sql, [title, content, contact || '', userRole, username], (err, result) => {
    if (err) {
      console.error('提交留言失败:', err.response?.data || err)
      return res.status(500).json({ message: '提交失败' })
    }
    res.json({ message: '提交成功', id: result.insertId })
  })
})

// 回复留言
router.post('/mailbox/reply', verifyToken, (req, res) => {
  const { id, reply } = req.body
  const userAccess = req.user.access

  if (!id || !reply) {
    return res.status(400).json({ message: '缺少参数' })
  }

  // 只允许 admin / researcher / teacher 回复
  if (!['admin', 'researcher', 'teacher'].includes(userAccess)) {
    return res.status(403).json({ message: '权限不足' })
  }

  const sql = `
    UPDATE mailbox_messages
    SET answer = ?, status = '已回复', updated_at = NOW()
    WHERE id = ?
  `

  db.query(sql, [reply, id], (err, result) => {
    if (err) {
      console.error('回复留言失败:', err.response?.data || err)
      return res.status(500).json({ message: '回复失败' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '留言不存在' })
    }

    res.json({ message: '回复成功' })
  })
})

export default router
