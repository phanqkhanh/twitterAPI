import { Router } from 'express'
import { uploadImageController, uploadVideoController } from '~/controllers/medias.controllers'
import { accessTokenValidator, verifiedUser } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const mediasRouter = Router()

mediasRouter.post('/upload-image', accessTokenValidator, verifiedUser, wrapRequestHandler(uploadImageController))
mediasRouter.post('/upload-video', accessTokenValidator, verifiedUser, wrapRequestHandler(uploadVideoController))

export default mediasRouter
