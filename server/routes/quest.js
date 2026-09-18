import express from 'express'
import db from '../db.js'
import { verifyToken } from '../verify.js'

const router = express.Router()

const hasQuestionnaireManagePermission = (req, res, next) => {
  const userAccess = req.user.access

  if (!['admin', 'researcher'].includes(userAccess)) {
    return res.status(403).json({ msg: '权限不足' })
  }

  next()
}

// 随机抽题（公开）
router.get('/question/random', (req, res) => {
  const count = Number(req.query.count) || 5
  const sql = `SELECT * FROM questionnaire_question ORDER BY RAND() LIMIT ?`

  db.query(sql, [count], (err, questions) => {
    if (err) return res.status(500).json({ msg: '数据库错误' })
    if (!questions.length) return res.json([])

    const promises = questions.map(
      (q) =>
        new Promise((resolve, reject) => {
          const sqlOpt = `
            SELECT option_label, option_content
            FROM question_option
            WHERE questionnaire_id=? AND question_seq=?
            ORDER BY option_label ASC
          `
          db.query(sqlOpt, [q.questionnaire_id, q.question_id], (err, opts) => {
            if (err) return reject(err)
            q.options = opts || []
            resolve()
          })
        }),
    )

    Promise.all(promises)
      .then(() => res.json(questions))
      .catch((err) => {
        console.error(err.response?.data || err)
        res.status(500).json({ msg: '加载选项失败' })
      })
  })
})

// 获取问卷题目（公开）
router.get('/questionnaire/:id/questions', (req, res) => {
  const id = req.params.id

  const sqlQ = `SELECT * FROM questionnaire WHERE id=?`
  const sqlQuestions = `SELECT * FROM questionnaire_question WHERE questionnaire_id=? ORDER BY question_id ASC`

  db.query(sqlQ, [id], (err, qRes) => {
    if (err || !qRes.length) return res.status(404).json({ msg: '问卷不存在' })

    db.query(sqlQuestions, [id], (err, questions) => {
      if (err) return res.status(500).json({ msg: '数据库错误' })

      const promises = questions.map(
        (q) =>
          new Promise((resolve, reject) => {
            const sqlOpt = `
              SELECT option_label, option_content
              FROM question_option
              WHERE questionnaire_id=? AND question_seq=?
              ORDER BY option_label ASC
            `
            db.query(sqlOpt, [q.questionnaire_id, q.question_id], (err, opts) => {
              if (err) return reject(err)
              q.options = opts || []
              resolve()
            })
          }),
      )

      Promise.all(promises)
        .then(() =>
          res.json({
            id: qRes[0].id,
            title: qRes[0].title,
            description: qRes[0].description,
            questions,
          }),
        )
        .catch((err) => {
          console.error(err.response?.data || err)
          res.status(500).json({ msg: '加载选项失败' })
        })
    })
  })
})

// 问卷列表（公开）
router.get('/questionnaire/list', (req, res) => {
  db.query(`SELECT id, title FROM questionnaire ORDER BY created_at DESC`, (err, r) => {
    if (err) return res.status(500).json({ msg: '数据库错误' })
    res.json(r)
  })
})

// 检查是否今天已做（需登录）
router.get('/questionnaire/checkToday', verifyToken, (req, res) => {
  const username = req.user.username
  const role = req.user.access

  // admin 不限制
  if (role === 'admin') {
    return res.json({ done: false, admin: true })
  }

  const sql = `SELECT id FROM questionnaire_submit_log WHERE username=? AND submit_date=CURDATE()`
  db.query(sql, [username], (err, r) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ msg: '数据库错误' })
    }
    res.json({ done: r.length > 0 })
  })
})

