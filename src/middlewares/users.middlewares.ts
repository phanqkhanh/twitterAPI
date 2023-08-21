import { config } from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import database from '~/config/db.connect'
import { UserVerifyStatus } from '~/constants/enum'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
config()

const passwordSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isLength: {
    options: { min: 6, max: 50 },
    errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isString: {
    errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isStrongPassword: {
    options: {
      minLength: 1,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_MUST_BE_STRONG
  }
}
export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGE.NAME_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: USERS_MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGE.EMAIL_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const isExitEmail = await usersService.checkEmailExit(value)
            if (isExitEmail) {
              throw new Error(USERS_MESSAGE.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      password: {
        ...passwordSchema
      },
      confirm_password: {
        ...passwordSchema,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGE.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
            }
            return true
          }
        }
      },
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: USERS_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      }
    },
    ['body']
  )
)

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGE.EMAIL_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await database.users.findOne({ email: value, password: hashPassword(req.body.password) })
            if (!user) {
              throw new Error(USERS_MESSAGE.USERS_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.PASSWORD_IS_REQUIRED
        },
        isLength: { options: { min: 6, max: 50 }, errorMessage: USERS_MESSAGE.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50 },
        isString: {
          errorMessage: USERS_MESSAGE.PASSWORD_MUST_BE_A_STRING
        },
        isStrongPassword: {
          options: {
            minLength: 1,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USERS_MESSAGE.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        // notEmpty: { errorMessage: USERS_MESSAGE.ACCESS_TOKEN_IS_REQUIRED },
        custom: {
          options: async (value, { req }) => {
            const access_token = (value || '').split(' ')[1]
            if (access_token === '') {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            const decoded_authorization = await verifyToken({
              token: access_token,
              secret: process.env.JWT_SECRET_ACCESS_TOKEN as string
            })
            req.body.decoded_authorization = decoded_authorization
            req.body.user_id = decoded_authorization.user_id
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            const refreshToken = await database.refreshTokens.findOne({ token: value })
            if (!refreshToken) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.REFRESH_TOKEN_DOES_NOT_EXIST,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            req.body.user_id = refreshToken.user_id
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        // notEmpty: { errorMessage: USERS_MESSAGE.EMAIL_VERIFY_TOKEN_IS_REQUIRED },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const [user, token] = await Promise.all([
              database.users.findOne({ email_verify_token: value }),
              verifyToken({
                token: value,
                secret: process.env.JWT_VERIFY_EMAIL_TOKEN as string
              })
            ])
            if (token && !user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.EMAIL_HAS_BEEN_VERIFIED,
                status: HTTP_STATUS.OK
              })
            }
            req.body.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGE.EMAIL_INVALID
        },
        trim: true,
        custom: {
          options: async (email, { req }) => {
            const user = await database.users.findOne({ email })
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.USERS_NOT_FOUND,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            req.body.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyCodeValidator = validate(
  checkSchema(
    {
      code: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.CODE_IS_REQUIRED,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const email = req.body.email
            const user = await database.users.findOne({ email })
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.USERS_NOT_FOUND,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            if (!user.forgot_password_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.CODE_IS_NOT_VALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            req.body.user = user
            const decoded_forgot_password_token = await verifyToken({
              token: user.forgot_password_token,
              secret: process.env.JWT_SECRET_FORGOT_PASSWORD as string
            })
            if (decoded_forgot_password_token.code != value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.CODE_IS_NOT_VALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      new_password: {
        ...passwordSchema
      },
      confirm_password: {
        ...passwordSchema,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.new_password) {
              throw new Error(USERS_MESSAGE.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
            }
            return true
          }
        }
      },
      token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const forgot_password_token = await verifyToken({
              token: value,
              secret: process.env.JWT_SECRET_FORGOT_PASSWORD as string
            })
            req.body.email = forgot_password_token.email
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const updateProfileValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGE.NAME_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: USERS_MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100
        }
      },
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: USERS_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      },
      bio: {
        isString: {
          errorMessage: USERS_MESSAGE.BIO_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            max: 200
          },
          errorMessage: USERS_MESSAGE.BIO_LENGTH_ERROR
        }
      },
      location: {
        isString: {
          errorMessage: USERS_MESSAGE.LOCATION_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            max: 200
          },
          errorMessage: USERS_MESSAGE.LOCATION_LENGTH_ERROR
        }
      },
      website: {
        isString: {
          errorMessage: USERS_MESSAGE.WEBSITE_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            max: 200
          },
          errorMessage: USERS_MESSAGE.WEBSITE_LENGTH_ERROR
        }
      },
      username: {
        isString: {
          errorMessage: USERS_MESSAGE.USERNAME_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            max: 50
          },
          errorMessage: USERS_MESSAGE.USERNAME_LENGTH_ERROR
        },
        custom: {
          options: async (value, { req }) => {
            const user = await database.users.findOne({ username: value })
            if (user) {
              throw new Error(USERS_MESSAGE.USERNAME_EXISTING)
            }
          }
        }
      },
      avatar: {
        isString: {
          errorMessage: USERS_MESSAGE.AVATAR_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            max: 500
          },
          errorMessage: USERS_MESSAGE.AVATAR_LENGTH_ERROR
        }
      },
      cover_photo: {
        isString: {
          errorMessage: USERS_MESSAGE.COVER_PHOTO_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            max: 500
          },
          errorMessage: USERS_MESSAGE.COVER_PHOTO_LENGTH_ERROR
        }
      }
    },
    ['body']
  )
)

export const verifiedUser = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.body.decoded_authorization
  if (verify != UserVerifyStatus.Verified) {
    return next(new ErrorWithStatus({ message: USERS_MESSAGE.USER_NOT_VERIFIED, status: HTTP_STATUS.FORBIDDEN }))
  }
  next()
}

export const followValidator = validate(
  checkSchema({
    follower_id: {
      trim: true,
      custom: {
        options: async (value, { req }) => {
          if (!value) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGE.FOLLOWERS_IS_REQUIRED,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }
          const user_follower = await database.users.findOne({ _id: new ObjectId(value) })
          if (!user_follower) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGE.USERS_NOT_FOUND,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }
          return true
        }
      }
    }
  })
)

export const changePasswordValidator = validate(
  checkSchema({
    old_password: {
      custom: {
        options: async (value, { req }) => {
          const user = await database.users.findOne({ _id: new ObjectId(req.body.user_id) })
          if (user?.password != hashPassword(value)) {
            throw new Error(USERS_MESSAGE.OLD_PASSWORD_IS_INVALID)
          }
        }
      }
    },
    new_password: {
      ...passwordSchema
    },
    confirm_password: {
      ...passwordSchema,
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.new_password) {
            throw new Error(USERS_MESSAGE.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
          }
          return true
        }
      }
    }
  })
)
