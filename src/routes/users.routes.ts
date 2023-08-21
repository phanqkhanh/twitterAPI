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
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  unFollowController,
  updateProfileController,
  verifyCodeController
} from '~/controllers/users.controllers'
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

const userRouter = Router()

userRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
userRouter.get('/oauth/google', wrapRequestHandler(oauthController))
userRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
userRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))
userRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))
userRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendEmailVerifyController))
userRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))
userRouter.post('/verify-code', verifyCodeValidator, wrapRequestHandler(verifyCodeController))
userRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))
userRouter.get('/profile', accessTokenValidator, verifiedUser, wrapRequestHandler(profileController))
userRouter.put(
  '/update-profile',
  accessTokenValidator,
  verifiedUser,
  updateProfileValidator,
  wrapRequestHandler(updateProfileController)
)
userRouter.post('/follow', accessTokenValidator, verifiedUser, followValidator, wrapRequestHandler(followController))
userRouter.delete(
  '/un-follow/:follower_id',
  accessTokenValidator,
  verifiedUser,
  followValidator,
  wrapRequestHandler(unFollowController)
)
userRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUser,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

export default userRouter
