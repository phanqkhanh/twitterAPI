import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { config } from 'dotenv'
import log from './log'
import fs from 'fs'
import path from 'path'

config()
const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})

s3.listBuckets({})
  .then((buckets) => {
    // log(buckets, 15)
  })
  .catch((err) => {
    log(err, 18)
  })

// const file = fs.readFileSync(path.resolve('uploads/images/c9686fd51a6e6fd37b7779d00.jpg'))
export const uploadFileS3 = (filename: string, filepath: string, contentType: string) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: { Bucket: 'blog-buckets3', Key: filename, Body: fs.readFileSync(filepath), ContentType: contentType },

    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })
  return parallelUploads3.done()
}

// parallelUploads3.on('httpUploadProgress', (progress) => {
//   log(progress, 40)
// })

// parallelUploads3.done().then((res) => {
//   log(res, 44)
// })
