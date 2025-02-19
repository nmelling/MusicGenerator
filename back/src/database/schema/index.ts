import * as music from '@/database/schema/music'
import * as lyrics from '@/database/schema/lyrics'
import * as order from '@/database/schema/order'
import * as auth from '@/database/schema/auth'

export default {
  ...music,
  ...lyrics,
  ...order,
  ...auth,
}
