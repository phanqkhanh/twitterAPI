import { NextFunction, Request, Response } from 'express'
import path from 'path'
import mediasService from '~/services/medias.service'

const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.uploadImage(req)
  res.json(result)
}

const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.uploadVideo(req)
  res.json(result)
}

export { uploadImageController, uploadVideoController }
