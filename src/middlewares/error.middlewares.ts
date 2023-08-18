import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const errMsg = err.status ? { ...omit(err, 'status') } : { message: err.message }
  res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errMsg)
}
