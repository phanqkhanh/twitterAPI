import express from 'express'
import dotenv from 'dotenv'
import userRouter from './routes/users.routes'
import mediasRouter from './routes/medias.routes'

import database from '~/config/db.connect'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import { initFolder } from './utils/file'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'
import './utils/s3'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import YAML from 'yaml'
import log from './utils/log'
import path from 'path'
import { envConfig } from './config/environment'

const app = express()
dotenv.config()
app.use(express.json())
const PORT = envConfig.port

const file = fs.readFileSync(path.resolve('src/swagger/openAPI.yaml'), 'utf8')
const swaggerDocument = YAML.parse(file)

database.connect().then(() => {
  database.indexUsers()
  database.indexRefreshTokens()
  database.indexFollowers()
})
initFolder()

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use('/users', userRouter)
app.use('/medias', mediasRouter)

app.use('/uploads/image', express.static(UPLOAD_IMAGE_DIR))
app.use('/uploads/video', express.static(UPLOAD_VIDEO_DIR))

//error handler
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log('app listening on port')
})
