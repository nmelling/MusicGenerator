import { Hono } from 'hono'
import lyrics from './modules/lyrics/lyrics'

const app = new Hono()

app.route('/lyrics', lyrics)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
