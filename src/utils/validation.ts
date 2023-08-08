import { NextFunction, Request, Response } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)
    const error = validationResult(req)
    if (error.isEmpty()) {
      return next()
    }
    res.status(400).json({ errors: error.mapped() })
  }
}
