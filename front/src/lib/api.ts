import { hc } from 'hono/client'
import type { MusicRoutes } from '../../../back/src/modules/music/music'
import type { OrderRoutes } from '../../../back/src/modules/order/order'

const baseUrl = 'http://localhost:3000/api'

export const musicClient = hc<MusicRoutes>(`${baseUrl}/music`)
const orderClient = hc<OrderRoutes>(`${baseUrl}/order`)

export default fetch