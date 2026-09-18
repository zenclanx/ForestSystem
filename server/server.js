import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import userRouter from './routes/user.js'
import treeSpeciesRouter from './routes/treeSpecies.js'
import mailbox from './routes/mailbox.js'
import moniterRouter from './routes/moniter.js'
import modelsLoadRouter from './routes/modelsLoad.js'
import visualRoutes from './routes/Visual.js'
import questRouter from './routes/quest.js'
import pestfindRouter from './routes/pestfind.js'
import { sendEmail } from './email.js'
import othermailRoutes from './routes/othermail.js'
import dpAI from './dpAI.js'

const app = express()

app.use(cors())
app.use(express.json())

//挂载用户路由
app.use('/api', userRouter)
//挂载AI路由
app.use('/api', dpAI)
//挂载邮箱路由
app.use('/api', mailbox)
//挂载监测数据路由
app.use('/api', moniterRouter)
//挂载模型路由
app.use('/api', modelsLoadRouter)
//挂载树种路由
app.use('/api', visualRoutes)
//挂载问卷路由
app.use('/api', questRouter)
//挂载害虫检测路由
app.use('/api', pestfindRouter)
//挂载树种路由
app.use('/api', treeSpeciesRouter)
//邮箱
app.post('/sendMail', async (req, res) => {
  const { to, subject, text } = req.body
  try {
    const info = await sendEmail(to, subject, text)
    // 只返回安全字段
    res.send({ success: true, message: '邮件已发送', messageId: info.messageId })
  } catch (err) {
    console.error('发送邮件失败:', err)
    res.status(500).send({ success: false, message: err.message })
  }
})
//挂载联系人路由
app.use('/api', othermailRoutes)
//测试接口
app.get('/api/test', (req, res) => {
  res.send('后端服务正常')
})

app.listen(3000, () => {
  console.log('后端服务已启动：http://localhost:3000')
})
