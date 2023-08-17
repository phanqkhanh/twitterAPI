import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import database from '~/config/db.connect'
import { UserVerifyStatus } from '~/constants/enum'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGE } from '~/constants/messages'
import { RegisterReqBody, UpdateProfileReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import usersService from '~/services/users.services'

const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id?.toString()
  const result = await usersService.login(user_id as string, user.verify)
  return res.status(200).json({ msg: 'Login success', status: 'success', result })
}

const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const result = (await usersService.oauth(code?.toString() as string)) as {
    access_token: string
    refresh_token: string
    new_user: boolean
    verify: number
  }
  const urlRedirect = `${process.env.CLIENT_REDIRECT_URL}?access_token=${result.access_token}
  &refresh_token=${result.refresh_token}&new_user=${result.new_user}&verify=${result.verify}`
  return res.redirect(urlRedirect)

  // res.json({
  //   message: ''
  // })
}

const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.status(200).json({
    msg: 'Register success',
    status: 'success',
    result
  })
}

const logoutController = async (req: Request, res: Response) => {
  const refresh_token = req.body.refresh_token
  const result = await usersService.logout(refresh_token)
  return res.json(result)
}

const emailVerifyController = async (req: Request, res: Response) => {
  const { _id, verify } = req.body.user
  const result = await usersService.emailVerify(_id, verify)
  return res.status(HTTP_STATUS.OK).json({
    msg: 'Email verify success',
    status: 'success',
    ...result
  })
}

const resendEmailVerifyController = async (req: Request, res: Response) => {
  const { user_id, verify } = req.body.decoded_authorization
  const user = await database.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: USERS_MESSAGE.USERS_NOT_FOUND })
  }
  if (user.verify == UserVerifyStatus.Verified) {
    return res.json({ message: USERS_MESSAGE.EMAIL_HAS_BEEN_VERIFIED })
  }

  const result = await usersService.resendEmailVerify(user._id.toString(), verify)
  return res.json(result)
}

const forgotPasswordController = async (req: Request, res: Response) => {
  const { email, verify } = req.body.user
  const result = await usersService.forgotPassword(email, verify)
  return res.json(result)
}

const verifyCodeController = async (req: Request, res: Response) => {
  return res.json({ message: USERS_MESSAGE.CODE_IS_VALID, token: req.body.user.forgot_password_token })
}

const resetPasswordController = async (req: Request, res: Response) => {
  const { email, new_password } = req.body
  const result = await usersService.resetPassword(email, new_password)
  return res.json(result)
}

const profileController = async (req: Request, res: Response) => {
  const { user_id } = req.body.decoded_authorization
  const user = await usersService.getProfile(user_id)
  return res.json({ message: USERS_MESSAGE.GET_USER_SUCCESS, user })
}

const updateProfileController = async (req: Request<ParamsDictionary, any, UpdateProfileReqBody>, res: Response) => {
  // const { name, data_of_birth, bio, location, website, username, avatar, cover_photo } = req.body
  const result = await usersService.updateProfile(req.body)
  return res.json(result)
}

const followController = async (req: Request, res: Response) => {
  const { user_id, follower_id } = req.body
  const result = await usersService.follow(user_id, follower_id)
  return res.json(result)
}

const unFollowController = async (req: Request, res: Response) => {
  const { follower_id } = req.params
  const { user_id } = req.body
  const result = await usersService.unFollow(user_id, follower_id)
  res.json(result)
}

const changePasswordController = async (req: Request, res: Response) => {
  const { user_id, new_password } = req.body
  const result = await usersService.changePassword(user_id, new_password)
  res.json(result)
}

export {
  loginController,
  registerController,
  logoutController,
  emailVerifyController,
  resendEmailVerifyController,
  forgotPasswordController,
  verifyCodeController,
  resetPasswordController,
  profileController,
  updateProfileController,
  followController,
  unFollowController,
  changePasswordController,
  oauthController
}
