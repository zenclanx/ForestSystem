<template>
  <div class="create-quest-page">
    <!-- 顶部说明 -->
    <section class="hero-panel">
      <div class="hero-left">
        <p class="badge">问卷编辑中心</p>
        <h1>新建科研问卷</h1>
        <p class="hero-desc">
          支持 Excel 批量导入、手动编辑题目、选项增删、模板下载与问卷创建提交。
        </p>
      </div>

      <div class="hero-actions">
        <button class="action-btn" @click="goBack">返回问卷中心</button>
      </div>
    </section>

    <!-- 问卷基础信息 -->
    <section class="panel">
      <div class="panel-title">
        <h2>问卷基础信息</h2>
      </div>

      <div class="base-form">
        <div class="form-item">
          <label>问卷标题</label>
          <input v-model="title" placeholder="请输入问卷标题" />
        </div>

        <div class="form-item full-row">
          <label>问卷描述</label>
          <textarea v-model="description" placeholder="请输入问卷描述"></textarea>
        </div>
      </div>
    </section>

    <!-- Excel 工具区 -->
    <section class="panel">
      <div class="panel-title">
        <h2>Excel 导入与导出</h2>
      </div>

      <div class="excel-toolbar">
        <label class="upload-box">
          <span>选择 Excel 文件</span>
          <input type="file" accept=".xlsx,.xls" @change="handleExcelUpload" />
        </label>

        <div class="button-row">
          <button class="secondary-btn" @click="downloadTemplate">下载模板</button>
          <button class="secondary-btn" @click="exportToExcel" :disabled="questions.length === 0">
            导出当前题目
          </button>
        </div>
      </div>

      <div class="import-mode">
        <span>导入方式：</span>
        <label>
          <input type="radio" value="replace" v-model="importMode" />
          覆盖现有题目
        </label>
        <label>
          <input type="radio" value="append" v-model="importMode" />
          追加到现有题目
        </label>
      </div>

      <p class="tip-text">
        模板字段建议包含：题目内容、题目类型（1单选 /
        2多选）、选项A、选项B、选项C、选项D、正确答案。
      </p>
    </section>

    <!-- 题目编辑区 -->
    <section class="panel">
      <div class="panel-title">
        <h2>题目编辑区</h2>
        <span class="panel-tip">当前共 {{ questions.length }} 题</span>
      </div>

      <div class="question-actions">
        <button class="primary-btn" @click="addQuestion()">➕ 新增单选题</button>
        <button class="primary-btn alt" @click="addQuestion(2)">➕ 新增多选题</button>
      </div>

      <div v-if="questions.length === 0" class="empty-box">
        暂无题目，请手动新增题目或通过 Excel 导入。
      </div>

      <div v-else class="question-list">
        <div v-for="(q, qIndex) in questions" :key="q.localId" class="question-card">
          <div class="question-header">
            <div class="question-header-left">
              <span class="question-index">Q{{ qIndex + 1 }}</span>
              <span class="question-type-tag">
                {{ Number(q.question_type) === 1 ? '单选题' : '多选题' }}
              </span>
            </div>

            <div class="question-header-right">
              <button class="mini-btn" @click="moveUp(qIndex)" :disabled="qIndex === 0">
                上移
              </button>
              <button
                class="mini-btn"
                @click="moveDown(qIndex)"
                :disabled="qIndex === questions.length - 1"
              >
                下移
              </button>
              <button class="danger-btn mini-btn" @click="removeQuestion(qIndex)">删除题目</button>
            </div>
          </div>

          <div class="question-body">
            <div class="form-item full-row">
              <label>题目内容</label>
              <textarea v-model="q.question_content" placeholder="请输入题目内容"></textarea>
            </div>

            <div class="question-config-grid">
              <div class="form-item">
                <label>题目类型</label>
                <select v-model.number="q.question_type">
                  <option :value="1">单选题</option>
                  <option :value="2">多选题</option>
                </select>
              </div>

              <div class="form-item">
                <label>正确答案</label>
                <input
                  v-model="q.answer"
                  placeholder="单选如 A，多选如 AC"
                  @input="q.answer = normalizeAnswer(q.answer)"
                />
              </div>
            </div>

            <div class="options-section">
              <div class="options-header">
                <h3>选项设置</h3>
                <button class="mini-btn" @click="addOption(q)">新增选项</button>
              </div>

              <div class="option-list">
                <div
                  v-for="(op, opIndex) in q.options"
                  :key="q.localId + '-' + opIndex"
                  class="option-item"
                >
                  <div class="option-label-box">{{ getOptionLabel(opIndex) }}</div>

                  <input
                    v-model="q.options[opIndex].option_content"
                    :placeholder="`请输入选项 ${getOptionLabel(opIndex)} 内容`"
                  />

                  <button
                    class="danger-btn mini-btn"
                    @click="removeOption(q, opIndex)"
                    :disabled="q.options.length <= 2"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>

            <div class="preview-box">
              <p class="preview-title">题目预览</p>
              <p class="preview-question">{{ q.question_content || '（题目内容预览）' }}</p>
              <ul>
                <li v-for="(op, opIndex) in q.options" :key="opIndex">
                  {{ getOptionLabel(opIndex) }}. {{ op.option_content || '（选项内容）' }}
                </li>
              </ul>
              <p class="preview-answer">正确答案：{{ q.answer || '未设置' }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 提交区 -->
    <section class="panel submit-panel">
      <div class="submit-summary">
        <div class="summary-item">
          <span>问卷标题</span>
          <strong>{{ title || '未填写' }}</strong>
        </div>
        <div class="summary-item">
          <span>题目数量</span>
          <strong>{{ questions.length }}</strong>
        </div>
      </div>

      <button class="submit-btn" @click="submitQuestionnaire">📤 提交创建问卷</button>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import * as XLSX from 'xlsx'

const router = useRouter()

const token = sessionStorage.getItem('atoken') || ''

const title = ref('')
const description = ref('')
const importMode = ref('replace')
const questions = ref([])

const createQuestionTemplate = (type = 1) => ({
  localId: Date.now() + Math.random(),
  question_content: '',
  question_type: type,
  answer: '',
  options: [
    { option_label: 'A', option_content: '' },
    { option_label: 'B', option_content: '' },
    { option_label: 'C', option_content: '' },
    { option_label: 'D', option_content: '' },
  ],
})

const goBack = () => {
  router.push('/QuestionNaire')
}

const getOptionLabel = (index) => {
  return String.fromCharCode(65 + index)
}

const normalizeAnswer = (value) => {
  return (value || '')
    .toUpperCase()
    .replace(/[^A-D]/g, '') // 只留 A/B/C/D，其他字符直接删掉
    .split('')
    .filter((v, i, arr) => arr.indexOf(v) === i) // 去重
    .sort()
    .join('')
}

const rebuildOptionLabels = (question) => {
  question.options = question.options.map((item, index) => ({
    ...item,
    option_label: getOptionLabel(index),
  }))
}

const addQuestion = (type = 1) => {
  questions.value.push(createQuestionTemplate(type))
}

const removeQuestion = (index) => {
  questions.value.splice(index, 1)
}

const moveUp = (index) => {
  if (index === 0) return
  const temp = questions.value[index]
  questions.value[index] = questions.value[index - 1]
  questions.value[index - 1] = temp
}

const moveDown = (index) => {
  if (index === questions.value.length - 1) return
  const temp = questions.value[index]
  questions.value[index] = questions.value[index + 1]
  questions.value[index + 1] = temp
}

const addOption = (question) => {
  if (question.options.length >= 8) {
    alert('最多支持 8 个选项')
    return
  }

  question.options.push({
    option_label: getOptionLabel(question.options.length),
    option_content: '',
  })
  rebuildOptionLabels(question)
}

const removeOption = (question, index) => {
  if (question.options.length <= 2) {
    alert('题目至少保留 2 个选项')
    return
  }

  question.options.splice(index, 1)
  rebuildOptionLabels(question)
  question.answer = normalizeAnswer(question.answer)
}

const convertExcelRowToQuestion = (row) => {
  const options = []

  const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  optionKeys.forEach((key, index) => {
    const value = row[`选项${key}`] ?? row[`option${key}`] ?? row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      options.push({
        option_label: getOptionLabel(index),
        option_content: String(value),
      })
    }
  })

  return {
    localId: Date.now() + Math.random(),
    question_content: row['题目内容'] || row['question_content'] || '',
    question_type: Number(row['题目类型'] || row['question_type'] || 1),
    answer: normalizeAnswer(row['正确答案'] || row['answer'] || ''),
    options:
      options.length >= 2
        ? options
        : [
            { option_label: 'A', option_content: '' },
            { option_label: 'B', option_content: '' },
            { option_label: 'C', option_content: '' },
            { option_label: 'D', option_content: '' },
          ],
  }
}

const handleExcelUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (!jsonData.length) {
        alert('Excel 内容为空')
        return
      }

      const importedQuestions = jsonData.map(convertExcelRowToQuestion)

      if (importMode.value === 'replace') {
        questions.value = importedQuestions
      } else {
        questions.value.push(...importedQuestions)
      }

      alert(`成功导入 ${importedQuestions.length} 道题目`)
    } catch (err) {
      console.error(err.response?.data || err)
      alert('Excel 导入失败，请检查控制台')
    } finally {
      event.target.value = ''
    }
  }

  reader.readAsArrayBuffer(file)
}

const downloadTemplate = () => {
  const templateData = [
    {
      题目内容: '森林火灾高发季节通常是？',
      题目类型: 1,
      选项A: '春季',
      选项B: '夏季',
      选项C: '秋季',
      选项D: '冬季',
      正确答案: 'A',
    },
    {
      题目内容: '以下哪些属于森林资源保护措施？',
      题目类型: 2,
      选项A: '加强巡护',
      选项B: '乱砍滥伐',
      选项C: '科学防火',
      选项D: '生态修复',
      正确答案: 'ACD',
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '问卷模板')
  XLSX.writeFile(workbook, '问卷导入模板.xlsx')
}

const exportToExcel = () => {
  const exportData = questions.value.map((q) => {
    const row = {
      题目内容: q.question_content,
      题目类型: q.question_type,
      正确答案: q.answer,
    }

    q.options.forEach((op, index) => {
      row[`选项${getOptionLabel(index)}`] = op.option_content
    })

    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '问卷题目')
  XLSX.writeFile(workbook, `${title.value || '未命名问卷'}.xlsx`)
}

const validateQuestion = (q, index) => {
  if (!q.question_content.trim()) {
    return `第 ${index + 1} 题题目内容不能为空`
  }

  if (![1, 2].includes(Number(q.question_type))) {
    return `第 ${index + 1} 题题目类型不正确`
  }

  if (!q.options || q.options.length < 2) {
    return `第 ${index + 1} 题至少需要 2 个选项`
  }

  const validOptions = q.options.every((op) => op.option_content && op.option_content.trim())
  if (!validOptions) {
    return `第 ${index + 1} 题存在空选项`
  }

  if (!q.answer.trim()) {
    return `第 ${index + 1} 题正确答案不能为空`
  }

  return ''
}

const submitQuestionnaire = async () => {
  if (!title.value.trim()) {
    alert('问卷标题不能为空')
    return
  }

  if (questions.value.length === 0) {
    alert('请至少添加一道题目')
    return
  }

  for (let i = 0; i < questions.value.length; i++) {
    const msg = validateQuestion(questions.value[i], i)
    if (msg) {
      alert(msg)
      return
    }
  }

  const payload = {
    title: title.value,
    description: description.value,
    questions: questions.value.map((q) => ({
      question_content: q.question_content,
      question_type: q.question_type,
      answer: normalizeAnswer(q.answer),
      options: q.options.map((op, index) => ({
        option_label: getOptionLabel(index),
        option_content: op.option_content,
      })),
    })),
  }

  try {
    const res = await axios.post('http://localhost:3000/api/questionnaire/create', payload, {
      headers: {
        Authorization: token,
      },
    })

    alert('问卷创建成功！ID: ' + res.data.questionnaireId)

    title.value = ''
    description.value = ''
    questions.value = []
  } catch (err) {
    console.error(err.response?.data || err)
    alert('提交失败，请检查控制台')
  }
}
</script>

<style scoped>
.create-quest-page {
  min-height: 100vh;
  padding: 20px;
  background: radial-gradient(circle at top, #0f172a, #05070f);
  color: #e5e7eb;
  font-family: 'Segoe UI', sans-serif;
}

.hero-panel,
.panel,
.question-card {
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid #1e293b;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 18px;
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.25);
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  margin-bottom: 12px;
  font-size: 13px;
}

.hero-left h1 {
  font-size: 30px;
  margin: 0 0 10px;
  color: #f8fafc;
}

.hero-desc {
  color: #cbd5e1;
  line-height: 1.8;
  margin: 0;
  max-width: 760px;
}

.action-btn,
.primary-btn,
.secondary-btn,
.submit-btn,
.mini-btn,
.danger-btn {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.action-btn,
.primary-btn,
.secondary-btn,
.submit-btn {
  padding: 10px 16px;
  color: white;
}

.action-btn {
  background: linear-gradient(135deg, #0f766e, #0ea5e9);
}

.primary-btn {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.primary-btn.alt {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.secondary-btn {
  background: linear-gradient(135deg, #475569, #334155);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  font-weight: 700;
  font-size: 16px;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.mini-btn {
  padding: 7px 12px;
  background: #334155;
  color: #e2e8f0;
  font-size: 13px;
}

.danger-btn {
  background: #b91c1c;
  color: #fff1f2;
}

.action-btn:hover,
.primary-btn:hover,
.secondary-btn:hover,
.submit-btn:hover,
.mini-btn:hover,
.danger-btn:hover {
  transform: translateY(-1px);
}

.submit-btn:disabled,
.secondary-btn:disabled,
.mini-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-title h2 {
  margin: 0;
  font-size: 18px;
  color: #38bdf8;
}

.panel-tip {
  font-size: 12px;
  color: #94a3b8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.16);
  padding: 4px 10px;
  border-radius: 999px;
}

.base-form,
.question-config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  color: #cbd5e1;
  font-weight: 600;
}

.full-row {
  grid-column: 1 / -1;
}

input,
textarea,
select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #020617;
  color: #e2e8f0;
  box-sizing: border-box;
  outline: none;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.excel-toolbar,
.button-row,
.question-actions,
.question-header,
.question-header-left,
.question-header-right,
.options-header,
.submit-summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.excel-toolbar,
.options-header,
.question-header,
.submit-summary {
  justify-content: space-between;
  align-items: center;
}

.upload-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #020617;
  border: 1px dashed #334155;
  color: #cbd5e1;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
}

.upload-box input {
  display: none;
}

.import-mode {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-top: 14px;
  color: #cbd5e1;
}

.tip-text {
  margin-top: 12px;
  color: #94a3b8;
  line-height: 1.8;
}

.empty-box {
  text-align: center;
  padding: 24px 0;
  color: #94a3b8;
}

.question-list {
  display: grid;
  gap: 16px;
}

.question-card {
  padding: 18px;
}

.question-index {
  font-size: 18px;
  font-weight: 700;
  color: #38bdf8;
}

.question-type-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.16);
  color: #cbd5e1;
  font-size: 12px;
}

.question-body {
  margin-top: 14px;
}

.options-section {
  margin-top: 16px;
}

.options-header h3 {
  margin: 0;
  font-size: 16px;
  color: #f8fafc;
}

.option-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.option-item {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 10px;
  align-items: center;
}

.option-label-box {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.24);
  color: #93c5fd;
  border-radius: 10px;
  text-align: center;
  padding: 10px 0;
  font-weight: 700;
}

.preview-box {
  margin-top: 18px;
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 14px;
}

.preview-title {
  color: #38bdf8;
  font-weight: 700;
  margin-bottom: 8px;
}

.preview-question {
  color: #f8fafc;
  font-size: 15px;
  margin-bottom: 8px;
  line-height: 1.8;
}

.preview-box ul {
  margin: 0 0 10px 18px;
  color: #cbd5e1;
  line-height: 1.8;
}

.preview-answer {
  color: #facc15;
  font-weight: 700;
}

.submit-panel {
  position: sticky;
  bottom: 16px;
}

.submit-summary {
  margin-bottom: 14px;
}

.summary-item {
  flex: 1;
  min-width: 180px;
  background: linear-gradient(135deg, #020617, #111827);
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 14px;
}

.summary-item span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.summary-item strong {
  color: #f8fafc;
  font-size: 18px;
  word-break: break-word;
}

@media (max-width: 900px) {
  .hero-panel,
  .base-form,
  .question-config-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .question-header,
  .options-header,
  .excel-toolbar,
  .submit-summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .option-item {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-left h1 {
    font-size: 24px;
  }

  .question-actions,
  .button-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
