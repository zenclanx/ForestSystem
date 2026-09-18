import express from 'express'
import db from '../db.js'

const router = express.Router()

//获取所有树种模型
router.get('/models/all', (req, res) => {
  const sql = `SELECT * FROM tree_models ORDER BY created_at ASC`
  db.query(sql, (err, results) => {
    if (err) {
      console.error('[modelsLoad] 查询所有模型失败', err)
      return res.status(500).json({ message: '查询失败' })
    }
    res.json(results)
  })
})

//按树种名称获取模
router.get('/models/bySpecies', (req, res) => {
  const { species_name } = req.query
  if (!species_name) {
    return res.status(400).json({ message: '缺少 species_name 参数' })
  }

  const sql = `SELECT * FROM tree_models WHERE species_name=?`
  db.query(sql, [species_name], (err, results) => {
    if (err) {
      console.error('[modelsLoad] 按树种查询模型失败', err)
      return res.status(500).json({ message: '查询失败' })
    }
    if (results.length === 0) {
      return res.status(404).json({ message: '未找到该树种模型' })
    }
    res.json(results[0])
  })
})

export default router
