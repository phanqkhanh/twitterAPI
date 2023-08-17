import jwt from 'jsonwebtoken'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const signToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: jwt.SignOptions
}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) {
        reject(err)
      }
      resolve(token)
    })
  })
}

export const verifyToken = ({ token, secret }: { token: string; secret: string }) => {
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(token, secret, (err, token_decoded) => {
      if (err) {
        throw reject(new ErrorWithStatus({ message: err.message, status: HTTP_STATUS.UNAUTHORIZED }))
      }
      resolve(token_decoded as jwt.JwtPayload)
    })
  })
}
