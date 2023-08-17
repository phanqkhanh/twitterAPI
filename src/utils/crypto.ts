import { createHash } from 'crypto'

export const sha256 = (content: string) => {
  return createHash('sha256').update(content).digest('hex')
}

export const hashPassword = (password: string) => {
  return sha256(password + process.env.PASSWORD_SECRET)
}

// Hàm để tạo mã số ngẫu nhiên
export function generateRandomCode() {
  const charset = '0123456789'
  let randomCode = ''
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    randomCode += charset[randomIndex]
  }
  return randomCode
}
