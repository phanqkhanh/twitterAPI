import express from 'express'
import dotenv from 'dotenv'
import userRouter from './routes/users.routes'
import mediasRouter from './routes/medias.routes'

import database from '~/config/db.connect'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import { initFolder } from './utils/file'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'

const app = express()
dotenv.config()
app.use(express.json())
const PORT = process.env.PORT || 3000
database.connect()
initFolder()

app.use('/users', userRouter)
app.use('/medias', mediasRouter)

app.use('/uploads/image', express.static(UPLOAD_IMAGE_DIR))
app.use('/uploads/video', express.static(UPLOAD_VIDEO_DIR))

//error handler
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log('app listening on port')
})
