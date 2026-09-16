import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'

test('packaged Vercel API handles concurrent requests, CORS, JSON bodies and missing routes', async () => {
  Object.assign(process.env, {
    NODE_ENV: 'production', APP_KEY: randomBytes(32).toString('base64'),
    FRONTEND_ORIGIN: 'https://focus-sepia-beta.vercel.app',
    PG_HOST: '127.0.0.1', PG_PORT: '5432', PG_USER: 'todo', PG_PASSWORD: 'test', PG_DB_NAME: 'todo',
  })
  // Import the deployed artifact, including its own production dependencies.
  const { default: handler } = await import('../../.vercel/output/functions/api/index.func/index.mjs')
  const server = createServer(handler)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    const responses = await Promise.all(Array.from({ length: 8 }, () => fetch(`${base}/api/health`)))
    for (const response of responses) {
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { status: 'ok' })
    }
    const cors = await fetch(`${base}/api/todos`, { method: 'OPTIONS', headers: {
      Origin: process.env.FRONTEND_ORIGIN, 'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'content-type',
    } })
    assert.equal(cors.headers.get('access-control-allow-origin'), process.env.FRONTEND_ORIGIN)
    const wrongType = await fetch(`${base}/api/todos`, { method: 'POST', body: 'invalid' })
    assert.equal(wrongType.status, 415)
    const malformed = await fetch(`${base}/api/todos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    })
    assert.equal(malformed.status, 400)
    const invalidTask = await fetch(`${base}/api/todos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '' }),
    })
    assert.equal(invalidTask.status, 422)
    assert.match((await invalidTask.json()).message, /Title/)
    const missing = await fetch(`${base}/api/does-not-exist`, { headers: { Accept: 'application/json' } })
    assert.equal(missing.status, 404)
    assert.doesNotMatch(await missing.text(), /<div id="root">/)
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
})

test('deployment routes preserve API paths before the SPA fallback', async () => {
  const output = new URL('../../.vercel/output/', import.meta.url)
  const config = JSON.parse(await readFile(new URL('config.json', output)))
  assert.equal(config.version, 3)
  const [api, files, spa] = config.routes
  assert.equal(api.dest, '/api/index')
  for (const path of ['/api', '/api/health', '/api/todos/42']) assert.match(path, new RegExp(`^${api.src}$`))
  assert.doesNotMatch('/apiary', new RegExp(`^${api.src}$`))
  assert.equal(files.handle, 'filesystem')
  assert.equal(spa.dest, '/index.html')
  const html = await readFile(new URL('static/index.html', output), 'utf8')
  const scriptPath = html.match(/src="(\/assets\/[^\"]+\.js)"/)[1]
  const js = await readFile(new URL(`static${scriptPath}`, output), 'utf8')
  assert.ok(!js.includes('http://localhost:3333/api'), 'Production must not call a visitor’s localhost')
})
