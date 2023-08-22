import { config } from 'dotenv'
import argv from 'minimist'
config()
const options = argv(process.argv.slice(2))

export const isProduction = Boolean(options.production)

export const envConfig = {
  port: (process.env.PORT as string) || 5000,
  host: process.env.HOST as string,
  dbConnectionString: process.env.DB_CONNECTION_STRING as string,
  dbName: process.env.DB_NAME as string,
  passwordSecret: process.env.PASSWORD_SECRET as string,
  clientUrl: process.env.CLIENT_URL as string,
  jwtSecretAccessToken: process.env.JWT_SECRET_ACCESS_TOKEN as string,
  jwtSecretRefreshToken: process.env.JWT_SECRET_REFRESH_TOKEN as string,
  jwtSecretVerifyEmailToken: process.env.JWT_VERIFY_EMAIL_TOKEN as string,
  jwtSecretForgotToken: process.env.JWT_SECRET_FORGOT_PASSWORD as string,
  accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES as string,
  refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES as string,
  emailTokenExpires: process.env.EMAIL_TOKEN_EXPIRES as string,
  forgotPasswordTokenExpires: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES as string,
  googleClientID: process.env.GOOGLE_CLIENT_ID as string,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  googleRedirectUrl: process.env.GOOGLE_REDIRECT_URL as string,
  clientRedirectUrl: process.env.CLIENT_REDIRECT_URL as string,
  awsAccessKeyID: process.env.AWS_ACCESS_KEY_ID as string,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  awsRegion: process.env.AWS_REGION as string,
  sesFromAddress: process.env.SES_FROM_ADDRESS as string
}
