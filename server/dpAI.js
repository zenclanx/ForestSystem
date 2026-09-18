/* global process */
import 'dotenv/config'
import express from 'express'
import OpenAI from 'openai'

const router = express.Router()

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

// 请求树种名称
router.post('/aianswer', async (req, res) => {
  const { query } = req.body

  if (!query) {
    return res.status(400).json({ error: 'Query is required' })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: query },
      ],
    })

    const answer = completion.choices[0].message.content
    res.json({ answer })
  } catch (err) {
    console.error('DeepSeek API error:', err.response?.data || err)
    res.status(500).json({ error: 'AI request failed' })
  }
})

// 流式接口
router.get('/aianswer-stream', async (req, res) => {
  const query = req.query.query
  if (!query) return res.status(400).json({ error: 'Query is required' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    const stream = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: query },
      ],
      stream: true,
    })

    for await (const event of stream) {
      if (event.type === 'message') {
        const content = event.delta?.content
        if (content) {
          res.write(`data: ${content}\n\n`)
        }
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error(err.response?.data || err)
    res.write('data: [ERROR]\n\n')
    res.end()
  }
})

export default router
