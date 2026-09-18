import express from 'express'
import db from '../db.js'

const router = express.Router()

//获取所有树种
router.get('/visual/species', (req, res) => {
  const sql = `
    SELECT id, species_name AS name
    FROM tree_species
    ORDER BY id ASC
  `

  db.query(sql, (err, results) => {
    if (err) {
      console.error('[visual/species] 查询失败', err)
      return res.status(500).json({ message: '查询失败' })
    }

    res.json(results)
  })
})

export default router
