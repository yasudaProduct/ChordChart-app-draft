import { serve } from '@hono/node-server'
import 'dotenv/config'
import { app } from './app'

const port = parseInt(process.env.PORT || '8080', 10)

console.log(`Server starting on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
