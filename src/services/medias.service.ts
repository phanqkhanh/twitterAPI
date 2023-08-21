import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/config/environment'
import { MediaType } from '~/constants/enum'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { uploadFileS3 } from '~/utils/s3'
import mime from 'mime'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import fsPromise from 'fs/promises'

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result = await Promise.all(
      files.map(async (file, index) => {
        const newName = (await getNameFromFullName(file.newFilename)) + '.jpg'
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newName)
        await sharp(file.filepath).jpeg().toFile(newPath)

        const s3Result = await uploadFileS3(`images/${newName}`, newPath, mime.getType(newPath) as string)

        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        return {
          message: `File ${index + 1} uploaded successfully`,
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location,
          type: MediaType.Image
        }
        // return {
        //   message: `File ${index + 1} uploaded successfully`,
        //   type: MediaType.Image,
        //   url: isProduction
        //     ? `${process.env.HOST}/uploads/image/${newName}.jpg`
        //     : `http://localhost:${process.env.PORT}/uploads/image/${newName}.jpg`
        // }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    // const  { newFilename } = files[0]
    const file = files[0]

    const s3Result = await uploadFileS3(
      `videos/${file.newFilename}`,
      file.filepath,
      mime.getType(file.filepath) as string
    )
    fsPromise.unlink(file.filepath)
    return {
      message: 'File uploaded successfully',
      type: MediaType.Video,
      url: (s3Result as CompleteMultipartUploadCommandOutput).Location
    }
    // return {
    //   message: 'File uploaded successfully',
    //   type: MediaType.Video,
    //   url: isProduction
    //     ? `${process.env.HOST}/uploads/video/${newFilename}`
    //     : `http://localhost:${process.env.PORT}/uploads/video/${newFilename}`
    // }
  }
}

const mediasService = new MediasService()
export default mediasService
