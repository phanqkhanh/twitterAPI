import { MongoClient, Db, Collection } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/Register.schema'
import Follower from '~/models/schemas/Follower.schema'

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
      await this.db.command({ ping: 1 })
      console.log('Connected successfully to database')
    } catch (error) {
      console.log(error)
    }
  }
  //
  async indexUsers() {
    const exists = await this.users.indexExists(['email_1', 'email_1_password_1'])
    if (!exists) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      // this.users.createIndex({ username: 1},{ unique: true})
    }
  }
  async indexRefreshTokens() {
    const exists = await this.users.indexExists(['token_1'])
    if (!exists) {
      this.refreshTokens.createIndex({ token: 1 })
    }
  }
  async indexFollowers() {
    const exists = await this.users.indexExists(['user_id_1_follower_id_1'])
    if (!exists) {
      this.followers.createIndex({ user_id: 1, follower_id: 1 })
    }
  }
  get users(): Collection<User> {
    return this.db.collection('users')
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection('refreshTokens')
  }
  get followers(): Collection<Follower> {
    return this.db.collection('followers')
  }
}
const database = new Database()
export default database
