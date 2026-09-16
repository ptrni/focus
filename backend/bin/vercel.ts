import 'reflect-metadata'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Ignitor } from '@adonisjs/core'

const APP_ROOT = new URL('../', import.meta.url)
const ignitor = new Ignitor(APP_ROOT, {
  importer: (path) => import(path.startsWith('.') ? new URL(path, APP_ROOT).href : path),
}).tap(app => {
  app.booting(async () => { await import('#start/env') })
})

async function boot() {
  const app = ignitor.createApp('web')
  await app.init()
  await app.boot()
  const server = await app.container.make('server')
  await app.start(async () => { await server.boot() })
  return server
}

// A shared promise prevents concurrent cold-start requests from booting twice.
// Vercel owns the HTTP listener; do not call httpServer().start() here.
let serverPromise: ReturnType<typeof boot> | undefined
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const server = await (serverPromise ??= boot())
    return await server.handle(req, res)
  } catch (error) {
    console.error('API request failed', error)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ message: 'The server is unavailable. Please try again later.' }))
    } else if (!res.writableEnded) {
      res.end()
    }
  }
}
