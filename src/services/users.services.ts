import database from '~/config/db.connect'
import { TokenType } from '~/constants/enum'
import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'

class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES
      }
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES
      }
    })
  }

  async checkEmailExit(email: string) {
    const user = await database.users.findOne({ email })
    return !!user
  }

  async register(payload: RegisterReqBody) {
    const result = await database.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.data_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const user_id = result.insertedId.id.toString()
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    return {
      access_token,
      refresh_token
    }
  }
}
const usersService = new UsersService()
export default usersService
