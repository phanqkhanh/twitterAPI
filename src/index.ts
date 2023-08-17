import express from 'express'
import dotenv from 'dotenv'
import UserRouter from './routes/users.routes'

import database from '~/config/db.connect'
import { defaultErrorHandler } from './middlewares/error.middlewares'

const app = express()
dotenv.config()
app.use(express.json())
const PORT = process.env.PORT || 3000
database.connect()

app.use('/user', UserRouter)

//error handler
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log('app listening on port')
})
