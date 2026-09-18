/* global process */
import 'dotenv/config'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET

export function verifyToken(req, res, next) {
  const token = req.headers.authorization
  if (!token) return res.status(401).json({ code: 401, msg: '未登录' })

  try {
    const decoded = jwt.verify(token, SECRET)
    req.user = decoded
    next()
  } catch (err) {
    console.error(err.response?.data || err)
    return res.status(401).json({ code: 401, msg: 'token无效' })
  }
}
