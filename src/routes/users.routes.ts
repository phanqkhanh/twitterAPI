import { Router } from 'express'
import { getUser, registerController } from '~/controllers/user.controllers'
import { registerValidator } from '~/middlewares/users.middlewares'

const router = Router()

router.get('/', getUser)
router.post('/register', registerValidator, registerController)

export default router
