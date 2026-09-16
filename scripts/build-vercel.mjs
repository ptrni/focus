import { cp, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { buildBackend, run } from '../backend/scripts/build-vercel.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = join(root, '.vercel/output')
await rm(output, { recursive: true, force: true })
await buildBackend(output)
run('npm', ['run', 'build'], join(root, 'frontend'), {
  ...process.env, VITE_API_URL: '/api', FOCUS_FULLSTACK: '1',
})
await cp(join(root, 'frontend/dist'), join(output, 'static'), { recursive: true })
await writeFile(join(output, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '/api(?:/.*)?', dest: '/api/index' },
    { handle: 'filesystem' },
    { src: '/.*', dest: '/index.html' },
  ],
}, null, 2))
