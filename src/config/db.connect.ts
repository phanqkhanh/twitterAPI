import { MongoClient, Db, Collection } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/schemas/User.schema'

dotenv.config()
const url = process.env.DB_CONNECTION_STRING as string
class Database {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(url)
    this.db = this.client.db(process.env.DB_NAME)
  }
  async connect() {
    try {
      this.db.command({ ping: 1 })
      console.log('Connected successfully to database')
    } catch (error) {
      console.log(error)
    }
  }
  get users(): Collection<User> {
    return this.db.collection('users')
  }
}
const database = new Database()
export default database
