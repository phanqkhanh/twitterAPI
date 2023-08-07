import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

export default async function connectToDatabase() {
  try {
    const url = process.env.DB_CONNECTION_STRING || ''
    const client = new MongoClient(url)
    await client.connect()
    console.log('Connected successfully to server')
  } catch (error) {
    console.log(error)
  }
}

// connectToDatabase()
//   .then(console.log)
//   .catch(console.error)
//   .finally(() => client.close())
