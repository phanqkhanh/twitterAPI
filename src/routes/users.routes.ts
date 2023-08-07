import { Router } from 'express'
import { getUser, registerUser } from '~/controllers/user.controllers'

const router = Router()

router.get('/', getUser)
router.post('/register', registerUser)

export default router