// 提交问卷并判题（需登录）
router.post('/questionnaire/submitAll', verifyToken, (req, res) => {
  const username = req.user.username
  const { questionnaire_id, answers } = req.body

  if (!answers || !answers.length) {
    return res.status(400).json({ msg: '无答案' })
  }

  db.query(`SELECT id FROM user WHERE username=?`, [username], (err, uRes) => {
    if (err || !uRes.length) return res.status(500).json({ msg: '用户不存在' })
    const userId = uRes[0].id

    // const qids = answers.map((a) => a.question_id)
    const conditions = answers.map(() => '(questionnaire_id = ? AND question_id = ?)').join(' OR ')
    const params = answers.flatMap((a) => [a.questionnaire_id, a.question_id])

    const sqlAns = `
  SELECT questionnaire_id, question_id, question_answer, question_type
  FROM questionnaire_question
  WHERE ${conditions}
`

    db.query(sqlAns, params, (err, correctRes) => {
      if (err) {
        console.error(err.response?.data || err)
        return res.status(500).json({ msg: '数据库错误' })
      }

      let score = 0
      const detail = []

      answers.forEach((a) => {
        const right = correctRes.find((c) => c.question_id == a.question_id)
        if (!right) return

        const correctAnswer = (right.question_answer || '').toUpperCase()
        const userAnswer = (a.answer || '').toUpperCase()
        let isCorrect = false

        if (right.question_type == 2) {
          isCorrect =
            correctAnswer.split('').sort().join('') === userAnswer.split('').sort().join('')
        } else {
          isCorrect = correctAnswer === userAnswer
        }

        if (isCorrect) score += right.question_type == 2 ? 2 : 1

        detail.push({
          question_id: a.question_id,
          question_type: right.question_type,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          correct: isCorrect,
        })
      })

      db.query(`UPDATE user SET point = point + ? WHERE id=?`, [score, userId], (err) => {
        if (err) {
          console.error(err.response?.data || err)
          return res.status(500).json({ msg: '积分更新失败' })
        }

        db.query(
          `INSERT INTO questionnaire_submit_log (username, questionnaire_id, submit_date) VALUES (?, ?, CURDATE())`,
          [username, questionnaire_id],
          (err) => {
            if (err) {
              console.error(err.response?.data || err)
              return res.status(500).json({ msg: '提交记录写入失败' })
            }

            res.json({ score, detail })
          },
        )
      })
    })
  })
})

// 创建问卷（仅 admin / researcher）
router.post('/questionnaire/create', verifyToken, hasQuestionnaireManagePermission, (req, res) => {
  const { title, description, questions, creator } = req.body

  if (!title || !questions || !questions.length) {
    return res.status(400).json({ msg: '参数不完整' })
  }

  const finalCreator = creator || req.user.username

  const sqlInsertQ = `
      INSERT INTO questionnaire (title, description, creator, created_at)
      VALUES (?, ?, ?, NOW())
    `

  db.query(sqlInsertQ, [title, description, finalCreator], (err, qRes) => {
    if (err) {
      console.error(err.response?.data || err)
      return res.status(500).json({ msg: '创建问卷失败' })
    }

    const questionnaireId = qRes.insertId

    const questionValues = questions.map((q, idx) => [
      questionnaireId,
      idx + 1,
      q.question_type,
      q.question_content,
      q.answer,
      new Date(),
      new Date(),
    ])

    const sqlInsertQuestion = `
        INSERT INTO questionnaire_question
          (questionnaire_id, question_id, question_type, question_content, question_answer, created_at, updated_at)
        VALUES ?
      `

    db.query(sqlInsertQuestion, [questionValues], (err) => {
      if (err) {
        console.error(err.response?.data || err)
        return res.status(500).json({ msg: '添加题目失败' })
      }

      const optionValues = []
      questions.forEach((q, idx) => {
        if (q.options && q.options.length) {
          q.options.forEach((op) => {
            optionValues.push([questionnaireId, idx + 1, op.option_label, op.option_content])
          })
        }
      })

      if (optionValues.length) {
        const sqlInsertOptions = `
            INSERT INTO question_option (questionnaire_id, question_seq, option_label, option_content)
            VALUES ?
          `
        db.query(sqlInsertOptions, [optionValues], (err) => {
          if (err) {
            console.error(err.response?.data || err)
            return res.status(500).json({ msg: '添加选项失败' })
          }
          res.json({ msg: '问卷创建成功', questionnaireId })
        })
      } else {
        res.json({ msg: '问卷创建成功', questionnaireId })
      }
    })
  })
})

export default router
