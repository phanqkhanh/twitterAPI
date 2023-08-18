import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/config/environment'
import { MediaType } from '~/constants/enum'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result = await Promise.all(
      files.map(async (file, index) => {
        const newName = await getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        return {
          message: `File ${index + 1} uploaded successfully`,
          type: MediaType.Image,
          url: isProduction
            ? `${process.env.HOST}/uploads/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/uploads/image/${newName}.jpg`
        }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const { newFilename } = files[0]
    return {
      message: 'File uploaded successfully',
      type: MediaType.Video,
      url: isProduction
        ? `${process.env.HOST}/uploads/video/${newFilename}`
        : `http://localhost:${process.env.PORT}/uploads/video/${newFilename}`
    }
  }
}

const mediasService = new MediasService()
export default mediasService
