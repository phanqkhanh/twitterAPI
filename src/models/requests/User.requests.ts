export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}
export interface UpdateProfileReqBody {
  user_id: string
  name: string
  date_of_birth: string
  bio: string
  location: string
  website: string
  username: string
  avatar: string
  cover_photo: string
}
