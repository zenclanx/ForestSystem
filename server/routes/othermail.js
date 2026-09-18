import express from 'express'
import db from '../db.js'
import { verifyToken } from '../verify.js'

const router = express.Router()

const hasMailManagePermission = (req, res, next) => {
  const userAccess = req.user.access

  if (!['admin', 'researcher'].includes(userAccess)) {
    return res.status(403).json({ msg: '权限不足' })
  }

  next()
}

// 添加邮箱（仅 admin / researcher）
router.post('/othermail/add', verifyToken, hasMailManagePermission, (req, res) => {
  const { name, mail } = req.body

  if (!name || !mail) {
    return res.status(400).send({ code: 400, msg: 'name 和 mail 不能为空' })
  }

  const checkSql = 'SELECT id FROM user_mail WHERE mail = ?'
  db.query(checkSql, [mail], (err, results) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).send({ code: 500, msg: '数据库错误' })
    }

    if (results.length > 0) {
      return res.send({ code: 409, msg: '邮箱已存在' })
    }

    const insertSql = 'INSERT INTO user_mail (name, mail) VALUES (?, ?)'
    db.query(insertSql, [name, mail], (err) => {
      if (err) {
        console.error(err.response?.data || err)
        return res.status(500).send({ code: 500, msg: '添加失败' })
      }
      res.send({ code: 200, msg: '添加成功' })
    })
  })
})

// 获取所有邮箱（已登录可查看）
router.get('/othermail/list', verifyToken, (req, res) => {
  const sql = 'SELECT id, name, mail FROM user_mail ORDER BY id DESC'
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ msg: '获取失败' })
    }
    res.json(results)
  })
})

// 根据邮箱查询（已登录可查看）
router.get('/othermail/find/:mail', verifyToken, (req, res) => {
  const mail = req.params.mail
  const sql = 'SELECT id, name, mail FROM user_mail WHERE mail=?'

  db.query(sql, [mail], (err, results) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ msg: '数据库错误' })
    }
    if (!results.length) return res.send({ code: 404, msg: '不存在' })
    res.json(results[0])
  })
})

// 根据邮箱更新 name（仅 admin / researcher）
router.put('/othermail/update', verifyToken, hasMailManagePermission, (req, res) => {
  const { name, mail } = req.body

  if (!mail) {
    return res.status(400).send({ code: 400, msg: 'mail 不能为空' })
  }

  const sql = 'UPDATE user_mail SET name=? WHERE mail=?'
  db.query(sql, [name || null, mail], (err, result) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ msg: '更新失败' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, msg: '邮箱不存在' })
    }

    res.json({ code: 200, msg: '更新成功' })
  })
})

// 删除邮箱（仅 admin / researcher）
router.delete('/othermail/delete/:mail', verifyToken, hasMailManagePermission, (req, res) => {
  const { mail } = req.params
  const sql = 'DELETE FROM user_mail WHERE mail=?'

  db.query(sql, [mail], (err, result) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ msg: '删除失败' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, msg: '邮箱不存在' })
    }

    res.json({ code: 200, msg: '删除成功' })
  })
})

export default router
