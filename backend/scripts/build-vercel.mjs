import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve, join } from 'node:path'

const backend = fileURLToPath(new URL('../', import.meta.url))
export function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`)
}

export async function buildBackend(output) {
  run('npm', ['run', 'build'], backend)
  const functionDir = join(output, 'functions/api/index.func')
  await mkdir(functionDir, { recursive: true })
  await cp(join(backend, 'build'), functionDir, { recursive: true })
  run('npm', ['ci', '--omit=dev', '--prefix', functionDir], backend)
  await writeFile(join(functionDir, 'index.mjs'), "export { default } from './bin/vercel.js'\n")
  await writeFile(join(functionDir, '.vc-config.json'), JSON.stringify({
    runtime: 'nodejs24.x', handler: 'index.mjs', launcherType: 'Nodejs',
    shouldAddHelpers: false, maxDuration: 30,
    environment: { NODE_ENV: 'production' },
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const output = join(backend, '.vercel/output')
  await rm(output, { recursive: true, force: true })
  await buildBackend(output)
  await writeFile(join(output, 'config.json'), JSON.stringify({
    version: 3, routes: [{ src: '/api(?:/.*)?', dest: '/api/index' }],
  }, null, 2))
}
