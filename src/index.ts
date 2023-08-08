import express from 'express'
import dotenv from 'dotenv'
import UserRouter from './routes/users.routes'

import database from '~/config/db.connect'

const app = express()
dotenv.config()
app.use(express.json())
const PORT = process.env.PORT || 3000

database.connect()

app.use('/auth', UserRouter)

app.listen(PORT, () => {
  console.log('app listening on port')
})
