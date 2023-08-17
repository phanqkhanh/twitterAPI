import { ObjectId } from 'mongodb'

interface FollowerType {
  _id?: ObjectId
  user_id: ObjectId
  follower_id: ObjectId
  created_at?: Date
}

export default class Follower {
  _id?: ObjectId
  user_id: ObjectId
  follower_id: ObjectId
  created_at?: Date
  constructor({ _id, user_id, follower_id, created_at }: FollowerType) {
    this._id = _id
    this.user_id = user_id
    this.follower_id = follower_id
    this.created_at = created_at || new Date()
  }
}
