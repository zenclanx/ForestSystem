import express from 'express'
import db from '../db.js'
import { verifyToken } from '../verify.js'

const router = express.Router()

const hasMonitorManagePermission = (req, res, next) => {
  const userAccess = req.user.access

  if (!['admin', 'fireman'].includes(userAccess)) {
    return res.status(403).json({ message: '权限不足' })
  }

  next()
}

// 获取最新一条监测数据（公开）
router.get('/monitor/latest', (req, res) => {
  const sql = `
    SELECT *
    FROM forest_environment_data
    ORDER BY created_at DESC
    LIMIT 1
  `
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ message: '查询失败' })
    }
    res.json(results[0] || null)
  })
})

// 获取监测数据列表（公开）
router.get('/monitor/list', (req, res) => {
  const sql = `
    SELECT *
    FROM forest_environment_data
    ORDER BY created_at ASC
  `
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ message: '查询失败' })
    }
    res.json(results)
  })
})

// 创建新记录（仅 admin / fireman）
router.post('/monitor/create', verifyToken, hasMonitorManagePermission, (req, res) => {
  const {
    temperature,
    humidity,
    precipitation,
    wind_speed,
    wind_direction,
    sunshine_hours,
    soil_moisture,
    record_time,
  } = req.body

  const sql = `
    INSERT INTO forest_environment_data
    (temperature, humidity, precipitation, wind_speed, wind_direction, sunshine_hours, soil_moisture, record_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `
  const params = [
    temperature,
    humidity,
    precipitation,
    wind_speed,
    wind_direction,
    sunshine_hours,
    soil_moisture,
    record_time,
  ]

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ message: '创建失败' })
    }
    res.json({ message: '创建成功', id: result.insertId })
  })
})

// 更新记录（仅 admin / fireman）
router.put('/monitor/update/:id', verifyToken, hasMonitorManagePermission, (req, res) => {
  const { id } = req.params
  const {
    temperature,
    humidity,
    precipitation,
    wind_speed,
    wind_direction,
    sunshine_hours,
    soil_moisture,
    record_time,
  } = req.body

  const sql = `
    UPDATE forest_environment_data
    SET temperature=?, humidity=?, precipitation=?, wind_speed=?, wind_direction=?, sunshine_hours=?, soil_moisture=?, record_time=?
    WHERE id=?
  `
  const params = [
    temperature,
    humidity,
    precipitation,
    wind_speed,
    wind_direction,
    sunshine_hours,
    soil_moisture,
    record_time,
    id,
  ]

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ message: '更新失败' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '记录不存在' })
    }

    res.json({ message: '更新成功' })
  })
})

// 删除记录（仅 admin / fireman）
router.delete('/monitor/delete/:id', verifyToken, hasMonitorManagePermission, (req, res) => {
  const { id } = req.params
  const sql = `DELETE FROM forest_environment_data WHERE id=?`

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ message: '删除失败' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '记录不存在' })
    }

    res.json({ message: '删除成功' })
  })
})

export default router
