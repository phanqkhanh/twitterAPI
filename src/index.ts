import express from 'express'
import dotenv from 'dotenv'
import UserRouter from './routes/users.routes'

import connectToDatabase from '~/config/db.connect'

const app = express()
dotenv.config()
app.use(express.json())
const PORT = 5000

connectToDatabase()

app.use('/auth', UserRouter)

app.listen(PORT, () => {
  console.log('app listening on port')
})
