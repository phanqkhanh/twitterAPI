import { hashPassword } from './../utils/crypto'
import { ObjectId } from 'mongodb'
import database from '~/config/db.connect'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { USERS_MESSAGE } from '~/constants/messages'
import { RegisterReqBody, UpdateProfileReqBody } from '~/models/requests/User.requests'
import Follower from '~/models/schemas/Follower.schema'
import RefreshToken from '~/models/schemas/Register.schema'
import User from '~/models/schemas/User.schema'
import { generateRandomCode } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import axios from 'axios'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

class UsersService {
  private signAccessToken(user_id: string, verifyStatus: number) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify: verifyStatus
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES
      }
    })
  }
  private signRefreshToken(user_id: string, verifyStatus: number) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify: verifyStatus
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES
      }
    })
  }
  private signEmailVerifyToken(user_id: string, verifyStatus: number) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify: verifyStatus
      },
      privateKey: process.env.JWT_VERIFY_EMAIL_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_TOKEN_EXPIRES
      }
    })
  }
  private signForgotPasswordToken(code: string, email: string, verifyStatus: number) {
    return signToken({
      payload: {
        code,
        email,
        token_type: TokenType.ForgotPasswordToken,
        verify: verifyStatus
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES
      }
    })
  }
  private getTokenAndRefreshToken(user_id: string, verifyStatus: number) {
    return Promise.all([this.signAccessToken(user_id, verifyStatus), this.signRefreshToken(user_id, verifyStatus)])
  }

  async checkEmailExit(email: string) {
    const user = await database.users.findOne({ email })
    return !!user
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString(), UserVerifyStatus.Unverified)
    const result = await database.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        email_verify_token: email_verify_token as string
      })
    )
    const [access_token, refresh_token] = await this.getTokenAndRefreshToken(
      user_id.toString(),
      UserVerifyStatus.Unverified
    )
    //lưu refresh token
    await database.refreshTokens.insertOne(
      new RefreshToken({
        user_id: result.insertedId,
        token: refresh_token as string
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async login(user_id: string, user_verify: number) {
    const [access_token, refresh_token] = await this.getTokenAndRefreshToken(user_id, user_verify)
    //lưu refresh token
    await database.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token as string
      })
    )
    return { access_token, refresh_token }
  }

  async logout(refresh_token: string) {
    await database.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: 'Logout success'
    }
  }

  //login google
  private async getTokenOauthGoogle(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLe_REDIRECT_URL,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    return data
  }
  private async getUserInfoGoogle(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: { access_token, alt: 'json' },
      headers: { Authorization: 'Bearer ' + id_token }
    })
    return data
  }
  async oauth(code: string) {
    const { id_token, access_token } = await this.getTokenOauthGoogle(code)
    const userInfo = await this.getUserInfoGoogle(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({ status: HTTP_STATUS.BAD_REQUEST, message: USERS_MESSAGE.EMAIL_NOT_VERIFIED })
    }
    //kiểm tra xem email có đăng ký chưa
    const user = await database.users.findOne({ email: userInfo.email })
    if (user) {
      const { access_token, refresh_token } = await this.login(user._id.toString(), user.verify)
      return { access_token, refresh_token, new_user: false, verify: user.verify }
    } else {
      //nếu chưa đăng ký
      const password = Math.random().toString(36).substring(2, 15)
      const { access_token, refresh_token } = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      })

      return {
        access_token,
        refresh_token,
        new_user: true,
        verify: UserVerifyStatus.Verified
      }
    }
  }

  async emailVerify(user_id: string, verify: number) {
    const [token] = await Promise.all([
      this.getTokenAndRefreshToken(user_id, verify),
      database.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: '', //,updated_at: new Date()
            verify: UserVerifyStatus.Verified
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ])
    const [access_token, refresh_token] = token
    await database.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token as string
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async resendEmailVerify(user_id: string, verify: number) {
    const email_verify_token = await this.signEmailVerifyToken(user_id, verify)
    //nơi gửi email
    await database.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { email_verify_token: email_verify_token as string },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return { message: 'Resend email successfully' }
  }

  async forgotPassword(email: string, verify: number) {
    const randomCode = generateRandomCode()
    const forgot_password_token = await this.signForgotPasswordToken(randomCode, email, verify)
    await database.users.updateOne(
      { email: email },
      {
        $set: { forgot_password_token: forgot_password_token as string },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: 'Send code forgot password to email success ' + randomCode
    }
  }

  async resetPassword(email: string, new_password: string) {
    const password = hashPassword(new_password)
    await database.users.updateOne(
      { email },
      { $set: { forgot_password_token: '', password: password }, $currentDate: { updated_at: true } }
    )
    return { message: USERS_MESSAGE.RESET_PASSWORD_SUCCESS }
  }

  async getProfile(_id: string) {
    const user = await database.users.findOne(
      { _id: new ObjectId(_id) },
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
    )
    return user
  }

  async updateProfile(data_update: UpdateProfileReqBody) {
    const user = await database.users.findOneAndUpdate(
      { _id: new ObjectId(data_update.user_id) },
      {
        $set: {
          name: data_update.name,
          date_of_birth: new Date(data_update.date_of_birth),
          bio: data_update.bio,
          location: data_update.location,
          website: data_update.website,
          username: data_update.username,
          avatar: data_update.avatar,
          cover_photo: data_update.cover_photo
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return { message: 'Update profile success', data: { ...user.value } }
  }

  async follow(user_id: string, follower_id: string) {
    const followed = await database.followers.findOne({
      user_id: new ObjectId(user_id),
      follower_id: new ObjectId(follower_id)
    })
    if (followed) {
      return { message: USERS_MESSAGE.FOLLOWED }
    }
    await database.followers.insertOne(
      new Follower({
        user_id: new ObjectId(user_id),
        follower_id: new ObjectId(follower_id)
      })
    )
    return { message: USERS_MESSAGE.FOLLOWED }
  }

  async unFollow(user_id: string, follower_id: string) {
    await database.followers.deleteOne({
      user_id: new ObjectId(user_id),
      follower_id: new ObjectId(follower_id)
    })
    return { message: USERS_MESSAGE.ALREADY_UN_FOLLOW }
  }

  async changePassword(user_id: string, new_password: string) {
    await database.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      { $set: { password: hashPassword(new_password) }, $currentDate: { updated_at: true } }
    )
    return { message: USERS_MESSAGE.CHANGE_PASSWORD_SUCCESS }
  }
}
const usersService = new UsersService()
export default usersService
