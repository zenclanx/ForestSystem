import express from 'express'
import db from '../db.js'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { verifyToken } from '../verify.js'

const router = express.Router()

const hasEditPermission = (req, res, next) => {
  const userAccess = req.user.access

  if (!['admin', 'researcher'].includes(userAccess)) {
    return res.status(403).json({ message: '权限不足' })
  }

  next()
}

// 图片上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve('public/images')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + '.png'
    cb(null, filename)
  },
})

const upload = multer({ storage })

// 上传图片（仅 admin / researcher）
router.post(
  '/tree-species/upload',
  verifyToken,
  hasEditPermission,
  upload.single('file'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: '未上传文件' })

    const filePath = `/images/${req.file.filename}`
    res.json({ path: filePath })
  },
)

// 获取所有树种信息（公开）
router.get('/tree-species', (req, res) => {
  const sql = `
    SELECT
      id,
      species_name,
      species_latin_name,
      plant_type,
      family_name,
      genus_name,
      description,
      environment,
      distribution_area,
      characteristics,
      main_use,
      image_url
    FROM tree_species
  `

  db.query(sql, (err, results) => {
    if (err) {
      console.error('查询失败:', err.response?.data || err)
      return res.status(500).json({ message: '数据库查询失败' })
    }
    res.json(results)
  })
})

// 新增树种（仅 admin / researcher）
router.post('/tree-species', verifyToken, hasEditPermission, (req, res) => {
  const {
    species_name,
    species_latin_name,
    plant_type,
    family_name,
    genus_name,
    description,
    environment,
    distribution_area,
    characteristics,
    main_use,
    image_url,
  } = req.body

  const sql = `
    INSERT INTO tree_species
    (species_name, species_latin_name, plant_type, family_name, genus_name, description, environment, distribution_area, characteristics, main_use, image_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `

  db.query(
    sql,
    [
      species_name,
      species_latin_name,
      plant_type,
      family_name,
      genus_name,
      description,
      environment,
      distribution_area,
      characteristics,
      main_use,
      image_url,
    ],
    (err, result) => {
      if (err) {
        console.error('新增失败:', err.response?.data || err)
        return res.status(500).json({ message: '新增失败' })
      }
      res.json({ message: '新增成功', id: result.insertId })
    },
  )
})

// 更新树种（仅 admin / researcher）
router.put('/tree-species/:id', verifyToken, hasEditPermission, (req, res) => {
  const { id } = req.params
  const {
    species_name,
    species_latin_name,
    plant_type,
    family_name,
    genus_name,
    description,
    environment,
    distribution_area,
    characteristics,
    main_use,
    image_url,
  } = req.body

  const sql = `
    UPDATE tree_species
    SET species_name=?, species_latin_name=?, plant_type=?, family_name=?, genus_name=?, description=?, environment=?, distribution_area=?, characteristics=?, main_use=?, image_url=?, updated_at=NOW()
    WHERE id=?
  `

  db.query(
    sql,
    [
      species_name,
      species_latin_name,
      plant_type,
      family_name,
      genus_name,
      description,
      environment,
      distribution_area,
      characteristics,
      main_use,
      image_url,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error('更新失败:', err.response?.data || err)
        return res.status(500).json({ message: '更新失败' })
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: '树种不存在' })
      }

      res.json({ message: '更新成功' })
    },
  )
})

// 删除树种（仅 admin / researcher）
router.delete('/tree-species/:id', verifyToken, hasEditPermission, (req, res) => {
  const { id } = req.params
  const sql = `DELETE FROM tree_species WHERE id=?`

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('删除失败:', err.response?.data || err)
      return res.status(500).json({ message: '删除失败' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '树种不存在' })
    }

    res.json({ message: '删除成功' })
  })
})

export default router
