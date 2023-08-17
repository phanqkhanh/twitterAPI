import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyController,
  followController,
  forgotPasswordController,
  loginController,
  logoutController,
  oauthController,
  profileController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  unFollowController,
  updateProfileController,
  verifyCodeController
} from '~/controllers/user.controllers'
import {
  loginValidator,
  accessTokenValidator,
  registerValidator,
  refreshTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  verifyCodeValidator,
  resetPasswordValidator,
  verifiedUser,
  updateProfileValidator,
  followValidator,
  changePasswordValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const router = Router()

router.post('/login', loginValidator, wrapRequestHandler(loginController))
router.get('/oauth/google', wrapRequestHandler(oauthController))
router.post('/register', registerValidator, wrapRequestHandler(registerController))
router.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
router.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))
router.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendEmailVerifyController))
router.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))
router.post('/verify-code', verifyCodeValidator, wrapRequestHandler(verifyCodeController))
router.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))
router.get('/profile', accessTokenValidator, verifiedUser, wrapRequestHandler(profileController))
router.put(
  '/update-profile',
  accessTokenValidator,
  verifiedUser,
  updateProfileValidator,
  wrapRequestHandler(updateProfileController)
)
router.post('/follow', accessTokenValidator, verifiedUser, followValidator, wrapRequestHandler(followController))
router.delete(
  '/un-follow/:follower_id',
  accessTokenValidator,
  verifiedUser,
  followValidator,
  wrapRequestHandler(unFollowController)
)
router.put(
  '/change-password',
  accessTokenValidator,
  verifiedUser,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

export default router
