import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'
import usersService from '~/services/users.services'
const getUser = (req: Request, res: Response) => {

}

const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const result = await usersService.register(req.body)
    return res.status(200).json({
      msg: 'Success',
      result
    })
  } catch (error) {
    return res.status(200).json({
      msg: 'Error',
      error
    })
  }
}

export { getUser, registerController }
