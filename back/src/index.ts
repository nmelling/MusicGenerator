import { Hono } from 'hono'
import lyrics from './lyrics'

const app = new Hono()

app.route('/lyrics', lyrics)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
