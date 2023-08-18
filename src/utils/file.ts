import { Request } from 'express'
import { File } from 'formidable'
import fs from 'fs'
import { filter } from 'lodash'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_TEMP_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'

export const initFolder = () => {
  ;[UPLOAD_TEMP_DIR, UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR].map((item) => {
    if (!fs.existsSync(item)) {
      fs.mkdirSync(item, {
        recursive: true
      })
    }
  })
}

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 300 * 1024, //300 KB,
    maxTotalFileSize: 300 * 1024 * 4,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type not allowed') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('Image file is empty'))
      }
      return resolve(files.image)
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024 //50 MB,
    // filter: function ({ name, originalFilename, mimetype }) {
    //   const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
    //   if (!valid) {
    //     form.emit('error' as any, new Error('File type not allowed') as any)
    //   }
    //   return valid
    // }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('Video file is empty'))
      }
      return resolve(files.video)
    })
  })
}

export const getNameFromFullName = (name: string) => {
  const nameArr = name.split('.')
  nameArr.pop()
  return nameArr.join('')
}
