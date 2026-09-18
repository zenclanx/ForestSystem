/* global process */
import 'dotenv/config'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

export const sendEmail = async (to, subject, text) => {
  const info = await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    text,
  })
  console.log('邮件已发送: %s', info.messageId)
  return info
}
