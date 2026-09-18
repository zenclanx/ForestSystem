import express from 'express'
import db from '../db.js'
import { verifyToken } from '../verify.js'

const router = express.Router()

const hasPestManagePermission = (req, res, next) => {
  const userAccess = req.user.access

  if (!['admin', 'fireman'].includes(userAccess)) {
    return res.status(403).json({ message: '权限不足' })
  }

  next()
}

// 获取害虫记录（公开）
router.get('/pestfind', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 5
  const status = req.query.status || ''

  const offset = (page - 1) * pageSize

  let sql = 'SELECT * FROM pestfind'
  const params = []

  if (status) {
    sql += ' WHERE status = ?'
    params.push(status)
  }

  sql += ' ORDER BY detect_time DESC LIMIT ?, ?'
  params.push(offset, pageSize)

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('查询失败:', err.response?.data || err)
      return res.status(500).json({ message: '查询失败' })
    }

    let countSql = 'SELECT COUNT(*) AS total FROM pestfind'
    const countParams = []

    if (status) {
      countSql += ' WHERE status = ?'
      countParams.push(status)
    }

    db.query(countSql, countParams, (err2, countRes) => {
      if (err2) {
        console.error('查询总数失败:', err2.response?.data || err2)
        return res.status(500).json({ message: '查询总数失败' })
      }

      res.json({
        data: results,
        total: countRes[0].total,
        page,
        pageSize,
      })
    })
  })
})

// 新增害虫记录（仅 admin / fireman）
router.post('/pestfind', verifyToken, hasPestManagePermission, (req, res) => {
  const { pest_name, detected_at, treatment_plan, status } = req.body

  if (!pest_name || !detected_at) {
    return res.status(400).json({ message: '害虫名称和检测时间不能为空' })
  }

  const sql = 'INSERT INTO pestfind (pest_name, detect_time, solution, status) VALUES (?, ?, ?, ?)'

  db.query(
    sql,
    [pest_name, detected_at, treatment_plan || '', status || 'pending'],
    (err, result) => {
      if (err) {
        console.error('写入害虫记录失败:', err.response?.data || err)
        return res.status(500).json({ message: '写入失败' })
      }
      res.json({ message: '写入成功', id: result.insertId })
    },
  )
})

// 更新防治方案（仅 admin / fireman）
router.put('/pestfind/:id/solution', verifyToken, hasPestManagePermission, (req, res) => {
  const { id } = req.params
  const { solution } = req.body

  if (!solution || solution.trim() === '') {
    return res.status(400).json({ message: '方案不能为空' })
  }

  const sql = 'UPDATE pestfind SET solution = ?, status = "processed" WHERE id = ?'
  db.query(sql, [solution, id], (err, result) => {
    if (err) {
      console.error('更新方案失败:', err.response?.data || err)
      return res.status(500).json({ message: '更新失败' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ID不存在' })
    }

    res.json({ message: '更新成功' })
  })
})

// 获取未处理害虫数量（公开）
router.get('/pestfind/pending-count', (req, res) => {
  const sql = 'SELECT COUNT(*) AS count FROM pestfind WHERE status="pending"'
  db.query(sql, (err, result) => {
    if (err) {
      console.error('查询未处理数量失败:', err.response?.data || err)
      return res.status(500).json({ message: '查询失败' })
    }
    res.json({ count: result[0].count })
  })
})

export default router
